## Transcriptor v1.0.0 - Initial Release

Local Whisper transcription app using the official OpenAI Whisper Python package.

### Features
- Transcribe audio/video files locally (no cloud)
- CUDA acceleration (NVIDIA GPUs) or CPU
- Models: tiny, base, small, medium, large, turbo
- Output formats: TXT, SRT, VTT, JSON
- Language selection (99 languages)

### Lite Installer
This installer downloads dependencies during setup (~2.5GB):
- Python embeddable runtime
- PyTorch with CUDA 12.4
- OpenAI Whisper
- FFmpeg

**Requires internet connection during installation.**

Right-click the exe → Properties → Unblock before running (unsigned).
