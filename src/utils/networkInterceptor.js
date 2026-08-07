/**
 * Global HTTP interceptor feeding {@link networkLogger}.
 *
 * Patches XMLHttpRequest rather than fetch: React Native implements fetch on
 * top of XHR and frappe-js-sdk uses axios, which also uses XHR. Patching this
 * one layer therefore captures every request the app makes, whichever client
 * issued it.
 */

/* global XMLHttpRequest */
import { networkLogger } from './networkLogger';
import { FRAPPE_BASE_URL } from './constants';
import { LOG_INGEST_PATH } from './logUploader';

let installed = false;

/**
 * Only traffic addressed to the Frappe backend is logged. Everything else the
 * runtime emits — Metro, expo-updates manifest and asset fetches, image CDN
 * loads — is noise for diagnosing backend behaviour and would evict real
 * entries from the ring buffer.
 */
const isBackendRequest = (url) => {
  if (!url || !FRAPPE_BASE_URL) return false;
  const target = String(url);
  if (!target.startsWith(FRAPPE_BASE_URL)) return false;
  // The log upload is itself a backend call. Logging it would append a new
  // entry for every upload, which would trigger another upload — an endless
  // feedback loop. Exclude it explicitly.
  if (target.includes(LOG_INGEST_PATH)) return false;
  return true;
};

/** Bodies we can read as text; anything else is noted but not captured. */
const describeRequestBody = (body) => {
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') return body;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return '[FormData]';
  return '[non-text body]';
};

/**
 * Read the response as text when it is safe to do so. Accessing responseText
 * throws for blob/arraybuffer response types, so those are skipped.
 */
const describeResponseBody = (xhr) => {
  try {
    if (xhr.responseType && xhr.responseType !== 'text' && xhr.responseType !== '') {
      return `[${xhr.responseType} response]`;
    }
    return xhr.responseText;
  } catch (_error) {
    return '[unreadable response]';
  }
};

export const installNetworkInterceptor = () => {
  if (installed) return;
  if (typeof XMLHttpRequest === 'undefined') return;
  installed = true;

  const XHR = XMLHttpRequest.prototype;
  const originalOpen = XHR.open;
  const originalSend = XHR.send;
  const originalSetRequestHeader = XHR.setRequestHeader;

  XHR.open = function open(method, url, ...rest) {
    this.__grmLog = isBackendRequest(url) ? { method, url, headers: {} } : null;
    return originalOpen.call(this, method, url, ...rest);
  };

  XHR.setRequestHeader = function setRequestHeader(header, value) {
    if (this.__grmLog) {
      this.__grmLog.headers[header] = value;
    }
    return originalSetRequestHeader.call(this, header, value);
  };

  XHR.send = function send(body) {
    const meta = this.__grmLog;

    if (meta) {
      meta.startedAt = Date.now();
      meta.body = describeRequestBody(body);

      // loadend fires for success, error, abort and timeout alike, so one
      // handler covers every terminal state without double-recording.
      this.addEventListener('loadend', () => {
        if (meta.recorded) return;
        meta.recorded = true;

        networkLogger.add({
          method: meta.method,
          url: meta.url,
          status: this.status,
          durationMs: Date.now() - meta.startedAt,
          requestHeaders: meta.headers,
          requestBody: meta.body,
          responseBody: describeResponseBody(this),
          error:
            this.status === 0 ? 'request did not complete (network error, abort or timeout)' : null,
        });
      });
    }

    return originalSend.call(this, body);
  };
};

export default installNetworkInterceptor;
