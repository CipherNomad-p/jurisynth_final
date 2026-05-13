import subprocess
import glob


def get_audio_duration(file_path: str) -> float:
    """Return duration in seconds via ffprobe, or -1.0 on failure."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path,
        ],
        capture_output=True,
        text=True,
    )
    try:
        return float(result.stdout.strip())
    except (ValueError, AttributeError):
        return -1.0


def normalize_audio(input_path: str, output_path: str) -> bool:
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", input_path,
            "-ar", "16000",
            "-ac", "1",
            "-sample_fmt", "s16",
            output_path,
        ],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def split_audio(file_path: str, chunk_seconds: int = 30) -> list:
    """Split a normalized WAV into fixed-length chunks.
    Re-encodes each segment so chunk headers are valid WAV."""
    chunk_pattern = file_path.replace(".wav", "_chunk_%03d.wav")
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", file_path,
            "-f", "segment",
            "-segment_time", str(chunk_seconds),
            "-ar", "16000",
            "-ac", "1",
            "-sample_fmt", "s16",
            chunk_pattern,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return []
    base = file_path.replace(".wav", "_chunk_")
    return sorted(glob.glob(f"{base}*.wav"))


def cleanup_chunks(chunks: list):
    for path in chunks:
        try:
            if path and __import__("os").path.exists(path):
                __import__("os").remove(path)
        except OSError:
            pass
