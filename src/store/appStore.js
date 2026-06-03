import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Current state
  currentTask: null,
  userCode: '',
  selectedLanguage: 'python',
  selectedDifficulty: 'easy',
  selectedTopics: [],
  feedback: [],
  appLanguage: 'ru',

  // UI state
  currentPage: 'practice',
  isGenerating: false,
  isChecking: false,
  isRunning: false,
  showTaskGenerator: false,
  hintsRevealed: 0,
  timerEnabled: false,
  timerSeconds: 0,
  timerRunning: false,

  // Code output
  codeOutput: '',

  // Stats
  stats: {
    totalSolved: 0,
    newbie: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
    streak: 0,
    bestStreak: 0,
    xp: 0,
  },
  history: [],

  // Settings
  taskStyle: 'algorithmic',
  focusMode: 'correctness',
  maxHints: 3,
  timerLimit: 30,

  // API Keys
  apiKeys: [],

  // Actions
  setCurrentTask: (task) =>
    set({
      currentTask: task,
      hintsRevealed: 0,
      feedback: [],
      codeOutput: '',
    }),
  setUserCode: (code) => set({ userCode: code }),
  setSelectedLanguage: (lang) => {
    set({ selectedLanguage: lang });
    if (window.electronAPI) window.electronAPI.storeSet('selectedLanguage', lang);
  },
  setSelectedDifficulty: (diff) => {
    set({ selectedDifficulty: diff });
    if (window.electronAPI) window.electronAPI.storeSet('selectedDifficulty', diff);
  },
  setSelectedTopics: (topics) => set({ selectedTopics: topics }),

  addFeedback: (fb) =>
    set((state) => ({
      feedback: [
        ...state.feedback,
        { ...fb, id: Date.now(), timestamp: new Date().toISOString() },
      ],
    })),
  clearFeedback: () => set({ feedback: [] }),

  setCurrentPage: (page) => set({ currentPage: page }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsChecking: (v) => set({ isChecking: v }),
  setIsRunning: (v) => set({ isRunning: v }),
  setShowTaskGenerator: (v) => set({ showTaskGenerator: v }),
  setCodeOutput: (output) => set({ codeOutput: output }),
  clearCodeOutput: () => set({ codeOutput: '' }),

  revealNextHint: () =>
    set((state) => {
      const task = state.currentTask;
      if (!task || !task.hints) return state;
      const max = Math.min(task.hints.length, state.maxHints);
      if (state.hintsRevealed >= max) return state;
      return { hintsRevealed: state.hintsRevealed + 1 };
    }),
  resetHints: () => set({ hintsRevealed: 0 }),

  setTimerEnabled: (v) => {
    set({ timerEnabled: v });
    if (window.electronAPI) window.electronAPI.storeSet('timerEnabled', v);
  },
  incrementTimer: () =>
    set((state) => ({ timerSeconds: state.timerSeconds + 1 })),
  resetTimer: () => set({ timerSeconds: 0, timerRunning: false }),
  setTimerRunning: (v) => set({ timerRunning: v }),

  updateStats: (difficulty, solved) =>
    set((state) => {
      let nextStats;
      if (!solved) {
        nextStats = { ...state.stats, streak: 0 };
      } else {
        const xpMap = { newbie: 10, easy: 25, medium: 50, hard: 100, expert: 200 };
        const newStreak = state.stats.streak + 1;
        nextStats = {
          ...state.stats,
          totalSolved: state.stats.totalSolved + 1,
          [difficulty]: (state.stats[difficulty] || 0) + 1,
          streak: newStreak,
          bestStreak: Math.max(state.stats.bestStreak, newStreak),
          xp: state.stats.xp + (xpMap[difficulty] || 25),
        };
      }
      if (window.electronAPI) window.electronAPI.storeSet('stats', nextStats);
      return { stats: nextStats };
    }),

  addToHistory: (entry) =>
    set((state) => {
      const nextHistory = [
        { ...entry, id: Date.now(), timestamp: new Date().toISOString() },
        ...state.history,
      ];
      if (window.electronAPI) window.electronAPI.storeSet('history', nextHistory);
      return { history: nextHistory };
    }),

  setTaskStyle: (s) => {
    set({ taskStyle: s });
    if (window.electronAPI) window.electronAPI.storeSet('taskStyle', s);
  },
  setFocusMode: (f) => {
    set({ focusMode: f });
    if (window.electronAPI) window.electronAPI.storeSet('focusMode', f);
  },
  setMaxHints: (n) => {
    set({ maxHints: n });
    if (window.electronAPI) window.electronAPI.storeSet('maxHints', n);
  },
  setTimerLimit: (n) => {
    set({ timerLimit: n });
    if (window.electronAPI) window.electronAPI.storeSet('timerLimit', n);
  },
  setApiKeys: (keys) => set({ apiKeys: keys }),
  setAppLanguage: (lang) => {
    set({ appLanguage: lang });
    if (window.electronAPI) window.electronAPI.storeSet('appLanguage', lang);
  },
}));

export default useAppStore;
