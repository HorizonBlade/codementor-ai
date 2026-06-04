// electron/api/openrouter.js — OpenRouter API client (uses only Node built-ins)
// CommonJS module

const https = require('https');
const http = require('http');
const { URL } = require('url');

class OpenRouter {
  constructor(keyPool) {
    this.keyPool = keyPool;
    this.maxRetries = 3;
    this.timeout = 120_000; // 120 seconds (2 minutes)
  }

  // ─── Low-level HTTP request (Node built-in only) ────────────────────
  _httpRequest(url, options, body) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;

      // Construct request options explicitly
      const reqOptions = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: options.method || 'POST',
        headers: {
          Host: parsed.hostname,
          ...options.headers
        },
        timeout: this.timeout
      };

      // Crucial for Cloudflare & SNI (Server Name Indication)
      if (parsed.protocol === 'https:') {
        reqOptions.servername = parsed.hostname;
      }

      const req = mod.request(
        reqOptions,
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf-8');
            resolve({ statusCode: res.statusCode, body: raw });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        const err = new Error('Request timed out');
        err.statusCode = 0;
        reject(err);
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (body) req.write(body);
      req.end();
    });
  }

  // ─── Core request with retries & key rotation ──────────────────────
  async makeRequest(messages, options = {}) {
    let lastError = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      let keyObj;
      try {
        keyObj = this.keyPool.getNextKey();
      } catch (err) {
        throw err; // no keys at all — propagate immediately
      }

      const url = keyObj.baseUrl || 'https://openrouter.ai/api/v1/chat/completions';
      const payload = JSON.stringify({
        model: keyObj.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        reasoning: {
          enabled: false
        }
      });

      try {
        console.log(
          `[OpenRouter] Attempt ${attempt + 1}/${this.maxRetries} → ${url} (key …${keyObj.key.slice(-6)})`
        );

        const res = await this._httpRequest(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keyObj.key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/lazer/codementor-ai', // Required/Recommended by OpenRouter
            'X-Title': 'CodeMentor AI', // Required/Recommended by OpenRouter
          },
        }, payload);

        // Success range
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(res.body);
          this.keyPool.markSuccess(keyObj);
          return parsed;
        }

        // Non-success status — treat as error
        const err = new Error(`API responded with status ${res.statusCode}: ${res.body.slice(0, 300)}`);
        err.statusCode = res.statusCode;
        this.keyPool.markFailed(keyObj, err);
        lastError = err;
        console.warn(`[OpenRouter] Attempt ${attempt + 1} failed: ${err.message}`);
      } catch (err) {
        this.keyPool.markFailed(keyObj, err);
        lastError = err;
        console.warn(`[OpenRouter] Attempt ${attempt + 1} error: ${err.message}`);
      }
    }

    throw new Error(
      `All ${this.maxRetries} retry attempts exhausted. Last error: ${lastError ? lastError.message : 'unknown'}`
    );
  }

  // ─── Generate a coding task ────────────────────────────────────────
  async generateTask({ language, difficulty, topic, style, appLanguage }) {
    const isRussian = (appLanguage || 'ru') === 'ru';
    const langInstruction = isRussian
      ? [
          'CRITICAL LANGUAGE REQUIREMENT:',
          '- The title, description, constraints, example explanations, and hints MUST be written exclusively in Russian (на русском языке).',
          '- Inside the "examples" array: the "input", "output", and especially the "explanation" strings MUST be written entirely in Russian.',
          '- Absolutely NO English sentences, English comments, English thought monologues, or English explanations are allowed anywhere in the JSON fields, EXCEPT inside the "tags" array and code blocks/variables.',
          '- All text must be natural, high-quality, grammatically correct Russian.',
          '- Avoid unexplained or incorrect abbreviations like "ПСГЧ" or "ПГСЧ". Always write abbreviation terms in full on their first occurrence and add their short abbreviation in parentheses next to it, e.g. "генератор псевдослучайных чисел (ГПСЧ)".',
          '- The "tags" array values MUST remain in English (e.g., ["arrays", "heap", "linked-list", "sorting"]). Do NOT translate tags/topics to Russian.'
        ].join('\n')
      : [
          'CRITICAL LANGUAGE REQUIREMENT:',
          '- The entire task (title, description, constraints, tags, hints, and example explanations) MUST be written exclusively in English.'
        ].join('\n');

    const systemMessage = {
      role: 'system',
      content: [
        'You are CodeMentor AI, an expert programming instructor.',
        'Generate a coding task and respond with ONLY valid JSON. You MUST respond with a single JSON object. Do NOT write any introduction, explanation, reasoning, thinking, comments, or notes outside the JSON structure. Start your response directly with the opening curly brace { and end it with the closing curly brace }.',
        'CRITICAL: You must escape all double quotes inside JSON string values using \\" (e.g., \\"word\\").',
        'CRITICAL: Use backticks (`) instead of double quotes for terms, names, or quotes inside description, constraints, and hints to prevent JSON format corruption.',
        'CRITICAL: You MUST wrap all code variables, function names, parameter names, numerical constants (e.g., `1664525`, `1013904223`), mathematical variables and formulas (e.g., `X_n`, `X_{n+1}`, `m = 2^32`, `X_0 = seed`, `X_n mod (i + 1)`), and asymptotic notation (e.g., `O(n)`) inside markdown backticks (`) so they render as inline code blocks.',
        'CRITICAL: Do NOT output raw literal newlines inside JSON string fields. Use escaped \\n instead.',
        'CRITICAL: Do NOT use ellipsis or placeholders like "..." or "... and so on" inside or outside JSON arrays. Every array must contain fully realized, complete items.',
        'CRITICAL: Do NOT place a trailing comma after the last property of an object or after the last element of an array.',
        langInstruction,
        'The JSON output must strictly conform to this schema structure:',
        '{',
        '  "title": "Short descriptive title",',
        '  "description": "Detailed problem statement (use \\n for newlines)",',
        '  "examples": [',
        '    {',
        '      "input": "input representation",',
        '      "output": "expected output representation",',
        '      "explanation": "explanation of this example case"',
        '    }',
        '  ],',
        '  "constraints": [',
        '    "first constraint string",',
        '    "second constraint string"',
        '  ],',
        '  "hints": [',
        '    "First progressive hint",',
        '    "Second progressive hint",',
        '    "Third final hint"',
        '  ],',
        '  "difficulty": "the difficulty level (e.g., newbie, easy, medium, hard, expert)",',
        '  "tags": ["topic-tag1", "topic-tag2"],',
        '  "starterCode": "starter code template with function signature (use \\n for newlines)"',
        '}',
      ].join('\n'),
    };

    const userMessage = {
      role: 'user',
      content: `Generate a ${difficulty} ${topic} task in ${language}. Style: ${style || 'standard'}.`,
    };

    const response = await this.makeRequest([systemMessage, userMessage], {
      temperature: 0.2,
      maxTokens: 8192,
    });

    // Extract the assistant text
    const text = this._extractText(response);
    const parsed = this._parseJSON(text);
    if (parsed.parseError) {
      throw new Error(
        isRussian
          ? `Не удалось разобрать ответ ИИ как JSON-задачу. Ошибка: ${parsed.parseError}`
          : `Failed to parse AI response as JSON task. Error: ${parsed.parseError}`
      );
    }
    if (!parsed.title || !parsed.description) {
      throw new Error(
        isRussian
          ? 'Получена пустая или неполная задача от ИИ (отсутствует название или описание). Пожалуйста, попробуйте еще раз.'
          : 'Received an empty or incomplete task from the AI (missing title or description). Please try again.'
      );
    }
    console.log('[OpenRouter] Parsed task successfully:', parsed);
    return parsed;
  }

  // ─── Check / review a user's solution ──────────────────────────────
  async checkSolution({ task, userCode, language, focus, appLanguage }) {
    const isRussian = (appLanguage || 'ru') === 'ru';
    const langInstruction = isRussian
      ? [
          'CRITICAL LANGUAGE REQUIREMENT:',
          '- Your entire response (feedback, suggestions, timeComplexity, spaceComplexity, bestPractices, errors) MUST be written exclusively in Russian (на русском языке).',
          '- Absolutely NO English sentences, English comments, English thought monologues, or English explanations are allowed anywhere in the feedback or suggestions.',
          '- Only code blocks, variables, or standard Big-O notation symbols may remain in English.'
        ].join('\n')
      : [
          'CRITICAL LANGUAGE REQUIREMENT:',
          '- Your entire response (feedback, suggestions, bestPractices, errors) MUST be written exclusively in English.'
        ].join('\n');

    const systemMessage = {
      role: 'system',
      content: [
        'You are CodeMentor AI, a supportive but rigorous code mentor.',
        'Review the student\'s solution and respond with ONLY valid JSON (no markdown, no code fences).',
        langInstruction,
        'The JSON must have these fields:',
        '  "correct"        — boolean, whether the solution is correct',
        '  "score"          — integer 0-100',
        '  "feedback"       — detailed feedback string (use \\n for newlines)',
        '  "suggestions"    — array of improvement suggestion strings',
        '  "timeComplexity" — Big-O time complexity string',
        '  "spaceComplexity" — Big-O space complexity string',
        '  "bestPractices"  — array of best-practice notes',
        '  "errors"         — array of error descriptions (empty if none)',
      ].join('\n'),
    };

    const userMessage = {
      role: 'user',
      content: [
        `Language: ${language}`,
        '',
        '--- TASK ---',
        typeof task === 'string' ? task : JSON.stringify(task, null, 2),
        '',
        '--- STUDENT CODE ---',
        userCode,
        '',
        `Evaluation focus: ${focus || 'correctness, efficiency, code quality'}`,
      ].join('\n'),
    };

    const response = await this.makeRequest([systemMessage, userMessage], {
      temperature: 0.4,
      maxTokens: 4096,
    });

    const text = this._extractText(response);
    return this._parseJSON(text);
  }

  // ─── AI Assistant Chat method ──────────────────────────────────────
  async askAssistant({ messages, currentTask, appLanguage }) {
    const isRussian = (appLanguage || 'ru') === 'ru';
    
    // Construct the context-enriched system message
    const systemPromptLines = [
      'You are CodeMentor AI, a friendly and knowledgeable programming assistant.',
      isRussian
        ? 'Your responses MUST be written exclusively in Russian (на русском языке). Respond in a natural, helpful, and grammatically correct manner.'
        : 'Your responses MUST be written exclusively in English.',
      'You are inside a small, quick chat window in the corner of the student\'s coding environment. Keep your responses relatively concise, structured, and easy to read in a narrow chat panel. Use Markdown lists, bold text, and code formatting where appropriate.'
    ];

    if (currentTask) {
      systemPromptLines.push(
        '\n--- CURRENT CODING CHALLENGE CONTEXT ---',
        `Title: ${currentTask.title}`,
        `Language: ${currentTask.language || 'unspecified'}`,
        `Difficulty: ${currentTask.difficulty || 'unspecified'}`,
        `Description: ${currentTask.description}`,
        '----------------------------------------',
        '\nCRITICAL PEDAGOGICAL INSTRUCTION:',
        'If the user is asking questions about the active coding challenge, explain the logic, guide them conceptually, help them debug their thoughts, or explain requirements/examples.',
        'DO NOT give them the full solution code for the active challenge. Keep your code snippets for the active challenge partial, conceptual, or illustrative. Encourage them to write the code themselves.',
        'If they ask general programming questions unrelated to this specific challenge (e.g., explaining concepts, algorithms, general syntax, or questions in other languages), feel free to explain fully and write complete, helpful code examples.'
      );
    } else {
      systemPromptLines.push(
        '\nSince there is no active challenge selected, act as a general programming tutor. Help the user with any programming-related questions, explain concepts, write code examples, and provide clear explanations.'
      );
    }

    const fullMessages = [
      { role: 'system', content: systemPromptLines.join('\n') },
      ...messages
    ];

    const response = await this.makeRequest(fullMessages, {
      temperature: 0.6,
      maxTokens: 2048,
    });

    return this._extractText(response);
  }

  // ─── Run / simulate code execution ─────────────────────────────────
  async runCode({ task, userCode, language }) {
    const systemMessage = {
      role: 'system',
      content: [
        'You are a code execution engine simulator.',
        'You will receive a coding task and a student\'s code solution.',
        'Simulate running the code against the provided test cases / examples.',
        'Respond with ONLY valid JSON (no markdown, no code fences).',
        'The JSON must have these fields:',
        '  "output"  — the simulated stdout/output of the code as a string',
        '  "error"   — null if no error, or an error message string if the code has issues',
        '  "results" — array of { "input": "...", "expected": "...", "actual": "...", "passed": boolean }',
        '',
        'Important rules:',
        '- Trace through the code step by step to determine actual output',
        '- If the code has syntax errors, return the error message',
        '- If there are runtime errors, describe them clearly',
        '- Show the actual output for each test case',
        '- Format output as it would appear in a real terminal',
      ].join('\n'),
    };

    const userMessage = {
      role: 'user',
      content: [
        `Language: ${language}`,
        '',
        '--- TASK ---',
        typeof task === 'string' ? task : JSON.stringify(task, null, 2),
        '',
        '--- CODE ---',
        userCode,
      ].join('\n'),
    };

    const response = await this.makeRequest([systemMessage, userMessage], {
      temperature: 0.3,
      maxTokens: 2048,
    });

    const text = this._extractText(response);
    return this._parseJSON(text);
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  /** Extract the text content from an OpenAI-style chat completion. */
  _extractText(response) {
    try {
      if (response.choices && response.choices[0]) {
        return response.choices[0].message.content;
      }
      // Fallback — some providers nest differently
      if (response.message) return response.message.content || response.message;
      return JSON.stringify(response);
    } catch {
      return JSON.stringify(response);
    }
  }

  /** Repair potentially malformed JSON strings from LLMs. */
  _repairJSON(text) {
    if (!text) return '';
    let cleaned = text.trim();

    // Clean up invalid escapes commonly generated by LLMs:
    // 1. Escaped backticks (e.g. \` -> `)
    // 2. Escaped single quotes (e.g. \' -> ')
    cleaned = cleaned.replace(/\\`/g, '`').replace(/\\'/g, "'");

    // Remove markdown code fences wrapping JSON content (anywhere in the response)
    cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').trim();

    // Locate the first '{' that represents the start of a JSON object.
    // Sometimes the model mentions `{ ... }` in a code fence or as a text character first,
    // so we locate the first '{' followed by a double quote (after skipping spaces/newlines)
    // or locate the first '{' in the cleaned text if no quote follow pattern is found.
    let startIdx = -1;
    const matches = [...cleaned.matchAll(/\{\s*"/g)];
    if (matches.length > 0) {
      startIdx = matches[0].index;
    } else {
      startIdx = cleaned.indexOf('{');
    }

    if (startIdx === -1) {
      return cleaned; // No JSON object found
    }

    // Slice to start of JSON
    cleaned = cleaned.substring(startIdx);

    // 1. Close unclosed brackets/braces due to token cutoff or model errors
    let openBrackets = [];
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{' || char === '[') {
          openBrackets.push(char);
        } else if (char === '}') {
          if (openBrackets[openBrackets.length - 1] === '{') {
            openBrackets.pop();
          }
        } else if (char === ']') {
          if (openBrackets[openBrackets.length - 1] === '[') {
            openBrackets.pop();
          }
        }
      }
    }

    // Close open string if cut off inside string
    if (inString) {
      cleaned += '"';
    }

    // Close open brackets/braces in reverse order
    while (openBrackets.length > 0) {
      const lastOpen = openBrackets.pop();
      if (lastOpen === '{') {
        cleaned += '}';
      } else if (lastOpen === '[') {
        cleaned += ']';
      }
    }

    // 2. Clean trailing commas in objects and arrays
    cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');

    // 3. Escape literal control characters (newlines, tabs) inside string values
    let repaired = '';
    let inStr = false;
    let esc = false;
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (esc) {
        repaired += char;
        esc = false;
        continue;
      }
      if (char === '\\') {
        repaired += char;
        esc = true;
        continue;
      }
      if (char === '"') {
        inStr = !inStr;
        repaired += char;
        continue;
      }
      if (inStr) {
        if (char === '\n') {
          repaired += '\\n';
        } else if (char === '\t') {
          repaired += '\\t';
        } else if (char === '\r') {
          // Skip carriage return
        } else {
          repaired += char;
        }
      } else {
        repaired += char;
      }
    }
    cleaned = repaired;

    return cleaned;
  }

  /** Parse a JSON string, tolerating markdown code fences and correcting malformed tokens. */
  _parseJSON(text) {
    if (!text) throw new Error('Empty response from API');

    const repaired = this._repairJSON(text);

    try {
      return JSON.parse(repaired);
    } catch (err) {
      console.error('[OpenRouter] JSON parse failed.');
      console.error('[OpenRouter] Error message:', err.message);
      console.error('[OpenRouter] Original response:', text);
      console.error('[OpenRouter] Repaired response:', repaired);
      return { raw: text, parseError: err.message };
    }
  }
}

module.exports = OpenRouter;
