import React from 'react';
import { Settings, Key, Sliders, Shield, Info, HelpCircle, Trash2 } from 'lucide-react';
import KeyManager from '../components/KeyManager';
import { useAppStore } from '../store/appStore';
import { languages, difficulties } from '../utils/languages';
import { getTranslation } from '../utils/translations';

const api = window.electronAPI || {
  storeSet: async () => {}
};

function SettingsPage() {
  const selectedLanguage = useAppStore((s) => s.selectedLanguage);
  const setSelectedLanguage = useAppStore((s) => s.setSelectedLanguage);
  const selectedDifficulty = useAppStore((s) => s.selectedDifficulty);
  const setSelectedDifficulty = useAppStore((s) => s.setSelectedDifficulty);
  
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
  const appLanguage = useAppStore((s) => s.appLanguage);
  const setAppLanguage = useAppStore((s) => s.setAppLanguage);
  const clearProgressData = useAppStore((s) => s.clearProgressData);

  // Helper to persist settings when changed
  const savePreference = async (key, value) => {
    try {
      await api.storeSet(`settings:${key}`, value);
    } catch (err) {
      console.error('Failed to persist setting to store', err);
    }
  };

  const handleClearCache = () => {
    const confirmed = window.confirm(getTranslation('settings.clear_cache_confirm', appLanguage));
    if (confirmed) {
      clearProgressData();
      alert(getTranslation('settings.clear_cache_success', appLanguage));
    }
  };

  return (
    <div className="settings-page animate-fade-in">
      <h2 className="settings-page__title">{getTranslation('settings.title', appLanguage)}</h2>

      {/* API Keys Configuration Card */}
      <div className="settings-page__section card">
        <h3 className="settings-page__section-title">
          <Key size={18} />
          {getTranslation('settings.api_keys_title', appLanguage)}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
          {getTranslation('settings.api_keys_desc', appLanguage)}
        </p>
        <KeyManager />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Practice Preferences */}
        <div className="settings-page__section card">
          <h3 className="settings-page__section-title">
            <Sliders size={18} />
            {getTranslation('settings.default_prefs', appLanguage)}
          </h3>
          <div className="task-generator__advanced-content" style={{ display: 'grid', gap: '1.2rem' }}>
            
            {/* Preferred Language */}
            <div className="task-generator__setting-row">
              <div className="task-generator__setting-label">
                <span>{getTranslation('settings.default_lang', appLanguage)}</span>
              </div>
              <div className="task-generator__setting-control">
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    savePreference('selectedLanguage', e.target.value);
                  }}
                  className="select"
                  style={{ width: '140px' }}
                >
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.icon} {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preferred Difficulty */}
            <div className="task-generator__setting-row">
              <div className="task-generator__setting-label">
                <span>{getTranslation('settings.default_diff', appLanguage)}</span>
              </div>
              <div className="task-generator__setting-control">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value);
                    savePreference('selectedDifficulty', e.target.value);
                  }}
                  className="select"
                  style={{ width: '140px' }}
                >
                  {difficulties.map((d) => (
                    <option key={d.id} value={d.id}>
                      {getTranslation(`diff.${d.id}`, appLanguage)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max Hints */}
            <div className="task-generator__setting-row">
              <div className="task-generator__setting-label">
                <span>{getTranslation('settings.max_hints_task', appLanguage)}</span>
              </div>
              <div className="task-generator__setting-control">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '8px' }}>
                  {maxHints}
                </span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={maxHints}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setMaxHints(val);
                    savePreference('maxHints', val);
                  }}
                  className="slider"
                />
              </div>
            </div>

            {/* Timer Limit */}
            <div className="task-generator__setting-row">
              <div className="task-generator__setting-label">
                <span>{getTranslation('settings.default_timer', appLanguage)}</span>
              </div>
              <div className="task-generator__setting-control">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '8px' }}>
                  {timerLimit} {getTranslation('gen.minutes', appLanguage)}
                </span>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={timerLimit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setTimerLimit(val);
                    savePreference('timerLimit', val);
                  }}
                  className="slider"
                />
              </div>
            </div>

            {/* Style */}
            <div className="task-generator__setting-row">
              <div className="task-generator__setting-label">
                <span>{getTranslation('settings.challenge_type', appLanguage)}</span>
              </div>
              <div className="radio-group">
                {['algorithmic', 'practical', 'random'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`radio-group__item ${taskStyle === style ? 'radio-group__item--selected' : ''}`}
                    onClick={() => {
                      setTaskStyle(style);
                      savePreference('taskStyle', style);
                    }}
                  >
                    {getTranslation(`style.${style}`, appLanguage)}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus */}
            <div className="task-generator__setting-row">
              <div className="task-generator__setting-label">
                <span>{getTranslation('settings.mentor_focus', appLanguage)}</span>
              </div>
              <div className="radio-group">
                {['correctness', 'readability', 'performance'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`radio-group__item ${focusMode === mode ? 'radio-group__item--selected' : ''}`}
                    onClick={() => {
                      setFocusMode(mode);
                      savePreference('focusMode', mode);
                    }}
                  >
                    {getTranslation(`focus.${mode}`, appLanguage)}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: General Settings & System Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* General Settings */}
          <div className="settings-page__section card">
            <h3 className="settings-page__section-title">
              <Settings size={18} />
              {getTranslation('settings.general', appLanguage)}
            </h3>
            <div className="task-generator__setting-row" style={{ marginTop: '0.5rem' }}>
              <div className="task-generator__setting-label">
                <span>{getTranslation('settings.app_lang', appLanguage)}</span>
              </div>
              <div className="task-generator__setting-control">
                <select
                  value={appLanguage}
                  onChange={(e) => setAppLanguage(e.target.value)}
                  className="select"
                  style={{ width: '140px' }}
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-page__section card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.02) 0%, rgba(20, 10, 10, 0.2) 100%)' }}>
            <h3 className="settings-page__section-title animate-pulse" style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} />
              {getTranslation('settings.danger_zone', appLanguage)}
            </h3>
            <div style={{ marginTop: '0.8rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {getTranslation('settings.clear_cache_title', appLanguage)}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '1.2rem' }}>
                {getTranslation('settings.clear_cache_desc', appLanguage)}
              </p>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleClearCache}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  width: 'fit-content'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <Trash2 size={14} />
                {getTranslation('settings.clear_cache_btn', appLanguage)}
              </button>
            </div>
          </div>

          {/* Security & System Info */}
          <div className="settings-page__section card flex flex-col justify-between" style={{ flexGrow: 1 }}>
            <div>
              <h3 className="settings-page__section-title">
                <Shield size={18} />
                {getTranslation('settings.sys_info', appLanguage)}
              </h3>
              
              <div style={{ display: 'grid', gap: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div className="flex justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                  <span>{getTranslation('settings.sys_ver', appLanguage)}</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                  <span>{getTranslation('settings.sys_env', appLanguage)}</span>
                  <span className="font-mono">
                    {window.electronAPI
                      ? getTranslation('settings.prod_electron', appLanguage)
                      : getTranslation('settings.web_sandbox', appLanguage)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                  <span>{getTranslation('settings.sys_dir', appLanguage)}</span>
                  <span className="font-mono" style={{ fontSize: '0.75rem' }}>AppData/Roaming/CodeMentor</span>
                </div>
                <div className="flex justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                  <span>{getTranslation('settings.sys_proto', appLanguage)}</span>
                  <span>OpenRouter / HTTPS JSON</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-sm" style={{ background: 'var(--bg-input)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginTop: '1.5rem' }}>
              <Info size={16} className="text-purple-light" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {getTranslation('settings.sys_warn', appLanguage)}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default SettingsPage;
