import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Clock, AlertCircle, Terminal } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getLanguageById, languages } from '../utils/languages';
import { getTranslation } from '../utils/translations';

const api = window.electronAPI || {
  generateTask: async () => ({
    title: 'Two Sum',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    functionName: 'twoSum',
    functionSignature: 'def two_sum(nums, target):',
    starterCode: 'def two_sum(nums, target):\n    # Write your solution here\n    pass',
    hints: [
      'Think about complements',
      'What data structure gives O(1) lookup?',
      'Use a hash map to store seen values',
    ],
    testCases: [{ input: '([2,7,11,15], 9)', expected: '[0,1]' }],
    optimalComplexity: { time: 'O(n)', space: 'O(n)' },
    tags: ['arrays', 'hash-table'],
  }),
  checkSolution: async () => ({
    status: 'partial',
    message:
      "### Almost there! 🎯\n\nYour approach is on the right track, but think about what happens when the array has duplicate values.\n\n**Question:** What would your code return for `nums = [3, 3]` and `target = 6`?",
    suggestion:
      'Consider how you handle the case where the complement is the same element.',
    complexity: { time: 'O(n²)', space: 'O(1)' },
  }),
  runCode: async () => ({
    success: true,
    data: { output: '> Running code...\n\nOutput:\n[0, 1]' },
  }),
  getKeys: async () => [],
  setKeys: async () => {},
  testKey: async () => ({ success: true }),
  storeGet: async () => null,
  storeSet: async () => {},
};

