// electron/main.js — Electron main process
// CommonJS module

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const KeyPool = require('./api/keyPool');
const OpenRouter = require('./api/openrouter');

// ─── Paths ────────────────────────────────────────────────────────────
const DATA_FILE = () => path.join(app.getPath('userData'), 'codementor-data.json');
const KEYS_FILE = () => path.join(app.getPath('userData'), 'api-keys.json');

// ─── Singletons ───────────────────────────────────────────────────────
const keyPool = new KeyPool();
const openrouter = new OpenRouter(keyPool);

// ─── Persistent JSON helpers ──────────────────────────────────────────
function readJSON(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[main] Failed to read ${filePath}:`, err.message);
  }
  return {};
}

function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[main] Failed to write ${filePath}:`, err.message);
  }
}

// ─── Strip ANSI escape codes helper ────────────────────────────────────
function stripAnsi(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    .replace(/R\[\d+m/g, '');
}

// ─── Child process helper (run code locally) ──────────────────────────
function runProcess(cmd, args, timeoutMs = 15000) {
  const { spawn } = require('child_process');
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    const proc = spawn(cmd, args, {
      timeout: timeoutMs,
      shell: process.platform === 'win32', // use shell on Windows for PATH resolution
      windowsHide: true,
    });

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, exitCode: 1 });
    });

    proc.on('close', (exitCode) => {
      if (killed) {
        resolve({ stdout, stderr: stderr + '\n⏱ Process timed out (15s limit)', exitCode: 1 });
      } else {
        resolve({ stdout, stderr, exitCode: exitCode ?? 0 });
      }
    });

    // Safety timeout
    setTimeout(() => {
      if (!proc.killed) {
        killed = true;
        proc.kill('SIGTERM');
      }
    }, timeoutMs);
  });
}

// ─── Dev mode detection ───────────────────────────────────────────────
function isDev() {
  if (process.env.VITE_DEV_SERVER_URL) return true;
  if (process.argv.includes('--dev')) return true;
  // If the production build doesn't exist yet, assume dev
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) return true;
  return false;
}

