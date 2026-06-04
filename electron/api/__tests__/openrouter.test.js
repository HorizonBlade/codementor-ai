// electron/api/__tests__/openrouter.test.js
// Unit tests for OpenRouter JSON repair & parsing logic

import { describe, it, expect, beforeEach } from 'vitest';

// OpenRouter is a CommonJS module — we import it dynamically
// and instantiate with a dummy key pool
const OpenRouter = (await import('../openrouter.js')).default
  ?? (await import('../openrouter.js'));

// Minimal stub so the constructor doesn't crash
const dummyKeyPool = { keys: [], getNextKey: () => {}, markSuccess: () => {}, markFailed: () => {} };

let router;

beforeEach(() => {
  router = new OpenRouter(dummyKeyPool);
});

// ─── _repairJSON ──────────────────────────────────────────────────────

describe('_repairJSON', () => {
  it('returns clean JSON untouched', () => {
    const input = '{"title":"Hello","value":42}';
    expect(router._repairJSON(input)).toBe(input);
  });

  it('strips markdown ```json fences', () => {
    const input = '```json\n{"title":"Hello"}\n```';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ title: 'Hello' });
  });

  it('strips markdown ``` fences without language tag', () => {
    const input = '```\n{"a":1}\n```';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it('strips leading text before the first JSON object', () => {
    const input = 'Here is the task:\n\n{"title":"Two Sum","difficulty":"easy"}';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ title: 'Two Sum', difficulty: 'easy' });
  });

  it('removes trailing commas in objects', () => {
    const input = '{"a": 1, "b": 2,}';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
  });

  it('removes trailing commas in arrays', () => {
    const input = '{"items": [1, 2, 3,]}';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ items: [1, 2, 3] });
  });

  it('closes unclosed braces (token cutoff)', () => {
    const input = '{"title":"Hello","hints":["one","two"';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ title: 'Hello', hints: ['one', 'two'] });
  });

  it('closes unclosed braces and brackets (deep nesting)', () => {
    const input = '{"a":{"b":[1,2,{"c":3';
    const result = router._repairJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.a.b[2].c).toBe(3);
  });

  it('closes an unclosed string at the end', () => {
    const input = '{"title":"Hello worl';
    const result = router._repairJSON(input);
    // Should close the string and close the brace
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe('Hello worl');
  });

  it('escapes literal newlines inside JSON strings', () => {
    const input = '{"desc":"line1\nline2"}';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ desc: 'line1\nline2' });
  });

  it('escapes literal tabs inside JSON strings', () => {
    const input = '{"code":"a\tb"}';
    const result = router._repairJSON(input);
    expect(JSON.parse(result)).toEqual({ code: 'a\tb' });
  });

  it('strips carriage returns inside JSON strings', () => {
    const input = '{"text":"hello\r\nworld"}';
    const result = router._repairJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.text).toBe('hello\nworld');
  });

  it('replaces escaped backticks \\` with plain backticks', () => {
    const input = '{"desc":"use \\`map\\` function"}';
    const result = router._repairJSON(input);
    expect(result).toContain('`map`');
  });

  it("replaces escaped single quotes \\' with plain single quotes", () => {
    const input = '{"desc":"it\\\'s a test"}';
    const result = router._repairJSON(input);
    expect(result).toContain("it's");
  });

  it('handles empty input', () => {
    expect(router._repairJSON('')).toBe('');
    expect(router._repairJSON(null)).toBe('');
    expect(router._repairJSON(undefined)).toBe('');
  });

  it('handles input with no JSON object', () => {
    const input = 'This is just plain text with no braces';
    const result = router._repairJSON(input);
    // Should return cleaned string (no crash)
    expect(typeof result).toBe('string');
  });

  it('handles complex real-world LLM output', () => {
    const input = [
      "Sure! Here's the task:",
      '',
      '```json',
      '{',
      '  "title": "Два числа",',
      '  "description": "Найдите два числа в массиве\\nкоторые дают сумму target",',
      '  "examples": [',
      '    {',
      '      "input": "nums = [2,7], target = 9",',
      '      "output": "[0,1]",',
      '      "explanation": "2 + 7 = 9"',
      '    },',
      '  ],',
      '  "hints": [',
      '    "Используйте хеш-таблицу",',
      '    "Проверяйте комплемент",',
      '  ],',
      '  "difficulty": "easy",',
      '  "tags": ["arrays", "hash-table"]',
      '}',
      '```',
    ].join('\n');

    // After bugfix: _repairJSON now strips ``` fences anywhere (not just at start)
    const result = router._repairJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe('Два числа');
    expect(parsed.examples).toHaveLength(1);
    expect(parsed.hints).toHaveLength(2);
    expect(parsed.tags).toEqual(['arrays', 'hash-table']);

    // Also verify _parseJSON works end-to-end
    const parsed2 = router._parseJSON(input);
    expect(parsed2.title).toBe('Два числа');
  });

  it('handles severely truncated output (mid-string, mid-array, mid-object)', () => {
    const input = '{"title":"Binary Sear","hints":["try mid';
    const result = router._repairJSON(input);
    // Should not throw — at minimum produces something parseable or a raw fallback
    expect(typeof result).toBe('string');
    // It should close the open string, array, and object
    const parsed = JSON.parse(result);
    expect(parsed.title).toBe('Binary Sear');
  });
});

