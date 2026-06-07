import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class WorkerManager {
  private exe: string;
  private baseArgs: string[];
  private process: ChildProcess | null = null;

  constructor(exe: string, baseArgs: string[] = []) {
    this.exe = exe;
    this.baseArgs = baseArgs;
  }

  async detectDevice(): Promise<{ cuda: boolean; gpuName?: string; cudaVersion?: string }> {
    const result = await this.runWorker({ action: 'detect-device' });
    return result;
  }

  async transcribe(request: any, onProgress: (p: any) => void): Promise<any> {
    return this.runWorker({ action: 'transcribe', ...request }, onProgress);
  }

  cancel() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  private runWorker(request: any, onProgress?: (p: any) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestFile = path.join(os.tmpdir(), `transcriptor-req-${Date.now()}.json`);
      fs.writeFileSync(requestFile, JSON.stringify(request));

      this.process = spawn(this.exe, [...this.baseArgs, '--request', requestFile]);

      let stdout = '';
      let stderr = '';

      this.process.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        for (const line of text.split('\n').filter(Boolean)) {
          try {
            const msg = JSON.parse(line);
            if (msg.type === 'progress' && onProgress) {
              onProgress(msg);
            } else if (msg.type === 'result') {
              stdout = line;
            }
          } catch {
            stdout += line;
          }
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      this.process.on('close', (code) => {
        this.process = null;
        try { fs.unlinkSync(requestFile); } catch {}

        if (code === 0 && stdout) {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            resolve({ status: 'ok', raw: stdout });
          }
        } else if (code === null || code === 1) {
          // Killed by cancel or forced exit
          resolve({ status: 'error', error: 'Cancelled' });
        } else {
          // Only show first line of stderr to avoid tqdm spam
          const errMsg = (stderr || '').split('\n').filter(l => l.trim() && !l.includes('iB/s')).slice(0, 3).join(' ') || `Worker exited with code ${code}`;
          reject(new Error(errMsg));
        }
      });

      this.process.on('error', (err) => {
        this.process = null;
        reject(err);
      });
    });
  }
}
