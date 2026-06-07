import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export function getWorkerDir(): string {
  return path.join(process.resourcesPath, 'whisper-worker');
}

export function isWorkerInstalled(): boolean {
  return fs.existsSync(path.join(getWorkerDir(), 'whisper-worker.exe'));
}

export function needsSetup(): boolean {
  return !isWorkerInstalled();
}
