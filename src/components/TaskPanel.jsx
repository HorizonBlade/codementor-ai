import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Lightbulb, Tag, AlertTriangle, ChevronRight, Terminal } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getDifficultyById } from '../utils/languages';
import { getTranslation } from '../utils/translations';

function TaskPanel() {
  const currentTask = useAppStore((s) => s.currentTask);
  const selectedDifficulty = useAppStore((s) => s.selectedDifficulty);
  const hintsRevealed = useAppStore((s) => s.hintsRevealed);
  const maxHints = useAppStore((s) => s.maxHints);
  const revealNextHint = useAppStore((s) => s.revealNextHint);
  const setShowTaskGenerator = useAppStore((s) => s.setShowTaskGenerator);
  const codeOutput = useAppStore((s) => s.codeOutput);
  const isRunning = useAppStore((s) => s.isRunning);
  const appLanguage = useAppStore((s) => s.appLanguage);

  if (!currentTask) {
    return (
      <div className="task-panel task-panel--empty">
        <div className="task-panel__empty-state">
          <Sparkles size={48} className="task-panel__empty-icon" />
          <h2>{getTranslation('task.ready_to_code', appLanguage)}</h2>
          <p>{getTranslation('task.empty_desc', appLanguage)}</p>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => setShowTaskGenerator(true)}
          >
            <Sparkles size={18} />
            {getTranslation('task.generate_btn', appLanguage)}
          </button>
        </div>
      </div>
    );
  }

  const diff = getDifficultyById(selectedDifficulty);
  const hintLimit = Math.min(currentTask.hints?.length || 0, maxHints);

  return (
    <div className="task-panel">
      <div className="task-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h2 className="task-panel__title" style={{ marginBottom: '8px' }}>{currentTask.title}</h2>
          <span
            className="task-panel__difficulty"
            style={{ backgroundColor: diff.color + '22', color: diff.color, borderColor: diff.color + '44' }}
          >
            {getTranslation(`diff.${diff.id}`, appLanguage)}
          </span>
        </div>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => setShowTaskGenerator(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          <Sparkles size={14} />
          {getTranslation('task.new_challenge', appLanguage)}
        </button>
      </div>

      {currentTask.tags && currentTask.tags.length > 0 && (
        <div className="task-panel__tags">
          <Tag size={14} />
          {currentTask.tags.map((tag) => {
            const translationKey = `topic.${tag.toLowerCase().replace(/-/g, '_')}`;
            const englishTag = getTranslation(translationKey, 'en');
            const displayTag = englishTag !== translationKey 
              ? englishTag 
              : tag.charAt(0).toUpperCase() + tag.slice(1);
            return (
              <span key={tag} className="task-panel__tag">
                {displayTag}
              </span>
            );
          })}
        </div>
      )}

      <div className="task-panel__description">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {currentTask.description}
        </ReactMarkdown>
      </div>

      {currentTask.examples && currentTask.examples.length > 0 && (
        <div className="task-panel__section">
          <h3 className="task-panel__section-title">{getTranslation('task.examples', appLanguage)}</h3>
          {currentTask.examples.map((ex, i) => (
            <div key={i} className="task-panel__example">
              <div className="task-panel__example-row">
                <span className="task-panel__example-label">{getTranslation('task.input', appLanguage)}:</span>
                <code>{ex.input}</code>
              </div>
              <div className="task-panel__example-row">
                <span className="task-panel__example-label">{getTranslation('task.output', appLanguage)}:</span>
                <code>{ex.output}</code>
              </div>
              {ex.explanation && (
                <div className="task-panel__example-row task-panel__example-row--explanation">
                  <span className="task-panel__example-label">{getTranslation('task.explanation', appLanguage)}:</span>
                  <span>{ex.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {currentTask.constraints && currentTask.constraints.length > 0 && (
        <div className="task-panel__section">
          <h3 className="task-panel__section-title">
            <AlertTriangle size={14} />
            {getTranslation('task.constraints', appLanguage)}
          </h3>
          <ul className="task-panel__constraints">
            {currentTask.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {currentTask.hints && currentTask.hints.length > 0 && (
        <div className="task-panel__section">
          <h3 className="task-panel__section-title">
            <Lightbulb size={14} />
            {getTranslation('task.hints', appLanguage)}
          </h3>
          <div className="task-panel__hints">
            {currentTask.hints.slice(0, hintsRevealed).map((hint, i) => (
              <div key={i} className="task-panel__hint">
                <ChevronRight size={14} />
                <span>{hint}</span>
              </div>
            ))}
            {hintsRevealed < hintLimit && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={revealNextHint}
              >
                <Lightbulb size={14} />
                {getTranslation('task.reveal_hint', appLanguage)} ({hintsRevealed}/{hintLimit})
              </button>
            )}
          </div>
        </div>
      )}

      {currentTask.optimalComplexity && (
        <div className="task-panel__section">
          <h3 className="task-panel__section-title">{getTranslation('task.optimal_complexity', appLanguage)}</h3>
          <div className="task-panel__complexity">
            <span className="task-panel__complexity-badge">
              {getTranslation('feedback.time', appLanguage)}: {currentTask.optimalComplexity.time}
            </span>
            <span className="task-panel__complexity-badge">
              {getTranslation('feedback.space', appLanguage)}: {currentTask.optimalComplexity.space}
            </span>
          </div>
        </div>
      )}

      {/* ─── OUTPUT Panel ─── */}
      <div className="task-panel__section">
        <h3 className="task-panel__section-title">
          <Terminal size={14} />
          {getTranslation('task.output_title', appLanguage)}
        </h3>
        <div className="task-panel__output">
          {isRunning ? (
            <div className="task-panel__output-running">
              <span className="spinner spinner--sm" />
              <span>{getTranslation('task.output_running', appLanguage)}</span>
            </div>
          ) : codeOutput ? (
            <pre className="task-panel__output-content">{codeOutput}</pre>
          ) : (
            <span className="task-panel__output-placeholder">
              {getTranslation('task.output_placeholder', appLanguage)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskPanel;
