// electron/api/keyPool.js — API Key Pool Manager with failover
// CommonJS module

class KeyPool {
  constructor() {
    this.keys = [];
    this._index = 0; // round-robin pointer
  }

  /**
   * Load keys from an array of key config objects.
   * Each entry: { key, baseUrl?, model? }
   */
  loadKeys(keys) {
    if (!Array.isArray(keys)) return;

    this.keys = keys.map((k) => ({
      key: k.key,
      baseUrl: k.baseUrl || 'https://openrouter.ai/api/v1/chat/completions',
      model: k.model || 'gpt-4o-mini',
      status: k.status || 'active',       // 'active' | 'failed' | 'rate-limited'
      lastError: k.lastError || null,
      errorCount: Number.isFinite(k.errorCount) ? k.errorCount : 0,
      lastUsed: k.lastUsed || null,
      requestCount: Number.isFinite(k.requestCount) ? k.requestCount : 0,
    }));

    this._index = 0;
    console.log(`[KeyPool] Loaded ${this.keys.length} key(s)`);
  }

  /**
   * Return the next available key using round-robin among 'active' keys.
   * Throws if no keys are available at all.
   */
  getNextKey() {
    if (this.keys.length === 0) {
      throw new Error('No API keys available — add at least one key in Settings.');
    }

    // First pass — try active keys
    const active = this.keys.filter((k) => k.status === 'active');

    if (active.length > 0) {
      this._index = this._index % active.length;
      const chosen = active[this._index];
      this._index = (this._index + 1) % active.length;
      chosen.lastUsed = Date.now();
      return chosen;
    }

    // Second pass — try resetting rate-limited keys (they may have recovered)
    const rateLimited = this.keys.filter((k) => k.status === 'rate-limited');
    if (rateLimited.length > 0) {
      console.log('[KeyPool] All active keys exhausted — resetting rate-limited keys');
      rateLimited.forEach((k) => {
        k.status = 'active';
        k.errorCount = 0;
      });
      return this.getNextKey();
    }

    // Truly no keys available
    throw new Error(
      'No API keys available — all keys are marked as failed. Check your keys in Settings.'
    );
  }

  /**
   * Mark a key as failed / rate-limited based on the error.
   */
  markFailed(keyObj, error) {
    if (!keyObj) return;

    const statusCode = error && (error.statusCode || error.status);
    const message = error && (error.message || String(error));

    keyObj.lastError = message;

    // 429 — Rate limited
    if (statusCode === 429 || (message && message.includes('429'))) {
      keyObj.status = 'rate-limited';
      console.log(`[KeyPool] Key …${keyObj.key.slice(-6)} rate-limited (429). Will retry in 60 s.`);

      // Auto-reset after 60 seconds
      setTimeout(() => {
        if (keyObj.status === 'rate-limited') {
          keyObj.status = 'active';
          keyObj.errorCount = 0;
          console.log(`[KeyPool] Key …${keyObj.key.slice(-6)} auto-reset from rate-limited`);
        }
      }, 60_000);
      return;
    }

    // 401 / 403 — Permanently failed (bad / revoked key)
    if (statusCode === 401 || statusCode === 403) {
      keyObj.status = 'failed';
      console.log(`[KeyPool] Key …${keyObj.key.slice(-6)} permanently failed (${statusCode})`);
      return;
    }

    // 500 / 502 / 503 — Server errors (transient)
    if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
      keyObj.errorCount += 1;
      if (keyObj.errorCount > 3) {
        keyObj.status = 'failed';
        console.log(`[KeyPool] Key …${keyObj.key.slice(-6)} failed after ${keyObj.errorCount} server errors`);
      } else {
        console.log(`[KeyPool] Key …${keyObj.key.slice(-6)} server error #${keyObj.errorCount}`);
      }
      return;
    }

    // Timeout or unknown errors
    if (message && (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNABORTED'))) {
      keyObj.status = 'rate-limited';
      console.log(`[KeyPool] Key …${keyObj.key.slice(-6)} timed out — marking rate-limited`);
      setTimeout(() => {
        if (keyObj.status === 'rate-limited') {
          keyObj.status = 'active';
          keyObj.errorCount = 0;
        }
      }, 60_000);
      return;
    }

    // Fallback — increment error count
    keyObj.errorCount += 1;
    if (keyObj.errorCount > 3) {
      keyObj.status = 'failed';
    }
    console.log(`[KeyPool] Key …${keyObj.key.slice(-6)} error #${keyObj.errorCount}: ${message}`);
  }

  /**
   * Mark a key as successfully used.
   */
  markSuccess(keyObj) {
    if (!keyObj) return;
    keyObj.errorCount = 0;
    keyObj.status = 'active';
    keyObj.requestCount += 1;
    keyObj.lastError = null;
  }

  /**
   * Return an array of key status summaries (safe for UI — keys are masked).
   */
  getStatus() {
    return this.keys.map((k) => ({
      keyHint: k.key ? `…${k.key.slice(-6)}` : '(empty)',
      baseUrl: k.baseUrl,
      model: k.model,
      status: k.status,
      lastError: k.lastError,
      errorCount: k.errorCount,
      requestCount: k.requestCount,
      lastUsed: k.lastUsed,
    }));
  }

  /**
   * Reset every key back to 'active'.
   */
  resetAll() {
    this.keys.forEach((k) => {
      k.status = 'active';
      k.errorCount = 0;
      k.lastError = null;
    });
    this._index = 0;
    console.log('[KeyPool] All keys reset to active');
  }
}

module.exports = KeyPool;
