/**
 * Ships buffered backend-request logs to Frappe.
 *
 * The in-app viewer only helps somebody holding the phone. Uploading the same
 * buffer to `GRM App Request Log` lets administrators aggregate field activity
 * in the desk: who is using the app, which endpoints fail, and which app
 * versions are actually deployed.
 *
 * Uploads are best-effort. When the device is offline or the session has
 * expired, entries stay pending and go out on a later attempt.
 */

import { Platform } from 'react-native';
import { FRAPPE_BASE_URL } from './constants';
import { networkLogger } from './networkLogger';
import { getAppVersion, getRuntimeVersion } from './version';
import { logger } from './logger';

/** Kept here so the interceptor can exclude this call from its own logging. */
export const LOG_INGEST_PATH = '/api/method/egrm.api.app_logs.ingest';

const UPLOAD_INTERVAL_MS = 60000;
const MAX_PER_UPLOAD = 25;

let timer = null;
let inFlight = false;

/**
 * Push one batch of pending entries. Returns the number uploaded.
 *
 * Entries are only marked uploaded on a confirmed 2xx, so a failed attempt
 * retries rather than silently dropping the evidence.
 */
export const uploadPendingLogs = async () => {
  if (inFlight) return 0;
  if (!FRAPPE_BASE_URL) return 0;

  const pending = networkLogger.getPending(MAX_PER_UPLOAD);
  if (pending.length === 0) return 0;

  inFlight = true;
  try {
    const payload = pending.map((entry) => ({
      timestamp: entry.timestamp,
      method: entry.method,
      url: entry.url,
      status: entry.status,
      durationMs: entry.durationMs,
      requestBody: entry.requestBody,
      responseBody: entry.responseBody,
      error: entry.error,
      appVersion: getAppVersion(),
      runtimeVersion: getRuntimeVersion(),
      platform: `${Platform.OS} ${Platform.Version}`,
    }));

    const response = await fetch(`${FRAPPE_BASE_URL}${LOG_INGEST_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Frappe authenticates the app by session cookie, which React Native's
      // fetch sends automatically.
      credentials: 'include',
      body: JSON.stringify({ logs: payload }),
    });

    if (!response.ok) {
      // 401/403 simply means nobody is signed in yet; try again next tick.
      logger.debug('Log upload rejected', { status: response.status });
      return 0;
    }

    networkLogger.markUploaded(pending.map((entry) => entry.id));
    return pending.length;
  } catch (error) {
    logger.debug('Log upload failed (likely offline)', { message: error?.message });
    return 0;
  } finally {
    inFlight = false;
  }
};

/** Begin periodic uploads. Safe to call more than once. */
export const startLogUploads = () => {
  if (timer) return;
  timer = setInterval(() => {
    uploadPendingLogs();
  }, UPLOAD_INTERVAL_MS);
};

export const stopLogUploads = () => {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
};
