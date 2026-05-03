import subprocess
import os

from app.utils.audio import split_audio

# --- Paths ---
MODEL_PATH = "whisper.cpp/models/ggml-base.bin"
WHISPER_BIN = "whisper.cpp/build/bin/whisper-cli"


def run_whisper(file_path: str, mode: str = "transcribe", language: str = "auto") -> str:
    """
    mode: "transcribe" | "translate"
    language: "hi" | "mr" | "en" | "auto"
    """

    cmd = [
        WHISPER_BIN,
        "-m", MODEL_PATH,
        "-f", file_path,
        "-nt",          # no timestamps
        "-t", "2"       # threads (adjust based on CPU)
    ]

    # --- Language control ---
    # Always pass -l: without it whisper defaults to English regardless of audio
    cmd.extend(["-l", language])

    # --- Translation mode ---
    if mode == "translate":
        cmd.append("-tr")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
    except subprocess.TimeoutExpired:
        return "Processing timeout"

    # --- Error handling ---
    if result.returncode != 0:
        return result.stderr or "Whisper failed"

    return clean_output(result.stdout)


def run_whisper_chunked(file_path: str, mode: str = "transcribe", language: str = "auto") -> str:
    """Split audio into 6-second chunks and concatenate whisper results."""
    chunks = split_audio(file_path, chunk_seconds=6)
    if not chunks:
        return run_whisper(file_path, mode, language)

    parts = []
    for chunk in chunks:
        text = run_whisper(chunk, mode, language)
        if text:
            parts.append(text)
        os.remove(chunk)

    return " ".join(parts)


def clean_output(output: str) -> str:
    """
    Removes logs and extracts only meaningful transcription
    """
    lines = output.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Skip logs
        if any(x in line for x in ["whisper_", "main:", "system_info"]):
            continue

        cleaned.append(line)

    return " ".join(cleaned)
