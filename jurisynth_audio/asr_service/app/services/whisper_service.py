import subprocess
import os

from app.utils.audio import split_audio, get_audio_duration, cleanup_chunks

MODEL_PATH = "whisper.cpp/models/ggml-small.bin"
WHISPER_BIN = "whisper.cpp/build/bin/whisper-cli"

CHUNK_SECONDS = 30

# Small model on 2 CPU cores processes ~1s of audio every ~3-5s real-time.
# Scale timeout per chunk: 6x the chunk duration, minimum 90s.
_TIMEOUT_MULTIPLIER = 6
_TIMEOUT_MIN = 90


def _chunk_timeout(chunk_seconds: int) -> int:
    return max(_TIMEOUT_MIN, chunk_seconds * _TIMEOUT_MULTIPLIER)


def run_whisper(file_path: str, mode: str = "transcribe", language: str = "auto",
                chunk_seconds: int = CHUNK_SECONDS) -> str:
    cmd = [
        WHISPER_BIN,
        "-m", MODEL_PATH,
        "-f", file_path,
        "-nt",
        "-t", "2",
        "-l", language,
    ]

    if mode == "translate":
        cmd.append("-tr")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=_chunk_timeout(chunk_seconds),
        )
    except subprocess.TimeoutExpired:
        return ""

    if result.returncode != 0:
        return ""

    return clean_output(result.stdout)


def run_whisper_chunked(file_path: str, mode: str = "transcribe", language: str = "auto") -> str:
    """
    Duration-aware batch processor:
    - Audio shorter than one chunk window → run directly, no splitting overhead.
    - Longer audio → split into CHUNK_SECONDS chunks, process each independently.
    - A failed/timed-out chunk is skipped silently so the rest still comes through.
    - Chunks are cleaned up in a finally block so temp files never leak.
    """
    duration = get_audio_duration(file_path)

    # If we can't determine duration or audio fits in one window, skip splitting.
    if 0 < duration <= CHUNK_SECONDS:
        return run_whisper(file_path, mode, language, chunk_seconds=int(duration) + 1)

    chunks = split_audio(file_path, chunk_seconds=CHUNK_SECONDS)

    # split_audio failed — fall back to processing the whole file directly
    # (whisper itself will handle it, just with a longer timeout).
    if not chunks:
        total_timeout = max(_TIMEOUT_MIN, int(duration or CHUNK_SECONDS) * _TIMEOUT_MULTIPLIER)
        return run_whisper(file_path, mode, language, chunk_seconds=int(duration or CHUNK_SECONDS))

    parts = []
    try:
        for chunk in chunks:
            text = run_whisper(chunk, mode, language, chunk_seconds=CHUNK_SECONDS)
            if text:
                parts.append(text)
    finally:
        cleanup_chunks(chunks)

    return " ".join(parts)


def clean_output(output: str) -> str:
    lines = output.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if any(x in line for x in ["whisper_", "main:", "system_info", "ggml_"]):
            continue
        cleaned.append(line)

    return " ".join(cleaned)
