/**
 * Network request/response log store.
 *
 * Keeps a bounded, in-memory ring buffer of the HTTP traffic the app sends to
 * the Frappe backend so field issues can be diagnosed from a release build,
 * where `logger` (which is gated on __DEV__) writes nothing.
 *
 * Every entry records who was signed in, what was sent and what came back.
 * Bodies are truncated and secrets are redacted before anything is stored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'grm_network_log_v1';
const MAX_ENTRIES = 200;
const MAX_BODY_CHARS = 2000;
const PERSIST_DEBOUNCE_MS = 3000;

/** Header names whose values must never reach the log. */
const REDACTED_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-frappe-csrf-token'];

/** Body keys whose values must never reach the log. */
const REDACTED_KEYS = [
  'pwd',
  'password',
  'new_password',
  'old_password',
  'token',
  'sid',
  'api_key',
  'api_secret',
  'secret',
];

const REDACTED = '<redacted>';

/**
 * Replace secret-bearing values in a JSON-ish string without needing it to
 * parse. Login payloads are the main target: they are the one place a
 * plaintext password would otherwise be written to disk.
 */
const redactBody = (body) => {
  if (!body) return body;
  let out = body;
  REDACTED_KEYS.forEach((key) => {
    // JSON form: "pwd":"secret"
    out = out.replace(new RegExp(`("${key}"\\s*:\\s*)"[^"]*"`, 'gi'), `$1"${REDACTED}"`);
    // Form-encoded / query form: pwd=secret
    out = out.replace(new RegExp(`(\\b${key}=)[^&\\s]*`, 'gi'), `$1${REDACTED}`);
  });
  return out;
};

const redactHeaders = (headers) => {
  if (!headers) return {};
  return Object.keys(headers).reduce((acc, key) => {
    acc[key] = REDACTED_HEADERS.includes(key.toLowerCase()) ? REDACTED : headers[key];
    return acc;
  }, {});
};

const truncate = (value) => {
  if (value === null || value === undefined) return null;
  const text = typeof value === 'string' ? value : String(value);
  if (text.length <= MAX_BODY_CHARS) return text;
  return `${text.slice(0, MAX_BODY_CHARS)}\n… [truncated ${text.length - MAX_BODY_CHARS} chars of ${text.length}]`;
};

class NetworkLogger {
  constructor() {
    this.entries = [];
    this.user = null;
    this.enabled = true;
    this.listeners = new Set();
    this.persistTimer = null;
    this.hydrated = false;
    this.nextId = 1;
  }

  /** Identify the signed-in user so each entry says who made the call. */
  setUser(user) {
    if (!user) {
      this.user = null;
      return;
    }
    this.user = user.email || user.message || user.username || user.name || String(user);
  }

  getUser() {
    return this.user;
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.entries);
      } catch (_error) {
        // A broken listener must never take down a network call.
      }
    });
  }

  /**
   * Record one completed (or failed) request.
   *
   * @param entry.method     HTTP verb.
   * @param entry.url        Absolute request URL.
   * @param entry.status     HTTP status, or 0 when the request never completed.
   * @param entry.durationMs Wall time from send() to completion.
   */
  add(entry) {
    if (!this.enabled) return;

    const record = {
      id: this.nextId,
      timestamp: new Date().toISOString(),
      user: this.user,
      method: entry.method || 'GET',
      url: entry.url,
      status: entry.status ?? 0,
      durationMs: entry.durationMs ?? null,
      requestHeaders: redactHeaders(entry.requestHeaders),
      requestBody: truncate(redactBody(entry.requestBody)),
      responseBody: truncate(redactBody(entry.responseBody)),
      error: entry.error || null,
      // Cleared once the entry has been accepted by the backend, so a failed
      // upload retries instead of losing the record.
      uploaded: false,
    };
    this.nextId += 1;

    this.entries.unshift(record);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.length = MAX_ENTRIES;
    }

    this.notify();
    this.schedulePersist();
  }

  getEntries() {
    return this.entries;
  }

  /**
   * Oldest-first slice of entries not yet accepted by the backend. Oldest
   * first so the upload preserves chronological order even when a backlog
   * built up offline.
   */
  getPending(limit) {
    const pending = this.entries.filter((entry) => !entry.uploaded);
    pending.reverse();
    return typeof limit === 'number' ? pending.slice(0, limit) : pending;
  }

  markUploaded(ids) {
    const uploadedIds = new Set(ids);
    this.entries.forEach((entry) => {
      if (uploadedIds.has(entry.id)) {
        entry.uploaded = true;
      }
    });
    this.schedulePersist();
  }

  /** Write to disk on a debounce so a burst of calls costs one write. */
  schedulePersist() {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persist();
    }, PERSIST_DEBOUNCE_MS);
  }

  async persist() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (_error) {
      // Persistence is best-effort; the in-memory buffer is still usable.
    }
  }

  /** Restore the previous session's log so a crash-then-restart is diagnosable. */
  async hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored)) return;
      this.entries = stored.slice(0, MAX_ENTRIES);
      this.nextId = this.entries.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1;
      this.notify();
    } catch (_error) {
      // A corrupt log must not block startup.
    }
  }

  async clear() {
    this.entries = [];
    this.nextId = 1;
    this.notify();
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (_error) {
      // Nothing further to do; the buffer is already empty.
    }
  }

  /** Flatten the buffer into shareable plain text. */
  toText() {
    const header = [
      `eGRM network log`,
      `exported: ${new Date().toISOString()}`,
      `user: ${this.user || '(not signed in)'}`,
      `entries: ${this.entries.length}`,
      '',
    ].join('\n');

    const body = this.entries
      .map((e) => {
        const lines = [
          '='.repeat(60),
          `#${e.id}  ${e.timestamp}`,
          `user     : ${e.user || '(not signed in)'}`,
          `request  : ${e.method} ${e.url}`,
          `status   : ${e.status}${e.durationMs !== null ? `  (${e.durationMs}ms)` : ''}`,
        ];
        if (e.requestBody) lines.push(`req body :\n${e.requestBody}`);
        if (e.responseBody) lines.push(`res body :\n${e.responseBody}`);
        if (e.error) lines.push(`error    : ${e.error}`);
        return lines.join('\n');
      })
      .join('\n');

    return `${header}${body}`;
  }
}

export const networkLogger = new NetworkLogger();
export default networkLogger;