// ─── Window creation ──────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0a14',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Graceful show
  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev()) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log(`[main] Loading dev server: ${devUrl}`);
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const prodPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log(`[main] Loading production build: ${prodPath}`);
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Menu ─────────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'CodeMentor AI',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
  ];

  // On macOS the first menu item is treated as the app menu; on Windows/Linux
  // we keep it simple.
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── IPC Handlers ─────────────────────────────────────────────────────
function registerIPC() {
  // --- API calls -------------------------------------------------------
  ipcMain.handle('api:generate-task', async (_event, params) => {
    try {
      console.log('[IPC] api:generate-task', params);
      // Ensure keys are loaded
      loadKeysIntoPool();
      const result = await openrouter.generateTask(params);
      return { success: true, data: result };
    } catch (err) {
      console.error('[IPC] api:generate-task error:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('api:check-solution', async (_event, params) => {
    try {
      console.log('[IPC] api:check-solution');
      loadKeysIntoPool();
      const result = await openrouter.checkSolution(params);
      return { success: true, data: result };
    } catch (err) {
      console.error('[IPC] api:check-solution error:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('api:ask-assistant', async (_event, params) => {
    try {
      console.log('[IPC] api:ask-assistant');
      loadKeysIntoPool();
      const result = await openrouter.askAssistant(params);
      return { success: true, data: result };
    } catch (err) {
      console.error('[IPC] api:ask-assistant error:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('api:run-code', async (_event, params) => {
    const { code, language } = params;
    console.log(`[IPC] api:run-code (${language})`);

    // Map language id to file extension + runtime command
    const langConfig = {
      javascript: { ext: '.js', cmd: 'node', args: (f) => [f] },
      typescript: { ext: '.ts', cmd: 'npx', args: (f) => ['tsx', f] },
      python:     { ext: '.py', cmd: 'python', args: (f) => [f] },
      java:       { ext: '.java', compile: true },
      cpp:        { ext: '.cpp', compile: true },
      csharp:     { ext: '.cs', cmd: 'dotnet-script', args: (f) => [f] },
      go:         { ext: '.go', cmd: 'go', args: (f) => ['run', f] },
      rust:       { ext: '.rs', compile: true },
    };

    const config = langConfig[language];
    if (!config) {
      return { success: false, error: `Unsupported language: ${language}` };
    }

    const os = require('os');
    const { execFile, exec } = require('child_process');
    const tmpDir = os.tmpdir();
    const timestamp = Date.now();
    const tmpFile = path.join(tmpDir, `codementor_${timestamp}${config.ext}`);

    try {
      // Write code to temp file
      fs.writeFileSync(tmpFile, code, 'utf-8');

      let output;

      if (language === 'cpp') {
        // Compile + run C++
        const outFile = path.join(tmpDir, `codementor_${timestamp}.exe`);
        output = await runProcess('g++', [tmpFile, '-o', outFile, '-std=c++17'], 15000);
        if (output.exitCode !== 0) {
          return { success: true, data: { output: stripAnsi(output.stderr || output.stdout || 'Compilation failed') } };
        }
        output = await runProcess(outFile, [], 15000);
        try { fs.unlinkSync(outFile); } catch {}

      } else if (language === 'java') {
        // Java: extract class name, compile, run
        const classMatch = code.match(/class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Main';
        const javaFile = path.join(tmpDir, `${className}.java`);
        fs.writeFileSync(javaFile, code, 'utf-8');
        output = await runProcess('javac', [javaFile], 15000);
        if (output.exitCode !== 0) {
          return { success: true, data: { output: stripAnsi(output.stderr || output.stdout || 'Compilation failed') } };
        }
        output = await runProcess('java', ['-cp', tmpDir, className], 15000);
        try { fs.unlinkSync(javaFile); fs.unlinkSync(path.join(tmpDir, `${className}.class`)); } catch {}

      } else if (language === 'rust') {
        // Compile + run Rust
        const outFile = path.join(tmpDir, `codementor_${timestamp}.exe`);
        output = await runProcess('rustc', [tmpFile, '-o', outFile], 15000);
        if (output.exitCode !== 0) {
          return { success: true, data: { output: stripAnsi(output.stderr || output.stdout || 'Compilation failed') } };
        }
        output = await runProcess(outFile, [], 15000);
        try { fs.unlinkSync(outFile); } catch {}

      } else {
        // Interpreted languages (JS, TS, Python, Go, C#)
        output = await runProcess(config.cmd, config.args(tmpFile), 15000);
      }

      const result = [output.stdout, output.stderr].filter(Boolean).join('\n').trim();
      return { success: true, data: { output: stripAnsi(result) || '(no output)' } };

    } catch (err) {
      console.error('[IPC] api:run-code error:', err.message);
      return { success: false, error: err.message };
    } finally {
      // Cleanup temp file
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  });

  // --- Key management --------------------------------------------------
  ipcMain.handle('keys:get', async () => {
    try {
      const data = readJSON(KEYS_FILE());
      return { success: true, data: data.keys || [] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('keys:set', async (_event, keys) => {
    try {
      writeJSON(KEYS_FILE(), { keys });
      loadKeysIntoPool();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('keys:test', async (_event, keyConfig) => {
    try {
      // Quick test: send a tiny request using the provided key
      const testPool = new KeyPool();
      testPool.loadKeys([{
        key: keyConfig.key,
        baseUrl: keyConfig.baseUrl,
        model: keyConfig.model,
        status: 'active',
        lastError: null,
        errorCount: 0,
        lastUsed: null,
        requestCount: 0,
      }]);
      const testRouter = new OpenRouter(testPool);

      const result = await testRouter.makeRequest(
        [
          { role: 'system', content: 'Reply with exactly: OK' },
          { role: 'user', content: 'Test' },
        ],
        { temperature: 0, maxTokens: 10 }
      );

      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // --- Persistent store ------------------------------------------------
  ipcMain.handle('store:get', async (_event, key) => {
    try {
      const store = readJSON(DATA_FILE());
      return { success: true, data: key ? store[key] : store };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('store:set', async (_event, key, value) => {
    try {
      const store = readJSON(DATA_FILE());
      store[key] = value;
      writeJSON(DATA_FILE(), store);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

// ─── Helper: reload keys from disk into the pool ──────────────────────
function loadKeysIntoPool() {
  const data = readJSON(KEYS_FILE());
  const keys = data.keys || [];
  if (keys.length > 0 && keyPool.keys.length === 0) {
    keyPool.loadKeys(keys);
  } else if (keys.length > 0) {
    // Check if any persisted configuration fields have changed
    const currentFingerprints = JSON.stringify(
      keyPool.keys.map((k) => ({
        key: k.key,
        baseUrl: k.baseUrl,
        model: k.model,
      }))
    );
    const newFingerprints = JSON.stringify(
      keys.map((k) => ({
        key: k.key,
        baseUrl: k.baseUrl,
        model: k.model,
      }))
    );
    if (currentFingerprints !== newFingerprints) {
      keyPool.loadKeys(keys);
    }
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu();
  registerIPC();
  createWindow();

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
