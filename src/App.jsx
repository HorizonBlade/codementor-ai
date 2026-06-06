import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import TaskGenerator from './components/TaskGenerator';
import AssistantChat from './components/AssistantChat';
import PracticePage from './pages/PracticePage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import { useAppStore } from './store/appStore';

function App() {
  const showTaskGenerator = useAppStore((s) => s.showTaskGenerator);

  // Load persisted config and key pool on startup
  useEffect(() => {
    const loadPersistedData = async () => {
      if (!window.electronAPI) return;
      try {
        const statsRes = await window.electronAPI.storeGet('stats');
        const historyRes = await window.electronAPI.storeGet('history');
        const keysRes = await window.electronAPI.getKeys();

        const updates = {};
        if (statsRes?.success && statsRes.data) {
          updates.stats = statsRes.data;
        }
        if (historyRes?.success && historyRes.data) {
          updates.history = historyRes.data;
        }
        if (keysRes?.success && keysRes.data) {
          updates.apiKeys = keysRes.data;
        }

        // Load settings preferences
        const settingsFields = [
          'selectedLanguage', 'selectedDifficulty', 'timerEnabled',
          'taskStyle', 'focusMode', 'maxHints', 'timerLimit', 'appLanguage',
          'saveSolutionsEnabled'
        ];
        
        for (const field of settingsFields) {
          const res = await window.electronAPI.storeGet(field);
          if (res?.success && res.data !== undefined && res.data !== null) {
            updates[field] = res.data;
          }
        }

        if (Object.keys(updates).length > 0) {
          useAppStore.setState(updates);
        }
      } catch (err) {
        console.error('Failed to restore persisted app state:', err);
      }
    };

    loadPersistedData();
  }, []);

  return (
    <HashRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <Navbar />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<PracticePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
        {showTaskGenerator && <TaskGenerator />}
        <AssistantChat />
      </div>
    </HashRouter>
  );
}

export default App;
