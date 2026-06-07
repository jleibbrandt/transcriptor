# Transcriptor

A desktop transcription app that runs OpenAI Whisper models locally on your machine. No cloud, no API keys, no subscriptions.

## Features

- **Fully local** — your audio never leaves your computer
- **CUDA acceleration** — fast transcription on NVIDIA GPUs
- **CPU fallback** — works on any Windows PC
- **Multiple output formats** — TXT, SRT, VTT, JSON
- **99 languages** supported
- **Model selection** — tiny to large, balance speed vs accuracy

## Download

Get the latest installer from [Releases](https://github.com/jleibbrandt/transcriptor/releases/latest).

### Lite Installer

The lite installer (~77MB) downloads the required dependencies during setup:

- Python runtime
- PyTorch (with CUDA 12.4 support)
- OpenAI Whisper
- FFmpeg

**Internet connection required during installation.** Total download during install: ~2.5GB.

> **Note:** Windows may block the installer because it's unsigned. Right-click the exe → Properties → Unblock → OK, then run it.

## Usage

1. Open Transcriptor
2. Select an audio or video file
3. Choose an output folder
4. Pick a model (medium is a good default)
5. Select output formats
6. Click **Start Transcription**

The first time you use a model, it will be downloaded (~1.5GB for medium). After that, transcriptions start immediately.

## Supported Formats

### Input
MP3, MP4, WAV, FLAC, OGG, M4A, WEBM, MKV, AVI, MOV

### Output
| Format | Description |
|--------|-------------|
| TXT | Plain text transcript |
| SRT | SubRip subtitles |
| VTT | WebVTT subtitles |
| JSON | Full Whisper result object |

## Models

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| tiny | 75 MB | Fastest | Basic |
| base | 142 MB | Fast | Fair |
| small | 462 MB | Moderate | Good |
| medium | 1.5 GB | Slow | Great |
| large | 2.9 GB | Slowest | Best |
| turbo | 1.6 GB | Fast | Great |

English-only variants available: tiny.en, base.en, small.en, medium.en

Models are downloaded on first use to `%APPDATA%/Transcriptor/models/`.

## System Requirements

- Windows 10/11 (64-bit)
- 8 GB RAM minimum (16 GB recommended for large models)
- Internet connection for initial setup and model downloads

### GPU Acceleration (Optional)
- NVIDIA GPU with CUDA support
- Latest NVIDIA drivers

AMD GPUs are not supported.

## Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- FFmpeg on PATH

### Setup
```bash
npm install
cd python
pip install -r requirements.txt
```

### Run
```bash
npm run dev
```

### Build
```bash
scripts\build-lite.bat
```

## Architecture

```
Electron (TypeScript/React)
  └── spawns → Python worker
                  └── uses → openai-whisper + PyTorch + FFmpeg
```

The Electron app handles the UI and process management. Transcription is performed by a Python worker using the official OpenAI Whisper package.

## License

Copyright (c) 2026 Jonathan Leibbrandt

This application is licensed under the Apache License, Version 2.0.
See the [LICENSE](LICENSE) file for details.

## Third-Party

This project uses [OpenAI Whisper](https://github.com/openai/whisper), licensed under the MIT License.
