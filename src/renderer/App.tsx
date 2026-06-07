import React, { useState, useEffect } from 'react';
import { TranscribeRequest, ProgressMessage } from './types';

const OUTPUT_FORMATS = ['txt', 'srt', 'vtt', 'json'];

const LANGUAGES: [string, string][] = [
  ['', 'Auto-detect'],
  ['en', 'English'],
  ['zh', 'Chinese'],
  ['de', 'German'],
  ['es', 'Spanish'],
  ['ru', 'Russian'],
  ['ko', 'Korean'],
  ['fr', 'French'],
  ['ja', 'Japanese'],
  ['pt', 'Portuguese'],
  ['tr', 'Turkish'],
  ['pl', 'Polish'],
  ['ca', 'Catalan'],
  ['nl', 'Dutch'],
  ['ar', 'Arabic'],
  ['sv', 'Swedish'],
  ['it', 'Italian'],
  ['id', 'Indonesian'],
  ['hi', 'Hindi'],
  ['fi', 'Finnish'],
  ['vi', 'Vietnamese'],
  ['he', 'Hebrew'],
  ['uk', 'Ukrainian'],
  ['el', 'Greek'],
  ['ms', 'Malay'],
  ['cs', 'Czech'],
  ['ro', 'Romanian'],
  ['da', 'Danish'],
  ['hu', 'Hungarian'],
  ['ta', 'Tamil'],
  ['no', 'Norwegian'],
  ['th', 'Thai'],
  ['ur', 'Urdu'],
  ['hr', 'Croatian'],
  ['bg', 'Bulgarian'],
  ['lt', 'Lithuanian'],
  ['la', 'Latin'],
  ['mi', 'Maori'],
  ['ml', 'Malayalam'],
  ['cy', 'Welsh'],
  ['sk', 'Slovak'],
  ['te', 'Telugu'],
  ['fa', 'Persian'],
  ['lv', 'Latvian'],
  ['bn', 'Bengali'],
  ['sr', 'Serbian'],
  ['az', 'Azerbaijani'],
  ['sl', 'Slovenian'],
  ['kn', 'Kannada'],
  ['et', 'Estonian'],
  ['mk', 'Macedonian'],
  ['br', 'Breton'],
  ['eu', 'Basque'],
  ['is', 'Icelandic'],
  ['hy', 'Armenian'],
  ['ne', 'Nepali'],
  ['mn', 'Mongolian'],
  ['bs', 'Bosnian'],
  ['kk', 'Kazakh'],
  ['sq', 'Albanian'],
  ['sw', 'Swahili'],
  ['gl', 'Galician'],
  ['mr', 'Marathi'],
  ['pa', 'Punjabi'],
  ['si', 'Sinhala'],
  ['km', 'Khmer'],
  ['sn', 'Shona'],
  ['yo', 'Yoruba'],
  ['so', 'Somali'],
  ['af', 'Afrikaans'],
  ['oc', 'Occitan'],
  ['ka', 'Georgian'],
  ['be', 'Belarusian'],
  ['tg', 'Tajik'],
  ['sd', 'Sindhi'],
  ['gu', 'Gujarati'],
  ['am', 'Amharic'],
  ['yi', 'Yiddish'],
  ['lo', 'Lao'],
  ['uz', 'Uzbek'],
  ['fo', 'Faroese'],
  ['ht', 'Haitian Creole'],
  ['ps', 'Pashto'],
  ['tk', 'Turkmen'],
  ['nn', 'Nynorsk'],
  ['mt', 'Maltese'],
  ['sa', 'Sanskrit'],
  ['lb', 'Luxembourgish'],
  ['my', 'Myanmar'],
  ['bo', 'Tibetan'],
  ['tl', 'Tagalog'],
  ['mg', 'Malagasy'],
  ['as', 'Assamese'],
  ['tt', 'Tatar'],
  ['haw', 'Hawaiian'],
  ['ln', 'Lingala'],
  ['ha', 'Hausa'],
  ['ba', 'Bashkir'],
  ['jw', 'Javanese'],
  ['su', 'Sundanese'],
];

