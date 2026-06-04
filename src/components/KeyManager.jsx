import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Globe,
  Cpu,
  AlertTriangle,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getTranslation } from '../utils/translations';

const api = window.electronAPI || {
  getKeys: async () => ({ success: true, data: [] }),
  setKeys: async () => ({ success: true }),
  testKey: async () => ({ success: true }),
};

const DEFAULT_OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_FREE_MODEL = 'openrouter/free';

const FREE_MODEL_PRESETS = [
  {
    id: 'openrouter-free',
    label: 'Auto Free Router',
    model: 'openrouter/free',
    note: 'Recommended. Automatically routes to a currently working free model.',
  },
  {
    id: 'llama-free',
    label: 'Llama 3.3 Free',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    note: 'Large open-weights model, excellent general reasoning.',
  },
  {
    id: 'qwen-coder-free',
    label: 'Qwen Coder Free',
    model: 'qwen/qwen-2.5-coder-32b-instruct:free',
    note: 'Coding-oriented free model for high quality code generation.',
  },
  {
    id: 'gemma-free',
    label: 'Gemma 2 Free',
    model: 'google/gemma-2-9b-it:free',
    note: 'Google gemma-2-9b-it free model (newer replacement for gemma-2-27b).',
  },
];

function normalizeModel(model) {
  return String(model || '').trim();
}

function isOpenRouterFreeModel(modelName) {
  const normalized = normalizeModel(modelName).toLowerCase();
  return normalized === 'openrouter/free' || (normalized.includes('/') && normalized.endsWith(':free'));
}

function getProviderFromModel(modelName) {
  const name = normalizeModel(modelName).toLowerCase();
  const providerSlug = name.includes('/') ? name.split('/')[0] : '';

  if (providerSlug.includes('openai') || name.startsWith('gpt')) return 'OpenAI';
  if (providerSlug.includes('google') || name.includes('gemini') || name.includes('gemma')) return 'Google';
  if (providerSlug.includes('anthropic') || name.includes('claude')) return 'Anthropic';
  if (providerSlug.includes('nvidia') || name.includes('nemotron')) return 'Nvidia';
  if (providerSlug.includes('meta') || name.includes('llama')) return 'Meta';
  if (providerSlug.includes('mistral') || name.includes('mixtral')) return 'Mistral';
  if (providerSlug.includes('qwen') || name.includes('qwen')) return 'Qwen';
  if (providerSlug) return providerSlug.charAt(0).toUpperCase() + providerSlug.slice(1);
  return 'OpenRouter';
}

function getProviderMark(provider) {
  switch (provider) {
    case 'OpenAI':
      return 'OA';
    case 'Google':
      return 'GG';
    case 'Anthropic':
      return 'AN';
    case 'Nvidia':
      return 'NV';
    case 'Meta':
      return 'MT';
    case 'Mistral':
      return 'MS';
    case 'Qwen':
      return 'QW';
    case 'OpenRouter':
      return 'OR';
    default:
      return provider.slice(0, 2).toUpperCase();
  }
}

