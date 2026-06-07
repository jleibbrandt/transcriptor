# Transcriptor

Local Whisper transcription app using the **official OpenAI Whisper** Python package.

## Architecture

```
Electron (TypeScript/React)
  └── spawns → whisper-worker.exe (PyInstaller-packaged Python)
                  └── uses → openai-whisper + PyTorch + FFmpeg
```

## Supported Backends

| Device | Requirement |
|--------|-------------|
| CPU    | Always works |
| CUDA   | NVIDIA GPU + CUDA-capable PyTorch |

AMD GPUs are **not supported**.

## Prerequisites (Development)

- Node.js 18+
- Python 3.10+
- FFmpeg on PATH (or place `ffmpeg.exe` in `vendor/ffmpeg/`)
- (Optional) NVIDIA GPU with CUDA drivers for GPU acceleration

## Setup

```bash
npm install
cd python
pip install -r requirements.txt
```

## Development

```bash
# Terminal 1: Vite dev server
npm run dev:renderer

# Terminal 2: Electron
npm run dev:main
```

## Build

```bash
scripts\build-all.bat
```

Or step by step:

1. `cd python && pyinstaller whisper-worker.spec --noconfirm`
2. Place `ffmpeg.exe` in `vendor/ffmpeg/`
3. `npm run dist`

## Output Formats

- TXT — plain text transcript
- SRT — SubRip subtitles
- VTT — WebVTT subtitles
- JSON — full Whisper result object

## Models

Uses official Whisper model names: `tiny`, `base`, `small`, `medium`, `large`, `turbo`  
English-only variants: `tiny.en`, `base.en`, `small.en`, `medium.en`

Models are downloaded to `%APPDATA%/Transcriptor/models/` on first use.