export default function App() {
  const [inputFile, setInputFile] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [modelName, setModelName] = useState('medium');
  const [device, setDevice] = useState<'auto' | 'cpu' | 'cuda'>('auto');
  const [formats, setFormats] = useState<string[]>(['txt', 'srt']);
  const [task, setTask] = useState<'transcribe' | 'translate'>('transcribe');
  const [language, setLanguage] = useState('en');

  const [deviceInfo, setDeviceInfo] = useState<{ cuda: boolean; gpuName?: string } | null>(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.api.listModels().then(setModels);
    window.api.detectDevice().then(setDeviceInfo).catch(() => setDeviceInfo({ cuda: false }));
    const unsub = window.api.onProgress((p: ProgressMessage) => {
      setProgress(p.message || `${p.percent ?? 0}%`);
      setProgressPercent(p.percent ?? 0);
    });
    return unsub;
  }, []);

  const handleSelectFile = async () => {
    const f = await window.api.selectFile();
    if (f) setInputFile(f);
  };

  const handleSelectOutputDir = async () => {
    const d = await window.api.selectOutputDir();
    if (d) setOutputDir(d);
  };

  const toggleFormat = (fmt: string) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  };

  const handleTranscribe = async () => {
    if (!inputFile || !outputDir || formats.length === 0) return;
    setStatus('running');
    setError(null);
    setProgress('Starting...');
    setProgressPercent(0);
    try {
      const request: TranscribeRequest = {
        inputFile,
        outputDirectory: outputDir,
        modelName,
        outputFormats: formats,
        device,
        language: language || null,
        task,
      };
      const result = await window.api.transcribe(request);
      if (result.status === 'error') {
        setError(result.error || 'Transcription failed');
        setStatus('error');
      } else {
        setStatus('done');
        setProgress('Complete');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      setStatus('error');
    }
  };

  const handleCancel = () => {
    window.api.cancelTranscription();
    setStatus('idle');
    setProgress('');
  };

  const backendLabel = deviceInfo
    ? deviceInfo.cuda ? `Backend: CUDA (${deviceInfo.gpuName || 'NVIDIA GPU'})` : 'Backend: CPU'
    : 'Detecting...';

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22 }}>Transcriptor</h1>
      <p style={{ fontSize: 13, color: '#666' }}>{backendLabel}</p>
      {deviceInfo && !deviceInfo.cuda && (
        <p style={{ fontSize: 12, color: '#b45' }}>
          NVIDIA CUDA acceleration unavailable. CPU mode will be used.
        </p>
      )}

      <section style={{ marginTop: 16 }}>
        <button onClick={handleSelectFile}>Select Input File</button>
        {inputFile && <span style={{ marginLeft: 8, fontSize: 13 }}>{inputFile}</span>}
      </section>

      <section style={{ marginTop: 12 }}>
        <button onClick={handleSelectOutputDir}>Select Output Folder</button>
        {outputDir && <span style={{ marginLeft: 8, fontSize: 13 }}>{outputDir}</span>}
      </section>

      <section style={{ marginTop: 16 }}>
        <label>Model: </label>
        <select value={modelName} onChange={e => setModelName(e.target.value)}>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </section>

      <section style={{ marginTop: 12 }}>
        <label>Device: </label>
        <select value={device} onChange={e => setDevice(e.target.value as any)}>
          <option value="auto">Auto</option>
          <option value="cpu">CPU</option>
          <option value="cuda">CUDA</option>
        </select>
      </section>

      <section style={{ marginTop: 12 }}>
        <label>Task: </label>
        <select value={task} onChange={e => setTask(e.target.value as any)}>
          <option value="transcribe">Transcribe</option>
          <option value="translate">Translate to English</option>
        </select>
      </section>

      <section style={{ marginTop: 12 }}>
        <label>Language: </label>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </section>

      <section style={{ marginTop: 12 }}>
        <label>Output Formats: </label>
        {OUTPUT_FORMATS.map(fmt => (
          <label key={fmt} style={{ marginLeft: 8 }}>
            <input type="checkbox" checked={formats.includes(fmt)} onChange={() => toggleFormat(fmt)} />
            {fmt}
          </label>
        ))}
      </section>

      <section style={{ marginTop: 24 }}>
        {status !== 'running' ? (
          <button onClick={handleTranscribe} disabled={!inputFile || !outputDir || formats.length === 0}>
            Start Transcription
          </button>
        ) : (
          <button onClick={handleCancel}>Cancel</button>
        )}
      </section>

      {progress && (
        <section style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, marginBottom: 4 }}>{progress}</p>
          {status === 'running' && progressPercent > 0 && (
            <div style={{ background: '#eee', borderRadius: 4, height: 8, width: '100%' }}>
              <div style={{ background: '#4a9', borderRadius: 4, height: 8, width: `${progressPercent}%`, transition: 'width 0.3s' }} />
            </div>
          )}
        </section>
      )}
      {error && <p style={{ marginTop: 8, color: 'red', fontSize: 13 }}>{error}</p>}
      {status === 'done' && <p style={{ marginTop: 8, color: 'green', fontSize: 13 }}>Transcription complete!</p>}
    </div>
  );
}