function getModelDetails(modelName, appLanguage = 'ru') {
  const isRussian = appLanguage === 'ru';
  const name = normalizeModel(modelName).toLowerCase();
  const isFree = isOpenRouterFreeModel(modelName);

  const details = {
    description: isFree
      ? (isRussian ? 'Бесплатная модель OpenRouter. Идеально для недорогой разработки, экспериментов и тестирования.' : 'OpenRouter free model. Ideal for low-cost coding, iteration, and experimentation.')
      : (isRussian ? 'Пользовательский эндпоинт модели, настроенный через шлюз OpenRouter.' : 'Custom AI model endpoint configured through the OpenRouter gateway.'),
    params: 'N/A',
    context: isRussian ? 'Контекст 128k' : '128k context',
    cost: isFree ? (isRussian ? 'Бесплатно' : 'Free') : (isRussian ? 'Своя цена' : 'Custom pricing'),
  };

  if (name === 'openrouter/free') {
    details.description = isRussian
      ? 'Умный роутер OpenRouter. Автоматически выбирает и перенаправляет запросы к активным бесплатным моделям (позволяет избежать ошибок 404, когда отдельные модели отключаются).'
      : 'Smart OpenRouter router. Automatically selects and routes to a currently active free model (avoids 404 errors when individual models are taken offline).';
    details.params = isRussian ? 'Авто' : 'Auto';
    details.context = isRussian ? 'Динамический контекст' : 'Dynamic context';
    details.cost = isRussian ? 'Бесплатно' : 'Free';
  } else if (name.includes('gpt-4o-mini')) {
    details.description = isRussian
      ? 'Легковесная быстрая модель с отличными навыками программирования.'
      : 'Lightweight, fast model with strong coding capabilities.';
    details.params = isRussian ? 'Параметры: 8B' : '8B params';
    details.context = isRussian ? 'Контекст 128k' : '128k context';
    details.cost = isFree ? (isRussian ? 'Бесплатно' : 'Free') : '$0.15/M tokens';
  } else if (name.includes('gpt-4o')) {
    details.description = isRussian
      ? 'Флагманская модель для сложного анализа и структурированных ответов.'
      : 'Flagship model for complex reasoning and structured output.';
    details.params = isRussian ? 'Параметры: 175B' : '175B params';
    details.context = isRussian ? 'Контекст 128k' : '128k context';
    details.cost = isFree ? (isRussian ? 'Бесплатно' : 'Free') : '$5.00/M tokens';
  } else if (name.includes('claude-3-5-sonnet') || name.includes('claude-3.5-sonnet')) {
    details.description = isRussian
      ? 'Высокопроизводительная модель Anthropic для написания кода и следования инструкциям.'
      : 'Highly capable Anthropic model for coding and instruction following.';
    details.params = isRussian ? 'Параметры: 150B' : '150B params';
    details.context = isRussian ? 'Контекст 200k' : '200k context';
    details.cost = isFree ? (isRussian ? 'Бесплатно' : 'Free') : '$3.00/M tokens';
  } else if (name.includes('gemini-2.5-flash') || name.includes('gemini-2-flash')) {
    details.description = isRussian
      ? 'Модель Google, оптимизированная для низких задержек и быстрых ответов.'
      : 'Google model optimized for low-latency tasks and rapid answers.';
    details.params = isRussian ? 'Параметры: 12B' : '12B params';
    details.context = isRussian ? 'Контекст 1M' : '1M context';
    details.cost = isFree ? (isRussian ? 'Бесплатно' : 'Free') : '$0.075/M tokens';
  } else if (name.includes('nemotron-3') || name.includes('nemotron')) {
    details.description = isRussian
      ? 'Открытая гибридная MoE-модель от NVIDIA, настроенная на логику и генерацию кода.'
      : 'NVIDIA open hybrid MoE model tuned for strong reasoning and code generation.';
    details.params = isRussian ? 'Параметры: 729B' : '729B tokens';
    details.context = isRussian ? 'Контекст 128k' : '128k context';
    details.cost = isRussian ? 'Бесплатно' : 'Free';
  } else if (name.includes('llama-3') || name.includes('llama')) {
    details.description = isRussian
      ? 'Открытая модель от Meta с надежной производительностью в задачах общего программирования.'
      : 'Meta open-weights LLM with reliable general-purpose coding performance.';
    details.params = isRussian ? 'Параметры: 70B' : '70B params';
    details.context = isRussian ? 'Контекст 128k' : '128k context';
    details.cost = isFree ? (isRussian ? 'Бесплатно' : 'Free') : '$0.20/M tokens';
  } else if (name.includes('gemma')) {
    details.description = isRussian
      ? 'Компактная модель от Google, подходящая для быстрой генерации ответов и легких нагрузок.'
      : 'Compact Google model suited to faster prompts and lighter workloads.';
    details.params = isRussian ? 'Параметры: 9B' : '9B params';
    details.context = isRussian ? 'Контекст 128k' : '128k context';
    details.cost = isFree ? (isRussian ? 'Бесплатно' : 'Free') : (isRussian ? 'Своя цена' : 'Custom pricing');
  } else if (name.includes('qwen')) {
    details.description = isRussian
      ? 'Специализированная модель Qwen для практических задач по разработке ПО.'
      : 'Qwen coding model for practical software tasks and everyday use.';
    details.params = isRussian ? 'Параметры: 32B' : '32B params';
    details.context = isRussian ? 'Контекст 128k' : '128k context';
    details.cost = isFree ? (isRussian ? 'Бесплатно' : 'Free') : (isRussian ? 'Своя цена' : 'Custom pricing');
  }

  return details;
}

