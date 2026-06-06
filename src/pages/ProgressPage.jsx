import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Flame, Zap, Award, Calendar, ChevronRight, FileCode, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getDifficultyById, getLanguageById } from '../utils/languages';
import { getTranslation } from '../utils/translations';

function ProgressPage() {
  const navigate = useNavigate();
  const stats = useAppStore((s) => s.stats);
  const history = useAppStore((s) => s.history);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const appLanguage = useAppStore((s) => s.appLanguage);
  
  const setCurrentTask = useAppStore((s) => s.setCurrentTask);
  const setUserCode = useAppStore((s) => s.setUserCode);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);
  const setSelectedDifficulty = useAppStore((s) => s.setSelectedDifficulty);
  const addFeedback = useAppStore((s) => s.addFeedback);
  const clearFeedback = useAppStore((s) => s.clearFeedback);

  const handleRowClick = (item) => {
    if (!item.taskObject || !item.userCode) return;
    
    setCurrentTask(item.taskObject);
    setUserCode(item.userCode);
    if (item.language) setSelectedLanguage(item.language);
    if (item.difficulty) setSelectedDifficulty(item.difficulty);
    
    clearFeedback();
    addFeedback({
      status: 'correct',
      message: appLanguage === 'ru'
        ? `### Задача загружена! 🎉\n\nВы успешно решили задачу **"${item.task}"** ранее. Ваше сохраненное решение загружено в редактор.`
        : `### Challenge Loaded! 🎉\n\nYou successfully solved the **"${item.task}"** challenge before. Your saved solution has been loaded into the editor.`,
      suggestion: appLanguage === 'ru'
        ? 'Вы можете изучить свой код, запустить его локально для тестирования или внести правки.'
        : 'You can review your code, run it locally for testing, or make edits.',
      complexity: {
        time: item.taskObject.optimalComplexity?.time || 'O(...)',
        space: item.taskObject.optimalComplexity?.space || 'O(...)'
      }
    });

    setCurrentPage('practice');
    navigate('/');
  };

  // Difficulty breakdown data
  const diffs = ['newbie', 'easy', 'medium', 'hard', 'expert'];
  const maxSolvedCount = Math.max(1, ...diffs.map((d) => stats[d] || 0));

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const locale = appLanguage === 'ru' ? 'ru-RU' : undefined;
    return date.toLocaleDateString(locale, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="progress-page animate-fade-in">
      <h2 className="progress-page__title">
        {appLanguage === 'ru' ? 'Ваш путь программирования' : 'Your Coding Journey'}
      </h2>

      {/* Stats Cards Grid */}
      <div className="progress-page__stats-grid">
        <div className="stat-card">
          <div className="stat-card__icon"><Trophy /></div>
          <div className="stat-card__value">{stats.totalSolved}</div>
          <div className="stat-card__label">{getTranslation('prog.solved_total', appLanguage)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ color: 'var(--color-warning)' }}><Flame /></div>
          <div className="stat-card__value">{stats.streak}</div>
          <div className="stat-card__label">{getTranslation('prog.streak_curr', appLanguage)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ color: 'var(--accent-purple-light)' }}><Award /></div>
          <div className="stat-card__value">{stats.bestStreak}</div>
          <div className="stat-card__label">{getTranslation('prog.streak_best', appLanguage)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ color: 'var(--accent-cyan)' }}><Zap /></div>
          <div className="stat-card__value">{stats.xp} {getTranslation('nav.xp', appLanguage)}</div>
          <div className="stat-card__label">{getTranslation('prog.xp_total', appLanguage)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Difficulty Breakdown */}
        <div className="progress-page__section card">
          <h3 className="progress-page__section-title">
            {appLanguage === 'ru' ? 'Распределение по сложности' : 'Difficulty Breakdown'}
          </h3>
          <div className="difficulty-bars">
            {diffs.map((diffKey) => {
              const diffConfig = getDifficultyById(diffKey);
              const count = stats[diffKey] || 0;
              const percent = (count / maxSolvedCount) * 100;

              return (
                <div key={diffKey} className="difficulty-bar">
                  <span 
                    className="difficulty-bar__label" 
                    style={{ color: diffConfig.color }}
                  >
                    {getTranslation(`diff.${diffConfig.id}`, appLanguage)}
                  </span>
                  <div className="difficulty-bar__track">
                    <div 
                      className="difficulty-bar__fill" 
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: diffConfig.color,
                        boxShadow: `0 0 10px ${diffConfig.color}44`
                      }}
                    />
                  </div>
                  <span className="difficulty-bar__count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Stats Summary */}
        <div className="progress-page__section card flex flex-col justify-between">
          <div>
            <h3 className="progress-page__section-title">
              {appLanguage === 'ru' ? 'Резюме AI-тренера' : 'AI Coach Summary'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
              {appLanguage === 'ru'
                ? 'Продолжайте решать задачи, чтобы получать опыт (XP) и повышать свой уровень. Наставник анализирует правильность, производительность и читаемость вашего кода для предоставления полезных советов.'
                : 'Keep solving tasks to earn XP and level up. Your mentor analyzes code correctness, performance, and readability to provide suggestions.'}
            </p>
            <div className="flex items-center gap-md" style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <Zap size={24} className="text-purple-light" />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                  {appLanguage === 'ru' ? 'Текущий ранг: Разработчик' : 'Current Rank: Developer'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {appLanguage === 'ru' ? 'Следующий ранг при 1000 XP' : 'Next rank at 1000 XP'}
                </p>
              </div>
            </div>
          </div>
          <button 
            className="btn btn--primary" 
            onClick={() => {
              setCurrentPage('practice');
              navigate('/');
            }}
            style={{ alignSelf: 'flex-start', marginTop: '1rem' }}
          >
            {appLanguage === 'ru' ? 'Начать практику' : 'Start Practicing'}
            <ChevronRight size={16} />
          </button>
        </div>

      </div>

      {/* History Section */}
      <div className="progress-page__section card">
        <h3 className="progress-page__section-title">
          {getTranslation('prog.history', appLanguage)}
        </h3>
        
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <FileCode />
            </div>
            <h4 className="empty-state__title">
              {appLanguage === 'ru' ? 'Решенных задач пока нет' : 'No solved challenges yet'}
            </h4>
            <p className="empty-state__text">
              {getTranslation('prog.empty_history', appLanguage)}
            </p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>{getTranslation('prog.hist_title', appLanguage)}</th>
                <th>{getTranslation('prog.hist_lang', appLanguage)}</th>
                <th>{getTranslation('prog.hist_diff', appLanguage)}</th>
                <th>{getTranslation('prog.hist_status', appLanguage)}</th>
                <th>{getTranslation('prog.hist_date', appLanguage)}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const diffConfig = getDifficultyById(item.difficulty);
                const langConfig = getLanguageById(item.language);
                const canLoad = !!item.taskObject && !!item.userCode;

                return (
                  <tr 
                    key={item.id}
                    onClick={() => canLoad && handleRowClick(item)}
                    className={canLoad ? 'history-table__row--clickable' : ''}
                    title={
                      canLoad 
                        ? (appLanguage === 'ru' ? 'Кликните, чтобы загрузить решение в редактор' : 'Click to load solution into editor') 
                        : (appLanguage === 'ru' ? 'Решение для этой задачи не было сохранено' : 'Solution not saved for this challenge')
                    }
                  >
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.task}
                    </td>
                    <td>
                      <span className="flex items-center gap-xs">
                        <span>{langConfig?.icon}</span>
                        <span>{langConfig?.name}</span>
                      </span>
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: `${diffConfig.color}15`, 
                          color: diffConfig.color,
                          borderColor: `${diffConfig.color}33`
                        }}
                      >
                        {getTranslation(`diff.${diffConfig.id}`, appLanguage)}
                      </span>
                    </td>
                    <td>
                      <span className="history-table__status history-table__status--solved">
                        <CheckCircle2 size={14} />
                        {appLanguage === 'ru' ? 'Решено' : 'Solved'}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-xs text-muted" style={{ fontSize: '0.8rem' }}>
                        <Calendar size={12} />
                        {formatDate(item.timestamp)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProgressPage;
