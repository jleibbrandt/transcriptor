"""Whisper Worker - Uses official OpenAI Whisper for transcription."""
import sys
import json
import argparse
import os
from pathlib import Path


def detect_device():
    """Detect CUDA availability via PyTorch."""
    import torch
    if torch.cuda.is_available():
        return {
            "type": "result",
            "cuda": True,
            "gpuName": torch.cuda.get_device_name(0),
            "cudaVersion": torch.version.cuda,
        }
    return {"type": "result", "cuda": False}


def emit(msg: dict):
    """Write a JSON message to stdout."""
    print(json.dumps(msg), flush=True)


# Expected model sizes in bytes (approximate)
MODEL_SIZES = {
    "tiny": 75_000_000,
    "tiny.en": 75_000_000,
    "base": 142_000_000,
    "base.en": 142_000_000,
    "small": 462_000_000,
    "small.en": 462_000_000,
    "medium": 1_460_000_000,
    "medium.en": 1_460_000_000,
    "large": 2_870_000_000,
    "turbo": 1_550_000_000,
}


def monitor_download(model_name: str, model_dir: str, stop_event):
    """Monitor model download progress by checking file size on disk."""
    import time
    import glob
    expected = MODEL_SIZES.get(model_name, 0)
    if not expected:
        return

    while not stop_event.is_set():
        time.sleep(0.5)
        # Whisper saves directly to the .pt file while downloading
        files = glob.glob(os.path.join(model_dir, "*.pt"))
        if not files:
            continue
        # Find the file being written (most recently modified)
        target = max(files, key=os.path.getmtime)
        try:
            size = os.path.getsize(target)
        except OSError:
            continue
        if size >= expected:
            break
        percent = min(int(size / expected * 100), 99)
        emit({"type": "progress", "message": f"Downloading model '{model_name}'... {percent}%", "percent": percent})


def transcribe(request: dict):
    """Run transcription using official OpenAI Whisper."""
    import torch
    import whisper

    input_file = request["inputFile"]
    output_dir = request["outputDirectory"]
    model_name = request["modelName"]
    output_formats = request.get("outputFormats", ["txt"])
    device_pref = request.get("device", "auto")
    language = request.get("language")
    task = request.get("task", "transcribe")
    model_dir = request.get("modelDir")

    # Resolve device
    if device_pref == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    elif device_pref == "cuda":
        if not torch.cuda.is_available():
            emit({"type": "result", "status": "error",
                  "error": "CUDA was selected, but PyTorch cannot access CUDA on this machine."})
            return
        device = "cuda"
    else:
        device = "cpu"

    emit({"type": "progress", "message": f"Loading model '{model_name}' on {device}..."})

    kwargs = {"name": model_name, "device": device}
    need_download = False
    if model_dir:
        kwargs["download_root"] = model_dir
        os.makedirs(model_dir, exist_ok=True)
        # Only monitor if model file doesn't exist yet
        model_file = os.path.join(model_dir, f"{model_name}.pt")
        need_download = not os.path.isfile(model_file)

    stop_event = None
    if need_download:
        import threading
        emit({"type": "progress", "message": f"Downloading model '{model_name}'...", "percent": 0})
        stop_event = threading.Event()
        monitor = threading.Thread(target=monitor_download, args=(model_name, model_dir, stop_event), daemon=True)
        monitor.start()

    model = whisper.load_model(**kwargs)

    if stop_event:
        stop_event.set()

    emit({"type": "progress", "message": "Transcribing...", "percent": 0})

    transcribe_opts: dict = {"task": task, "verbose": False}
    if language:
        transcribe_opts["language"] = language

    # Get audio duration to calculate progress from segments
    import whisper.audio
    audio = whisper.audio.load_audio(input_file)
    duration = len(audio) / whisper.audio.SAMPLE_RATE

    # Patch model.transcribe to track progress via segments
    import whisper.transcribe
    _original_decode = model.decode
    segments_seen = {"time": 0.0}

    def _patched_decode(*args, **kwargs):
        result = _original_decode(*args, **kwargs)
        # Each decode call processes up to 30s of audio
        segments_seen["time"] += 30.0
        percent = min(int(segments_seen["time"] / duration * 100), 99)
        emit({"type": "progress", "message": f"Transcribing... {percent}%", "percent": percent})
        return result

    model.decode = _patched_decode
    result = model.transcribe(input_file, **transcribe_opts)
    model.decode = _original_decode

    # Write outputs
    os.makedirs(output_dir, exist_ok=True)
    stem = Path(input_file).stem
    output_files = []

    if "txt" in output_formats:
        p = os.path.join(output_dir, f"{stem}.txt")
        with open(p, "w", encoding="utf-8") as f:
            f.write(result["text"].strip())
        output_files.append(p)

    if "srt" in output_formats:
        p = os.path.join(output_dir, f"{stem}.srt")
        with open(p, "w", encoding="utf-8") as f:
            for i, seg in enumerate(result["segments"], 1):
                f.write(f"{i}\n")
                f.write(f"{format_ts(seg['start'])} --> {format_ts(seg['end'])}\n")
                f.write(f"{seg['text'].strip()}\n\n")
        output_files.append(p)

    if "vtt" in output_formats:
        p = os.path.join(output_dir, f"{stem}.vtt")
        with open(p, "w", encoding="utf-8") as f:
            f.write("WEBVTT\n\n")
            for seg in result["segments"]:
                f.write(f"{format_ts(seg['start'])} --> {format_ts(seg['end'])}\n")
                f.write(f"{seg['text'].strip()}\n\n")
        output_files.append(p)

    if "json" in output_formats:
        p = os.path.join(output_dir, f"{stem}.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2, default=str)
        output_files.append(p)

    emit({"type": "result", "status": "ok", "outputFiles": output_files})


def format_ts(seconds: float) -> str:
    """Format seconds to SRT/VTT timestamp."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    # Suppress tqdm progress bars since we report our own progress
    os.environ["TQDM_DISABLE"] = "1"

    parser = argparse.ArgumentParser()
    parser.add_argument("--request", required=True, help="Path to JSON request file")
    args = parser.parse_args()

    with open(args.request, "r", encoding="utf-8") as f:
        request = json.load(f)

    action = request.get("action", "transcribe")

    try:
        if action == "detect-device":
            emit(detect_device())
        elif action == "transcribe":
            transcribe(request)
        else:
            emit({"type": "result", "status": "error", "error": f"Unknown action: {action}"})
    except Exception as e:
        emit({"type": "result", "status": "error", "error": str(e)})


if __name__ == "__main__":
    main()