function KeyManager() {
  const apiKeys = useAppStore((s) => s.apiKeys);
  const setApiKeys = useAppStore((s) => s.setApiKeys);
  const appLanguage = useAppStore((s) => s.appLanguage);

  const [newKey, setNewKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState(DEFAULT_OPENROUTER_URL);
  const [newModel, setNewModel] = useState(DEFAULT_FREE_MODEL);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formError, setFormError] = useState('');

  const [testingIndex, setTestingIndex] = useState(null);
  const [testResult, setTestResult] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await api.getKeys();
        if (res.success) {
          setApiKeys(res.data || []);
        } else {
          setError(res.error || (appLanguage === 'ru' ? 'Не удалось получить API-ключи' : 'Failed to retrieve API keys'));
        }
      } catch (err) {
        setError(err.message || (appLanguage === 'ru' ? 'Ошибка связи с бэкендом' : 'Error communicating with backend'));
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, [setApiKeys, appLanguage]);

  const saveKeys = async (updatedKeys) => {
    try {
      const res = await api.setKeys(updatedKeys);
      if (res.success) {
        setApiKeys(updatedKeys);
        return true;
      }

      setError(res.error || (appLanguage === 'ru' ? 'Не удалось сохранить API-ключи' : 'Failed to save API keys'));
      return false;
    } catch (err) {
      setError(err.message || (appLanguage === 'ru' ? 'Ошибка связи с бэкендом' : 'Error communicating with backend'));
      return false;
    }
  };

  const handlePresetSelect = (preset) => {
    setNewModel(preset.model);
    setNewBaseUrl(DEFAULT_OPENROUTER_URL);
    setFormError('');
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    setFormError('');

    const key = newKey.trim();
    const baseUrl = newBaseUrl.trim() || DEFAULT_OPENROUTER_URL;
    const model = normalizeModel(newModel);

    if (!key) {
      setFormError(appLanguage === 'ru' ? 'Пожалуйста, введите ваш API-ключ OpenRouter.' : 'Please enter your OpenRouter API key.');
      return;
    }

    if (!model) {
      setFormError(appLanguage === 'ru' ? 'Пожалуйста, выберите или введите ID модели OpenRouter.' : 'Please choose or enter an OpenRouter model id.');
      return;
    }

    if (!isOpenRouterFreeModel(model)) {
      setFormError(
        appLanguage === 'ru'
          ? 'Бесплатные модели должны использовать формат OpenRouter `provider/model:free`, например `nvidia/nemotron-3-super-120b-a12b:free`.'
          : 'Free models must use the OpenRouter format `provider/model:free`, for example `nvidia/nemotron-3-super-120b-a12b:free`.'
      );
      return;
    }

    const keyConfig = {
      key,
      baseUrl,
      model,
      status: 'active',
      requestCount: 0,
    };

    const updated = [...apiKeys, keyConfig];
    const success = await saveKeys(updated);
    if (success) {
      setNewKey('');
    }
  };

  const handleDeleteKey = async (indexToDelete) => {
    const updated = apiKeys.filter((_, i) => i !== indexToDelete);
    await saveKeys(updated);
  };

  const handleTestKey = async (index) => {
    setTestingIndex(index);
    setTestResult((prev) => ({ ...prev, [index]: null }));
    const keyConfig = apiKeys[index];

    try {
      const res = await api.testKey(keyConfig);
      if (res.success) {
        setTestResult((prev) => ({
          ...prev,
          [index]: { success: true, message: appLanguage === 'ru' ? 'Соединение успешно!' : 'Connection successful!' },
        }));

        const updated = apiKeys.map((k, i) => (i === index ? { ...k, status: 'active', lastError: null } : k));
        setApiKeys(updated);
        await api.setKeys(updated);
      } else {
        setTestResult((prev) => ({
          ...prev,
          [index]: { success: false, message: res.error || (appLanguage === 'ru' ? 'Ошибка валидации. Проверьте соединение.' : 'Validation failed. Check connection.') },
        }));

        const updated = apiKeys.map((k, i) => (i === index ? { ...k, status: 'failed', lastError: res.error } : k));
        setApiKeys(updated);
        await api.setKeys(updated);
      }
    } catch (err) {
      setTestResult((prev) => ({
        ...prev,
        [index]: { success: false, message: err.message || (appLanguage === 'ru' ? 'Ошибка подключения' : 'Connection error') },
      }));
    } finally {
      setTestingIndex(null);
    }
  };

  const getProvider = (modelName) => getProviderFromModel(modelName);

  const formatDate = (ts) => {
    if (!ts) return appLanguage === 'ru' ? 'Никогда' : 'Never';
    const d = new Date(ts);
    const locale = appLanguage === 'ru' ? 'ru-RU' : [];
    return `${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })}`;
  };

  const maskKey = (keyStr) => {
    const key = String(keyStr || '');
    if (key.length <= 8) return '********';
    return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
  };

  const filteredKeys = apiKeys
    .map((k, i) => ({ ...k, originalIndex: i }))
    .filter((keyConfig) => {
      const provider = getProvider(keyConfig.model);
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        normalizeModel(keyConfig.model).toLowerCase().includes(search) ||
        normalizeModel(keyConfig.baseUrl).toLowerCase().includes(search) ||
        provider.toLowerCase().includes(search);

      if (!matchesSearch) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'active') return keyConfig.status === 'active';
      if (activeTab === 'failed') return keyConfig.status === 'failed' || keyConfig.status === 'rate-limited';
      if (activeTab === 'free') return isOpenRouterFreeModel(keyConfig.model);

      return provider.toLowerCase() === activeTab.toLowerCase();
    });

  const getTabCount = (tabId) => {
    if (tabId === 'all') return apiKeys.length;
    if (tabId === 'active') return apiKeys.filter((k) => k.status === 'active').length;
    if (tabId === 'failed') return apiKeys.filter((k) => k.status === 'failed' || k.status === 'rate-limited').length;
    if (tabId === 'free') return apiKeys.filter((k) => isOpenRouterFreeModel(k.model)).length;
    return apiKeys.filter((k) => getProvider(k.model).toLowerCase() === tabId.toLowerCase()).length;
  };

  if (loading) {
    return (
      <div className="key-manager flex justify-center items-center" style={{ padding: '2rem' }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  const getTabLabel = (id, label) => {
    if (appLanguage === 'ru') {
      const ruLabels = {
        all: 'Все',
        active: 'Активные',
        failed: 'Сбои',
        free: 'Бесплатные'
      };
      return ruLabels[id] || label;
    }
    return label;
  };

  const getPresetLabel = (preset) => {
    if (appLanguage !== 'ru') return preset.label;
    const labels = {
      'openrouter-free': 'Авто-выбор модели',
      'llama-free': 'Llama 3.3 Free',
      'qwen-coder-free': 'Qwen Coder Free',
      'gemma-free': 'Gemma 2 Free'
    };
    return labels[preset.id] || preset.label;
  };

  const getPresetNote = (preset) => {
    if (appLanguage !== 'ru') return preset.note;
    const notes = {
      'openrouter-free': 'Рекомендуется. Автоматически перенаправляет запросы на работающую бесплатную модель.',
      'llama-free': 'Большая модель с открытыми весами, отличный логический анализ.',
      'qwen-coder-free': 'Специализированная бесплатная модель для качественного написания кода.',
      'gemma-free': 'Google gemma-2-9b-it бесплатная модель (замена gemma-2-27b).'
    };
    return notes[preset.id] || preset.note;
  };

  return (
    <div className="key-manager">
      {error && (
        <div
          className="btn btn--danger animate-fade-in"
          style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'flex-start', cursor: 'default' }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="key-manager__header-controls">
        <h3 className="label" style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
          {getTranslation('settings.endpoints', appLanguage).replace('{count}', apiKeys.length)}
        </h3>

        <div className="key-manager__search-container">
          <Search className="key-manager__search-icon" />
          <input
            type="text"
            className="key-manager__search-input"
            placeholder={getTranslation('settings.filter_placeholder', appLanguage)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="key-manager__tabs">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'failed', label: 'Failed' },
          { id: 'free', label: 'Free' },
          { id: 'openai', label: 'OpenAI' },
          { id: 'google', label: 'Google' },
          { id: 'anthropic', label: 'Anthropic' },
          { id: 'nvidia', label: 'Nvidia' },
        ].map((tab) => {
          const count = getTabCount(tab.id);
          if (count === 0 && tab.id !== 'all' && tab.id !== 'active') return null;

          return (
            <button
              key={tab.id}
              className={`key-manager__tab ${activeTab === tab.id ? 'key-manager__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {getTabLabel(tab.id, tab.label)}
              <span style={{ opacity: 0.6, fontSize: '0.75rem', marginLeft: '4px' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {filteredKeys.length === 0 ? (
        <div
          className="key-manager__empty"
          style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', padding: '3rem 1rem' }}
        >
          <Cpu />
          <p style={{ marginTop: '1rem' }}>{getTranslation('settings.empty_models', appLanguage)}</p>
        </div>
      ) : (
        <div className="model-cards">
          {filteredKeys.map((keyConfig) => {
            const provider = getProvider(keyConfig.model);
            const details = getModelDetails(keyConfig.model, appLanguage);
            const statusClass = `model-card__tag--status-${keyConfig.status === 'rate-limited' ? 'limited' : keyConfig.status}`;
            const isFree = isOpenRouterFreeModel(keyConfig.model);

            const getStatusText = (status) => {
              if (appLanguage === 'ru') {
                if (status === 'active') return 'Активна';
                if (status === 'failed') return 'Сбой';
                if (status === 'rate-limited') return 'Лимит запросов';
                return status;
              }
              if (status === 'active') return 'Active';
              if (status === 'failed') return 'Failed';
              if (status === 'rate-limited') return 'Rate Limited';
              return status;
            };

            return (
              <div key={keyConfig.originalIndex} className="model-card animate-fade-in">
                <div className="model-card__header">
                  <div className="model-card__title-area">
                    <span className="model-card__logo">{getProviderMark(provider)}</span>
                    <div>
                      <h4 className="model-card__title">
                        {keyConfig.model}
                        <span className="model-card__provider">by {provider}</span>
                      </h4>
                    </div>
                  </div>
                  <div className="model-card__right">
                    <span className="model-card__size">{details.params}</span>
                  </div>
                </div>

                <div className="model-card__tags">
                  <span className="model-card__tag model-card__tag--provider">{provider}</span>
                  <span className={`model-card__tag ${isFree ? 'model-card__tag--free' : 'model-card__tag--custom'}`}>
                    {isFree ? (appLanguage === 'ru' ? 'Бесплатная' : 'Free') : (appLanguage === 'ru' ? 'Своя' : 'Custom')}
                  </span>
                  <span className={`model-card__tag ${statusClass}`}>
                    {getStatusText(keyConfig.status)}
                  </span>
                  <span className="model-card__tag" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                    {details.context}
                  </span>
                </div>

                <p className="model-card__description">{details.description}</p>

                <div className="model-card__footer">
                  <div className="model-card__meta">
                    <span>{getTranslation('settings.key_label', appLanguage)} {maskKey(keyConfig.key)}</span>
                    <span className="truncate" style={{ maxWidth: '240px' }} title={keyConfig.baseUrl}>
                      {getTranslation('settings.url_label', appLanguage)} {keyConfig.baseUrl}
                    </span>
                    <span>{getTranslation('settings.requests_label', appLanguage)}: {keyConfig.requestCount || 0}</span>
                    <span>{getTranslation('settings.last_used_label', appLanguage)}: {formatDate(keyConfig.lastUsed)}</span>
                  </div>

                  <div className="model-card__actions">
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={testingIndex !== null}
                      onClick={() => handleTestKey(keyConfig.originalIndex)}
                      style={{ padding: '4px 10px', height: '28px' }}
                      type="button"
                    >
                      {testingIndex === keyConfig.originalIndex ? (
                        <>
                          <div className="spinner spinner--sm" style={{ marginRight: '4px' }} />
                          {getTranslation('settings.testing_btn', appLanguage)}
                        </>
                      ) : getTranslation('settings.test_btn', appLanguage)}
                    </button>
                    <button
                      className="btn btn--danger btn--sm btn--icon"
                      onClick={() => handleDeleteKey(keyConfig.originalIndex)}
                      title={appLanguage === 'ru' ? 'Удалить конфигурацию' : 'Remove Configuration'}
                      style={{ width: '28px', height: '28px' }}
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {testResult[keyConfig.originalIndex] && (
                  <div
                    className="flex items-center gap-xs"
                    style={{
                      fontSize: '0.75rem',
                      marginTop: '8px',
                      padding: '4px 8px',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      width: 'fit-content',
                      color: testResult[keyConfig.originalIndex].success ? 'var(--color-success)' : 'var(--color-error)',
                    }}
                  >
                    {testResult[keyConfig.originalIndex].success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    <span>{testResult[keyConfig.originalIndex].success ? getTranslation('settings.conn_success', appLanguage) : testResult[keyConfig.originalIndex].message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form className="key-manager__add-form animate-fade-in" onSubmit={handleAddKey}>
        <div className="key-manager__form-header">
          <div>
            <h3 className="label" style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              {getTranslation('settings.new_endpoint_title', appLanguage)}
            </h3>
            <p className="key-manager__helper">
              {getTranslation('settings.helper_text', appLanguage)}
            </p>
          </div>
          <div className="key-manager__inline-badge">
            <Sparkles size={14} />
            OpenRouter Free
          </div>
        </div>

        <div className="key-manager__preset-grid">
          {FREE_MODEL_PRESETS.map((preset) => {
            const selected = normalizeModel(newModel).toLowerCase() === preset.model.toLowerCase();

            return (
              <button
                key={preset.id}
                type="button"
                className={`key-manager__preset-card ${selected ? 'key-manager__preset-card--active' : ''}`}
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="key-manager__preset-top">
                  <span className="key-manager__preset-label">{getPresetLabel(preset)}</span>
                  <span className="key-manager__preset-pill">{appLanguage === 'ru' ? 'Бесплатно' : 'Free'}</span>
                </div>
                <span className="key-manager__preset-model">{preset.model}</span>
                <span className="key-manager__preset-note">{getPresetNote(preset)}</span>
              </button>
            );
          })}

          <button
            type="button"
            className={`key-manager__preset-card ${normalizeModel(newModel) === '' ? 'key-manager__preset-card--active' : ''}`}
            onClick={() => {
              setNewModel('');
              setNewBaseUrl(DEFAULT_OPENROUTER_URL);
              setFormError('');
            }}
          >
            <div className="key-manager__preset-top">
              <span className="key-manager__preset-label">{appLanguage === 'ru' ? 'Своя бесплатная модель' : 'Custom free model'}</span>
              <span className="key-manager__preset-pill">{appLanguage === 'ru' ? 'Вручную' : 'Manual'}</span>
            </div>
            <span className="key-manager__preset-model">{appLanguage === 'ru' ? 'Укажите любой ID вида provider/model:free' : 'Enter any `provider/model:free` id'}</span>
            <span className="key-manager__preset-note">
              {appLanguage === 'ru' ? 'Используйте это, если нужной модели нет в списке выше.' : 'Use this if the model is not in the curated list.'}
            </span>
          </button>
        </div>

        <div className="key-manager__form-grid">
          <div className="key-manager__form-full">
            <label className="label" htmlFor="api-key-input">
              {getTranslation('settings.key_input_label', appLanguage)}
            </label>
            <input
              id="api-key-input"
              type="password"
              className="input"
              placeholder="sk-or-v1-..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="api-url-input">
              {getTranslation('settings.url_input_label', appLanguage)}
            </label>
            <div style={{ position: 'relative' }}>
              <Globe size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                id="api-url-input"
                type="text"
                className="input"
                style={{ paddingLeft: '32px' }}
                value={newBaseUrl}
                onChange={(e) => setNewBaseUrl(e.target.value)}
                placeholder={DEFAULT_OPENROUTER_URL}
              />
            </div>
            <p className="key-manager__helper key-manager__helper--compact">
              {appLanguage === 'ru' ? 'Адрес для отправки запросов (chat completions) в OpenRouter.' : 'OpenRouter chat completions endpoint.'}
            </p>
          </div>

          <div>
            <label className="label" htmlFor="api-model-input">
              {getTranslation('settings.model_input_label', appLanguage)}
            </label>
            <div style={{ position: 'relative' }}>
              <Cpu size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                id="api-model-input"
                type="text"
                className="input"
                style={{ paddingLeft: '32px' }}
                placeholder="nvidia/nemotron-3-super-120b-a12b:free"
                value={newModel}
                onChange={(e) => {
                  setNewModel(e.target.value);
                  setFormError('');
                }}
              />
            </div>
            <p className="key-manager__helper key-manager__helper--compact">
              {appLanguage === 'ru' ? 'Должна быть бесплатная модель OpenRouter в формате provider/model:free.' : 'Must be an OpenRouter free model in provider/model:free format.'}
            </p>
          </div>
        </div>

        {formError && (
          <div className="key-manager__field-error" role="alert">
            <AlertTriangle size={14} />
            <span>{formError}</span>
          </div>
        )}

        <div className="key-manager__footer-note">
          <Info size={14} />
          <span>{getTranslation('settings.tip_text', appLanguage)}</span>
        </div>

        <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
          <Plus size={16} />
          {getTranslation('settings.add_btn', appLanguage)}
        </button>
      </form>
    </div>
  );
}

export default KeyManager;
