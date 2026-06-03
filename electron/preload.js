// electron/preload.js — Context bridge exposing window.electronAPI
// CommonJS module

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── API calls ─────────────────────────────────────────────────────
  generateTask: (params) => ipcRenderer.invoke('api:generate-task', params),
  checkSolution: (params) => ipcRenderer.invoke('api:check-solution', params),
  runCode: (params) => ipcRenderer.invoke('api:run-code', params),

  // ─── API key management ────────────────────────────────────────────
  getKeys: () => ipcRenderer.invoke('keys:get'),
  setKeys: (keys) => ipcRenderer.invoke('keys:set', keys),
  testKey: (key) => ipcRenderer.invoke('keys:test', key),

  // ─── Persistent store ──────────────────────────────────────────────
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),
});
