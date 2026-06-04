// electron/api/__tests__/keyPool.test.js
// Unit tests for the KeyPool manager

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const KeyPool = (await import('../keyPool.js')).default
  ?? (await import('../keyPool.js'));

let pool;

beforeEach(() => {
  pool = new KeyPool();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── loadKeys ────────────────────────────────────────────────────────

describe('loadKeys', () => {
  it('loads an array of key configs', () => {
    pool.loadKeys([
      { key: 'sk-key-1', model: 'gpt-4o-mini' },
      { key: 'sk-key-2', model: 'llama-3:free' },
    ]);
    expect(pool.keys).toHaveLength(2);
  });

  it('sets default values for missing fields', () => {
    pool.loadKeys([{ key: 'sk-test' }]);
    const k = pool.keys[0];
    expect(k.baseUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(k.model).toBe('gpt-4o-mini');
    expect(k.status).toBe('active');
    expect(k.errorCount).toBe(0);
    expect(k.requestCount).toBe(0);
    expect(k.lastError).toBeNull();
    expect(k.lastUsed).toBeNull();
  });

  it('resets the round-robin index on load', () => {
    pool.loadKeys([{ key: 'a' }, { key: 'b' }, { key: 'c' }]);
    pool.getNextKey(); // advances index
    pool.getNextKey();
    pool.loadKeys([{ key: 'x' }, { key: 'y' }]);
    // After reload, index resets — first key returned should be 'x'
    expect(pool.getNextKey().key).toBe('x');
  });

  it('ignores non-array input', () => {
    pool.loadKeys('not an array');
    expect(pool.keys).toHaveLength(0);
    pool.loadKeys(null);
    expect(pool.keys).toHaveLength(0);
  });
});

// ─── getNextKey (round-robin) ────────────────────────────────────────

describe('getNextKey', () => {
  it('throws when no keys are loaded', () => {
    expect(() => pool.getNextKey()).toThrow('No API keys available');
  });

  it('returns keys in round-robin order', () => {
    pool.loadKeys([{ key: 'A' }, { key: 'B' }, { key: 'C' }]);

    expect(pool.getNextKey().key).toBe('A');
    expect(pool.getNextKey().key).toBe('B');
    expect(pool.getNextKey().key).toBe('C');
    expect(pool.getNextKey().key).toBe('A'); // wraps around
  });

  it('skips failed keys', () => {
    pool.loadKeys([{ key: 'A' }, { key: 'B' }, { key: 'C' }]);
    pool.keys[1].status = 'failed'; // B is failed

    const results = [
      pool.getNextKey().key,
      pool.getNextKey().key,
      pool.getNextKey().key,
    ];

    expect(results).toEqual(['A', 'C', 'A']);
    expect(results).not.toContain('B');
  });

  it('skips rate-limited keys initially', () => {
    pool.loadKeys([{ key: 'A' }, { key: 'B' }]);
    pool.keys[0].status = 'rate-limited';

    expect(pool.getNextKey().key).toBe('B');
  });

  it('resets rate-limited keys when all active are exhausted', () => {
    pool.loadKeys([{ key: 'A' }, { key: 'B' }]);
    pool.keys[0].status = 'rate-limited';
    pool.keys[1].status = 'rate-limited';

    // Both rate-limited — should reset them and return one
    const key = pool.getNextKey();
    expect(key.status).toBe('active');
  });

  it('throws when all keys are failed (not rate-limited)', () => {
    pool.loadKeys([{ key: 'A' }, { key: 'B' }]);
    pool.keys[0].status = 'failed';
    pool.keys[1].status = 'failed';

    expect(() => pool.getNextKey()).toThrow('all keys are marked as failed');
  });

  it('sets lastUsed timestamp', () => {
    pool.loadKeys([{ key: 'A' }]);
    const before = Date.now();
    const key = pool.getNextKey();
    expect(key.lastUsed).toBeGreaterThanOrEqual(before);
  });
});

// ─── markSuccess ─────────────────────────────────────────────────────

describe('markSuccess', () => {
  it('resets error state and increments request count', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];
    key.errorCount = 3;
    key.status = 'rate-limited';
    key.lastError = 'some error';

    pool.markSuccess(key);

    expect(key.errorCount).toBe(0);
    expect(key.status).toBe('active');
    expect(key.requestCount).toBe(1);
    expect(key.lastError).toBeNull();
  });

  it('increments request count cumulatively', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];

    pool.markSuccess(key);
    pool.markSuccess(key);
    pool.markSuccess(key);

    expect(key.requestCount).toBe(3);
  });

  it('handles null/undefined input gracefully', () => {
    expect(() => pool.markSuccess(null)).not.toThrow();
    expect(() => pool.markSuccess(undefined)).not.toThrow();
  });
});

// ─── markFailed ──────────────────────────────────────────────────────