// ─── _parseJSON ──────────────────────────────────────────────────────

describe('_parseJSON', () => {
  it('parses valid JSON', () => {
    const result = router._parseJSON('{"title":"Hello","score":100}');
    expect(result).toEqual({ title: 'Hello', score: 100 });
  });

  it('parses JSON wrapped in markdown fences', () => {
    const input = '```json\n{"correct":true,"score":95}\n```';
    const result = router._parseJSON(input);
    expect(result.correct).toBe(true);
    expect(result.score).toBe(95);
  });

  it('parses JSON with trailing commas', () => {
    const result = router._parseJSON('{"a":1,"b":2,}');
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('returns parseError for completely invalid input', () => {
    const result = router._parseJSON('this is not json at all');
    expect(result).toHaveProperty('parseError');
    expect(result).toHaveProperty('raw');
  });

  it('throws on empty/null input', () => {
    expect(() => router._parseJSON('')).toThrow();
    expect(() => router._parseJSON(null)).toThrow();
    expect(() => router._parseJSON(undefined)).toThrow();
  });

  it('handles JSON with literal newlines in strings', () => {
    const input = '{"feedback":"Line 1\nLine 2\nLine 3"}';
    const result = router._parseJSON(input);
    expect(result.feedback).toBe('Line 1\nLine 2\nLine 3');
  });

  it('handles unclosed brackets gracefully', () => {
    const input = '{"items":[1,2,3';
    const result = router._parseJSON(input);
    expect(result.items).toEqual([1, 2, 3]);
  });
});

// ─── _extractText ────────────────────────────────────────────────────

describe('_extractText', () => {
  it('extracts text from standard OpenAI response format', () => {
    const response = {
      choices: [{ message: { content: 'Hello world' } }],
    };
    expect(router._extractText(response)).toBe('Hello world');
  });

  it('handles fallback response.message format', () => {
    const response = { message: { content: 'Fallback content' } };
    expect(router._extractText(response)).toBe('Fallback content');
  });

  it('handles response.message as string', () => {
    const response = { message: 'Direct string' };
    expect(router._extractText(response)).toBe('Direct string');
  });

  it('serializes unknown response shapes to JSON', () => {
    const response = { something: 'unexpected' };
    const result = router._extractText(response);
    expect(result).toContain('unexpected');
  });
});

// ─── API Methods ──────────────────────────────────────────────────────

describe('API methods', () => {
  it('generateTask formats prompt and returns parsed JSON', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            title: 'Test Task',
            description: 'Task Description',
            difficulty: 'easy',
            tags: ['arrays']
          })
        }
      }]
    };
    
    router.makeRequest = async (messages, options) => {
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toContain('easy');
      expect(messages[1].content).toContain('Arrays');
      return mockResponse;
    };

    const task = await router.generateTask({
      language: 'JavaScript',
      difficulty: 'easy',
      topic: 'Arrays',
      style: 'standard',
      appLanguage: 'en',
      recentTasks: []
    });

    expect(task.title).toBe('Test Task');
    expect(task.difficulty).toBe('easy');
  });

  it('checkSolution formats request and returns review JSON', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            correct: true,
            score: 100,
            feedback: 'Great job!'
          })
        }
      }]
    };

    router.makeRequest = async (messages, options) => {
      expect(messages[0].role).toBe('system');
      expect(messages[1].content).toContain('bubbleSort');
      expect(messages[1].content).toContain('JavaScript');
      return mockResponse;
    };

    const result = await router.checkSolution({
      task: { title: 'Sort' },
      userCode: 'function bubbleSort() {}',
      language: 'JavaScript',
      focus: 'correctness',
      appLanguage: 'en'
    });

    expect(result.correct).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback).toBe('Great job!');
  });

  it('askAssistant formats Socratic prompt for active task', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Let me guide you.'
        }
      }]
    };

    router.makeRequest = async (messages, options) => {
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('CURRENT CODING CHALLENGE CONTEXT');
      expect(messages[0].content).toContain('solution code');
      expect(messages[1].content).toBe('How do I start?');
      return mockResponse;
    };

    const response = await router.askAssistant({
      messages: [{ role: 'user', content: 'How do I start?' }],
      currentTask: { title: 'Socratic Challenge', description: 'Solve me', difficulty: 'easy', language: 'JavaScript' },
      appLanguage: 'en'
    });

    expect(response).toBe('Let me guide you.');
  });

  it('askAssistant formats general tutor prompt when no active task', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'General explanation here.'
        }
      }]
    };

    router.makeRequest = async (messages, options) => {
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('general programming tutor');
      expect(messages[0].content).not.toContain('CURRENT CODING CHALLENGE CONTEXT');
      return mockResponse;
    };

    const response = await router.askAssistant({
      messages: [{ role: 'user', content: 'Explain closures' }],
      currentTask: null,
      appLanguage: 'en'
    });

    expect(response).toBe('General explanation here.');
  });

  it('runCode formats execution request and returns simulated output JSON', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            output: 'Success output',
            error: null,
            results: []
          })
        }
      }]
    };

    router.makeRequest = async (messages, options) => {
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('code execution engine simulator');
      return mockResponse;
    };

    const result = await router.runCode({
      task: 'Task details',
      userCode: 'console.log()',
      language: 'JavaScript'
    });

    expect(result.output).toBe('Success output');
    expect(result.error).toBeNull();
  });
});
