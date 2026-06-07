import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  detectDevice: () => ipcRenderer.invoke('detect-device'),
  listModels: () => ipcRenderer.invoke('list-models'),
  transcribe: (request: any) => ipcRenderer.invoke('transcribe', request),
  cancelTranscription: () => ipcRenderer.invoke('cancel-transcription'),
  onProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('transcription-progress', (_event, progress) => callback(progress));
    return () => { ipcRenderer.removeAllListeners('transcription-progress'); };
  },
});
