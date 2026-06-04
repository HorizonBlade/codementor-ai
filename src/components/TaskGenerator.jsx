import React, { useState } from 'react';
import { Sparkles, X, ChevronDown, ChevronUp, Clock, AlertCircle, Award, Compass, Swords } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { languages, difficulties, topics } from '../utils/languages';
import { getTranslation } from '../utils/translations';

const api = window.electronAPI || {
  generateTask: async () => ({
    success: true,
    data: {
      title: 'Two Sum',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
      examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' }],
      constraints: ['2 <= nums.length <= 10^4'],
      functionName: 'twoSum',
      functionSignature: 'def two_sum(nums, target):',
      starterCode: 'def two_sum(nums, target):\n    # Write your solution here\n    pass',
      hints: ['Use hash map', 'One pass check'],
      testCases: [{ input: '([2,7,11,15], 9)', expected: '[0,1]' }],
      tags: ['arrays']
    }
  })
};

function TaskGenerator() {
  const setShowTaskGenerator = useAppStore((s) => s.setShowTaskGenerator);
  const selectedLanguage = useAppStore((s) => s.selectedLanguage);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);
  const selectedDifficulty = useAppStore((s) => s.selectedDifficulty);
  const setSelectedDifficulty = useAppStore((s) => s.setSelectedDifficulty);
  const selectedTopics = useAppStore((s) => s.selectedTopics);
  const setSelectedTopics = useAppStore((s) => s.setSelectedTopics);

  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);
  const setUserCode = useAppStore((s) => s.setUserCode);
  const resetHints = useAppStore((s) => s.resetHints);
  const clearFeedback = useAppStore((s) => s.clearFeedback);
  
  const timerEnabled = useAppStore((s) => s.timerEnabled);
  const setTimerEnabled = useAppStore((s) => s.setTimerEnabled);
  const timerLimit = useAppStore((s) => s.timerLimit);
  const setTimerLimit = useAppStore((s) => s.setTimerLimit);
  const maxHints = useAppStore((s) => s.maxHints);
  const setMaxHints = useAppStore((s) => s.setMaxHints);
  const taskStyle = useAppStore((s) => s.taskStyle);
  const setTaskStyle = useAppStore((s) => s.setTaskStyle);
  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const setTimerRunning = useAppStore((s) => s.setTimerRunning);
  const resetTimer = useAppStore((s) => s.resetTimer);
  const appLanguage = useAppStore((s) => s.appLanguage);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setIsGenerating(true);
    setGenerationProgress(0);
    clearFeedback();

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev < 30) {
          return prev + Math.floor(Math.random() * 8) + 4; // Fast start (0-30%)
        } else if (prev < 75) {
          return prev + Math.floor(Math.random() * 4) + 1; // Normal speed (30-75%)
        } else if (prev < 95) {
          return prev + (Math.random() > 0.4 ? 1 : 0); // Slower progress (75-95%)
        } else {
          return prev; // Hold at 95% until complete
        }
      });
    }, 200);

    try {
      const response = await api.generateTask({
        language: selectedLanguage,
        difficulty: selectedDifficulty,
        topic: selectedTopics.length > 0 ? selectedTopics : 'random',
        style: taskStyle,
        focus: focusMode,
        maxHints,
        appLanguage
      });

      if (response.success && response.data && response.data.title && response.data.description) {
        const task = response.data;
        setCurrentTask(task);
        setUserCode(task.starterCode || task.functionSignature || '');
        resetHints();
        resetTimer();
        if (timerEnabled) {
          setTimerRunning(true);
        }
        setShowTaskGenerator(false);
      } else {
        setError(response.error || (appLanguage === 'ru' ? 'Не удалось сгенерировать корректную задачу. Пожалуйста, попробуйте еще раз.' : 'Failed to generate a valid task. Please try again.'));
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during task generation.');
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setIsGenerating(false);
    }
  };

  return (
    <div className="task-generator-overlay" onClick={() => !isGenerating && setShowTaskGenerator(false)}>
      <div className="task-generator" onClick={(e) => e.stopPropagation()}>
        <div className="task-generator__header">
          <h2 className="task-generator__title">
            <Sparkles size={20} className="text-purple-light" />
            {getTranslation('gen.title', appLanguage)}
          </h2>
          <button 
            className="task-generator__close" 
            onClick={() => setShowTaskGenerator(false)}
            disabled={isGenerating}
          >
            <X size={18} />
          </button>
        </div>

        <div className="task-generator__body">
          {error && (
            <div className="btn btn--danger animate-fade-in" style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'flex-start', cursor: 'default' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Language Selection */}
          <div className="task-generator__section">
            <label className="task-generator__section-label">
              <Award size={16} /> {getTranslation('gen.language', appLanguage)}
            </label>
            <div className="task-generator__lang-grid">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className={`task-generator__lang-card ${selectedLanguage === lang.id ? 'task-generator__lang-card--selected' : ''}`}
                  onClick={() => setSelectedLanguage(lang.id)}
                >
                  <span className="task-generator__lang-icon">{lang.icon}</span>
                  <span>{lang.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="task-generator__section">
            <label className="task-generator__section-label">
              <Compass size={16} /> {getTranslation('gen.difficulty', appLanguage)}
            </label>
            <div className="task-generator__diff-grid">
              {difficulties.map((diff) => (
                <div
                  key={diff.id}
                  className="task-generator__diff-card"
                  style={{
                    borderColor: selectedDifficulty === diff.id ? diff.color : 'var(--glass-border)',
                    background: selectedDifficulty === diff.id ? `${diff.color}15` : 'var(--bg-card)',
                    color: selectedDifficulty === diff.id ? diff.color : 'var(--text-primary)'
                  }}
                  onClick={() => setSelectedDifficulty(diff.id)}
                >
                  <span className="task-generator__diff-name">{getTranslation(`diff.${diff.id}`, appLanguage)}</span>
                  <span className="task-generator__diff-time">
                    {appLanguage === 'ru' ? diff.time.replace('min', 'мин') : diff.time}
                  </span>
                  <span className="task-generator__diff-xp">+{diff.xp} {getTranslation('nav.xp', appLanguage)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="task-generator__section">
            <label className="task-generator__section-label">
              <Swords size={16} /> {getTranslation('gen.topics', appLanguage)}
            </label>
            <div className="task-generator__topics">
              {topics.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                const translationKey = `topic.${topic.replace(/-/g, '_')}`;
                return (
                  <div
                    key={topic}
                    className={`task-generator__topic-chip ${isSelected ? 'task-generator__topic-chip--selected' : ''}`}
                    onClick={() => toggleTopic(topic)}
                  >
                    {getTranslation(translationKey, 'en')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Toggles */}
          <div className="task-generator__section">
            <button
              className="task-generator__advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {getTranslation('gen.advanced', appLanguage)}
            </button>

            {showAdvanced && (
              <div className="task-generator__advanced-content animate-fade-in">
                
                {/* Timer Toggle */}
                <div className="task-generator__setting-row">
                  <div className="task-generator__setting-label">
                    <Clock size={16} />
                    <span>{getTranslation('gen.timer', appLanguage)}</span>
                  </div>
                  <div className="task-generator__setting-control">
                    {timerEnabled && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {timerLimit} {getTranslation('gen.minutes', appLanguage)}
                      </span>
                    )}
                    <div
                      className={`toggle ${timerEnabled ? 'toggle--active' : ''}`}
                      onClick={() => setTimerEnabled(!timerEnabled)}
                    >
                      <div className="toggle__thumb"></div>
                    </div>
                  </div>
                </div>

                {/* Timer Duration Slider */}
                {timerEnabled && (
                  <div className="task-generator__setting-row">
                    <div className="task-generator__setting-label" style={{ paddingLeft: '24px' }}>
                      <span>{getTranslation('gen.duration', appLanguage)}</span>
                    </div>
                    <div className="task-generator__setting-control">
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={timerLimit}
                        onChange={(e) => setTimerLimit(parseInt(e.target.value))}
                        className="slider"
                      />
                    </div>
                  </div>
                )}

                {/* Hints Limit Slider */}
                <div className="task-generator__setting-row">
                  <div className="task-generator__setting-label">
                    <AlertCircle size={16} />
                    <span>{getTranslation('gen.max_hints', appLanguage)}</span>
                  </div>
                  <div className="task-generator__setting-control">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
                      {maxHints} {getTranslation('gen.hints', appLanguage)}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={maxHints}
                      onChange={(e) => setMaxHints(parseInt(e.target.value))}
                      className="slider"
                    />
                  </div>
                </div>

                {/* Task Style */}
                <div className="task-generator__setting-row">
                  <div className="task-generator__setting-label">
                    <span>{getTranslation('gen.style', appLanguage)}</span>
                  </div>
                  <div className="radio-group">
                    {['algorithmic', 'practical', 'random'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        className={`radio-group__item ${taskStyle === style ? 'radio-group__item--selected' : ''}`}
                        onClick={() => setTaskStyle(style)}
                      >
                        {getTranslation(`style.${style}`, appLanguage)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Mode */}
                <div className="task-generator__setting-row">
                  <div className="task-generator__setting-label">
                    <span>{getTranslation('gen.focus', appLanguage)}</span>
                  </div>
                  <div className="radio-group">
                    {['correctness', 'readability', 'performance'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`radio-group__item ${focusMode === mode ? 'radio-group__item--selected' : ''}`}
                        onClick={() => setFocusMode(mode)}
                      >
                        {getTranslation(`focus.${mode}`, appLanguage)}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        <div className="task-generator__footer" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
          {isGenerating && (
            <div className="task-generator__progress-container animate-fade-in" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>{getTranslation('gen.generating', appLanguage)}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#06b6d4' }}>{generationProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div 
                  className="task-generator__progress-bar" 
                  style={{ 
                    width: `${generationProgress}%`, 
                    height: '100%', 
                    borderRadius: '3px',
                    background: 'linear-gradient(90deg, #a855f7 0%, #06b6d4 100%)',
                    boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
                    transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} 
                />
              </div>
            </div>
          )}
          <button
            className="btn btn--gradient task-generator__generate-btn"
            disabled={isGenerating}
            onClick={handleGenerate}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isGenerating ? (
              <>
                <div className="spinner spinner--sm"></div>
                {getTranslation('gen.generating', appLanguage)} ({generationProgress}%)
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {getTranslation('gen.generate_btn', appLanguage)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskGenerator;
