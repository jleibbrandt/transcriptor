import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { WorkerManager } from './worker';

let mainWindow: BrowserWindow | null = null;
let workerManager: WorkerManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function getWorkerPath(): { exe: string; args: string[] } {
  if (!app.isPackaged) {
    return { exe: 'python', args: [path.join(__dirname, '../../python/whisper_worker.py')] };
  }
  // Full build: PyInstaller-packaged worker exe
  const bundledWorker = path.join(process.resourcesPath, 'whisper-worker', 'whisper-worker.exe');
  if (fs.existsSync(bundledWorker)) {
    return { exe: bundledWorker, args: [] };
  }
  // Lite build: embedded Python + worker script
  const embeddedPython = path.join(process.resourcesPath, 'python', 'python.exe');
  const workerScript = path.join(process.resourcesPath, 'worker', 'whisper_worker.py');
  return { exe: embeddedPython, args: [workerScript] };
}

function getModelDir(): string {
  return path.join(app.getPath('appData'), 'Transcriptor', 'models');
}

app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();

  const worker = getWorkerPath();
  workerManager = new WorkerManager(worker.exe, worker.args);
});

app.on('window-all-closed', () => {
  app.quit();
});

function registerIpcHandlers() {
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Media Files', extensions: ['mp3', 'mp4', 'wav', 'flac', 'ogg', 'm4a', 'webm', 'mkv', 'avi', 'mov'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('select-output-dir', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('detect-device', async () => {
    return workerManager.detectDevice();
  });

  ipcMain.handle('list-models', () => {
    return ['tiny', 'base', 'small', 'medium', 'large', 'turbo', 'tiny.en', 'base.en', 'small.en', 'medium.en'];
  });

  ipcMain.handle('transcribe', async (_event, request: TranscribeRequest) => {
    const fullRequest = { ...request, modelDir: getModelDir() };
    return workerManager.transcribe(fullRequest, (progress) => {
      mainWindow?.webContents.send('transcription-progress', progress);
    });
  });

  ipcMain.handle('cancel-transcription', () => {
    workerManager.cancel();
  });
}

interface TranscribeRequest {
  inputFile: string;
  outputDirectory: string;
  modelName: string;
  outputFormats: string[];
  device: 'auto' | 'cpu' | 'cuda';
  language: string | null;
  task: 'transcribe' | 'translate';
}
