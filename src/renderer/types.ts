export {};

declare global {
  interface Window {
    api: {
      selectFile: () => Promise<string | null>;
      selectOutputDir: () => Promise<string | null>;
      detectDevice: () => Promise<{ cuda: boolean; gpuName?: string; cudaVersion?: string }>;
      listModels: () => Promise<string[]>;
      transcribe: (request: TranscribeRequest) => Promise<TranscribeResult>;
      cancelTranscription: () => Promise<void>;
      onProgress: (callback: (progress: ProgressMessage) => void) => () => void;
    };
  }
}

export interface TranscribeRequest {
  inputFile: string;
  outputDirectory: string;
  modelName: string;
  outputFormats: string[];
  device: 'auto' | 'cpu' | 'cuda';
  language: string | null;
  task: 'transcribe' | 'translate';
}

export interface TranscribeResult {
  type: 'result';
  status: 'ok' | 'error';
  outputFiles?: string[];
  error?: string;
}

export interface ProgressMessage {
  type: 'progress';
  percent?: number;
  message?: string;
}