describe('markFailed', () => {
  it('marks key as rate-limited on 429', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];
    const error = new Error('Too Many Requests');
    error.statusCode = 429;

    pool.markFailed(key, error);

    expect(key.status).toBe('rate-limited');
  });

  it('auto-recovers rate-limited key after 60 seconds', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];
    const error = new Error('429');
    error.statusCode = 429;

    pool.markFailed(key, error);
    expect(key.status).toBe('rate-limited');

    vi.advanceTimersByTime(60_000);

    expect(key.status).toBe('active');
    expect(key.errorCount).toBe(0);
  });

  it('marks key as permanently failed on 401', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];
    const error = new Error('Unauthorized');
    error.statusCode = 401;

    pool.markFailed(key, error);

    expect(key.status).toBe('failed');
  });

  it('marks key as permanently failed on 403', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];
    const error = new Error('Forbidden');
    error.statusCode = 403;

    pool.markFailed(key, error);

    expect(key.status).toBe('failed');
  });

  it('tolerates transient 5xx errors up to 3 times', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];
    const err500 = new Error('Internal Server Error');
    err500.statusCode = 500;

    pool.markFailed(key, err500);
    expect(key.status).toBe('active');
    expect(key.errorCount).toBe(1);

    pool.markFailed(key, err500);
    expect(key.status).toBe('active');
    expect(key.errorCount).toBe(2);

    pool.markFailed(key, err500);
    expect(key.status).toBe('active');
    expect(key.errorCount).toBe(3);

    pool.markFailed(key, err500); // 4th time — fails
    expect(key.status).toBe('failed');
    expect(key.errorCount).toBe(4);
  });

  it('marks key as rate-limited on timeout errors', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];

    pool.markFailed(key, new Error('connect timeout while reaching host'));
    expect(key.status).toBe('rate-limited');
  });

  it('marks key as rate-limited on ETIMEDOUT', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];

    pool.markFailed(key, new Error('connect ETIMEDOUT 1.2.3.4'));
    expect(key.status).toBe('rate-limited');
  });

  it('auto-recovers timeout-based rate-limit after 60 seconds', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];

    pool.markFailed(key, new Error('ECONNABORTED'));
    expect(key.status).toBe('rate-limited');

    vi.advanceTimersByTime(60_000);

    expect(key.status).toBe('active');
    expect(key.errorCount).toBe(0);
  });

  it('records lastError message', () => {
    pool.loadKeys([{ key: 'A' }]);
    const key = pool.keys[0];

    pool.markFailed(key, new Error('Something went wrong'));
    expect(key.lastError).toBe('Something went wrong');
  });

  it('handles null/undefined input gracefully', () => {
    expect(() => pool.markFailed(null, new Error('test'))).not.toThrow();
    expect(() => pool.markFailed(undefined, null)).not.toThrow();
  });
});

// ─── resetAll ────────────────────────────────────────────────────────

describe('resetAll', () => {
  it('resets all keys to active', () => {
    pool.loadKeys([{ key: 'A' }, { key: 'B' }, { key: 'C' }]);
    pool.keys[0].status = 'failed';
    pool.keys[1].status = 'rate-limited';
    pool.keys[2].errorCount = 5;
    pool.keys[2].lastError = 'oops';

    pool.resetAll();

    pool.keys.forEach((k) => {
      expect(k.status).toBe('active');
      expect(k.errorCount).toBe(0);
      expect(k.lastError).toBeNull();
    });
  });

  it('resets the round-robin index', () => {
    pool.loadKeys([{ key: 'A' }, { key: 'B' }]);
    pool.getNextKey(); // index moves
    pool.getNextKey();

    pool.resetAll();

    expect(pool.getNextKey().key).toBe('A');
  });
});

// ─── getStatus ───────────────────────────────────────────────────────

describe('getStatus', () => {
  it('returns masked key summaries', () => {
    pool.loadKeys([{ key: 'sk-or-v1-abc123def456' }]);
    const status = pool.getStatus();

    expect(status).toHaveLength(1);
    expect(status[0].keyHint).toBe('…def456');
    expect(status[0]).not.toHaveProperty('key'); // full key must NOT be exposed
  });

  it('returns empty array when no keys loaded', () => {
    expect(pool.getStatus()).toEqual([]);
  });

  it('includes all status fields', () => {
    pool.loadKeys([{ key: 'sk-test-key-12345678' }]);
    const [s] = pool.getStatus();

    expect(s).toHaveProperty('keyHint');
    expect(s).toHaveProperty('baseUrl');
    expect(s).toHaveProperty('model');
    expect(s).toHaveProperty('status');
    expect(s).toHaveProperty('lastError');
    expect(s).toHaveProperty('errorCount');
    expect(s).toHaveProperty('requestCount');
    expect(s).toHaveProperty('lastUsed');
  });
});
