import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, MessageSquare, Clock, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getTranslation } from '../utils/translations';

function FeedbackPanel() {
  const feedback = useAppStore((s) => s.feedback);
  const isChecking = useAppStore((s) => s.isChecking);
  const appLanguage = useAppStore((s) => s.appLanguage);
  const setShowTaskGenerator = useAppStore((s) => s.setShowTaskGenerator);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feedback, isChecking]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct':
        return '#22c55e';
      case 'partial':
        return '#f59e0b';
      case 'incorrect':
        return '#ef4444';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'correct':
        return getTranslation('feedback.correct', appLanguage);
      case 'partial':
        return getTranslation('feedback.partial', appLanguage);
      case 'incorrect':
        return getTranslation('feedback.incorrect', appLanguage);
      case 'error':
        return getTranslation('feedback.error', appLanguage);
      default:
        return getTranslation('feedback.info', appLanguage);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (feedback.length === 0 && !isChecking) {
    return (
      <div className="feedback-panel feedback-panel--empty">
        <MessageSquare size={20} />
        <span>{getTranslation('feedback.empty', appLanguage)}</span>
      </div>
    );
  }

  return (
    <div className="feedback-panel" ref={scrollRef}>
      <div className="feedback-panel__messages">
        {feedback.map((fb) => (
          <div key={fb.id} className="feedback-panel__message">
            <div className="feedback-panel__avatar">
              <Bot size={20} />
              <span
                className="feedback-panel__status-dot"
                style={{ backgroundColor: getStatusColor(fb.status) }}
              />
            </div>
            <div className="feedback-panel__content">
              <div className="feedback-panel__meta">
                <span
                  className="feedback-panel__status-label"
                  style={{ color: getStatusColor(fb.status) }}
                >
                  {getStatusLabel(fb.status)}
                </span>
                <span className="feedback-panel__time">
                  <Clock size={12} />
                  {formatTimestamp(fb.timestamp)}
                </span>
              </div>
              <div className="feedback-panel__text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {fb.message}
                </ReactMarkdown>
              </div>
              {fb.suggestion && (
                <div className="feedback-panel__suggestion">
                  <strong>💡 {getTranslation('feedback.suggestion', appLanguage)}:</strong> {fb.suggestion}
                </div>
              )}
              {fb.complexity && (
                <div className="feedback-panel__complexity">
                  <span className="feedback-panel__complexity-badge">
                    {getTranslation('feedback.time', appLanguage)}: {fb.complexity.time}
                  </span>
                  <span className="feedback-panel__complexity-badge">
                    {getTranslation('feedback.space', appLanguage)}: {fb.complexity.space}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isChecking && (
          <div className="feedback-panel__message feedback-panel__message--loading">
            <div className="feedback-panel__avatar">
              <Bot size={20} />
            </div>
            <div className="feedback-panel__content">
              <div className="feedback-panel__typing">
                <span className="feedback-panel__typing-dot" />
                <span className="feedback-panel__typing-dot" />
                <span className="feedback-panel__typing-dot" />
              </div>
            </div>
          </div>
        )}

        {(() => {
          const lastFb = feedback[feedback.length - 1];
          const isCorrect = lastFb && lastFb.status === 'correct';
          if (!isCorrect) return null;
          return (
            <div className="feedback-panel__next-action animate-fade-in" style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0 0.5rem 0' }}>
              <button
                className="btn btn--gradient btn--lg"
                onClick={() => setShowTaskGenerator(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
              >
                <Sparkles size={18} />
                {getTranslation('task.new_challenge', appLanguage)}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default FeedbackPanel;