function CodeEditor() {
  const userCode = useAppStore((s) => s.userCode);
  const setUserCode = useAppStore((s) => s.setUserCode);
  const selectedLanguage = useAppStore((s) => s.selectedLanguage);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);
  const currentTask = useAppStore((s) => s.currentTask);
  const isChecking = useAppStore((s) => s.isChecking);
  const setIsChecking = useAppStore((s) => s.setIsChecking);
  const isRunning = useAppStore((s) => s.isRunning);
  const setIsRunning = useAppStore((s) => s.setIsRunning);
  const setCodeOutput = useAppStore((s) => s.setCodeOutput);
  const addFeedback = useAppStore((s) => s.addFeedback);
  const updateStats = useAppStore((s) => s.updateStats);
  const selectedDifficulty = useAppStore((s) => s.selectedDifficulty);
  const addToHistory = useAppStore((s) => s.addToHistory);
  const saveSolutionsEnabled = useAppStore((s) => s.saveSolutionsEnabled);
  const timerEnabled = useAppStore((s) => s.timerEnabled);
  const timerSeconds = useAppStore((s) => s.timerSeconds);
  const timerRunning = useAppStore((s) => s.timerRunning);
  const incrementTimer = useAppStore((s) => s.incrementTimer);
  const setTimerRunning = useAppStore((s) => s.setTimerRunning);
  const appLanguage = useAppStore((s) => s.appLanguage);

  const timerRef = useRef(null);

  const lang = getLanguageById(selectedLanguage);

  // Timer effect
  useEffect(() => {
    if (timerRunning && timerEnabled) {
      timerRef.current = setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerEnabled, incrementTimer]);

  // Auto-start timer when task loads
  useEffect(() => {
    if (currentTask && timerEnabled) {
      setTimerRunning(true);
    }
  }, [currentTask, timerEnabled, setTimerRunning]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRunCode = async () => {
    if (!currentTask || isRunning || !userCode.trim()) return;
    setIsRunning(true);
    setCodeOutput('');
    try {
      const result = await api.runCode({
        task: currentTask,
        code: userCode,
        language: selectedLanguage,
        appLanguage,
      });
      if (result.success && result.data) {
        setCodeOutput(result.data.output || result.data.raw || JSON.stringify(result.data));
      } else {
        setCodeOutput(`${getTranslation('editor.run_error', appLanguage)} ${result.error || ''}`);
      }
    } catch (err) {
      setCodeOutput(`Error: ${err.message || 'An unexpected error occurred.'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentTask || isChecking || !userCode.trim()) return;
    setIsChecking(true);
    try {
      const result = await api.checkSolution({
        task: currentTask,
        code: userCode,
        userCode: userCode,
        language: selectedLanguage,
        appLanguage,
      });

      let formattedFeedback;
      if (window.electronAPI) {
        if (result.success && result.data) {
          const data = result.data;
          if (data.parseError) {
            console.error('API response JSON parse failed:', data.parseError);
            formattedFeedback = {
              status: 'error',
              message: data.raw || (appLanguage === 'ru' 
                ? '### Ошибка разбора ответа ИИ\n\nНе удалось получить структурированный ответ от ИИ.' 
                : '### AI Response Parse Error\n\nCould not get a structured response from the AI.'),
              suggestion: appLanguage === 'ru' 
                ? `Детали ошибки: ${data.parseError}` 
                : `Error details: ${data.parseError}`,
              complexity: {
                time: 'O(...)',
                space: 'O(...)'
              }
            };
          } else {
            formattedFeedback = {
              status: data.correct ? 'correct' : (data.score > 70 ? 'partial' : 'incorrect'),
              message: data.feedback || '',
              suggestion: data.suggestions && data.suggestions.length > 0 ? data.suggestions[0] : '',
              complexity: {
                time: data.timeComplexity || 'O(...)',
                space: data.spaceComplexity || 'O(...)'
              }
            };
          }
        } else {
          formattedFeedback = {
            status: 'error',
            message: `### Error\n\n${getTranslation('settings.conn_fail', appLanguage)}`,
            suggestion: result.error || 'Unknown API error'
          };
        }
      } else {
        formattedFeedback = result;
      }

      addFeedback(formattedFeedback);

      if (formattedFeedback.status === 'correct') {
        updateStats(selectedDifficulty, true);
        addToHistory({
          task: currentTask.title,
          language: selectedLanguage,
          difficulty: selectedDifficulty,
          solved: true,
          attempts: 1,
          ...(saveSolutionsEnabled ? {
            taskObject: currentTask,
            userCode: userCode,
          } : {}),
        });
        setTimerRunning(false);
      }
    } catch (err) {
      addFeedback({
        status: 'error',
        message: '### Error\n\nFailed to check solution. Please try again.',
        suggestion: err.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    if (currentTask && currentTask.starterCode) {
      setUserCode(currentTask.starterCode);
    } else {
      setUserCode('');
    }
  };

  return (
    <div className="code-editor">
      {/* Top header with language selector + Run Code button */}
      <div className="code-editor__header">
        <div className="code-editor__lang-selector">
          <span className="code-editor__lang-icon">{lang.icon}</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="code-editor__header-right">
          {timerEnabled && (
            <div className="code-editor__timer">
              <Clock size={14} />
              <span>{formatTime(timerSeconds)}</span>
            </div>
          )}
          {!window.electronAPI && (
            <div className="code-editor__dev-notice">
              <AlertCircle size={12} />
              <span>{getTranslation('editor.dev_mode', appLanguage)}</span>
            </div>
          )}
          <button
            className="code-editor__run-btn"
            onClick={handleRunCode}
            disabled={isRunning || !currentTask || !userCode.trim()}
          >
            {isRunning ? (
              <>
                <span className="spinner spinner--sm" />
                {getTranslation('editor.running', appLanguage)}
              </>
            ) : (
              <>
                <Terminal size={14} />
                {getTranslation('editor.run_code', appLanguage)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor Body */}
      <div className="code-editor__body">
        <Editor
          theme="vs-dark"
          language={lang.monacoId}
          value={userCode}
          onChange={(value) => setUserCode(value || '')}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Bottom toolbar with submit/reset buttons */}
      <div className="code-editor__toolbar">
        <div className="code-editor__toolbar-left">
          <button
            className="btn btn--success"
            onClick={handleSubmit}
            disabled={isChecking || !currentTask}
          >
            {isChecking ? (
              <>
                <span className="spinner spinner--sm" />
                {getTranslation('editor.checking', appLanguage)}
              </>
            ) : (
              <>
                <Play size={16} />
                {getTranslation('editor.submit', appLanguage)}
              </>
            )}
          </button>
          <button
            className="btn btn--ghost"
            onClick={handleReset}
            disabled={!currentTask}
          >
            <RotateCcw size={16} />
            {getTranslation('editor.reset', appLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;
