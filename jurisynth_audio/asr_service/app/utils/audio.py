import subprocess
import glob


def normalize_audio(input_path: str, output_path: str):
    subprocess.run([
        "ffmpeg",
        "-y",              # overwrite if exists
        "-i", input_path,
        "-ar", "16000",    # sample rate
        "-ac", "1",        # mono channel
        output_path
    ])


def split_audio(file_path: str, chunk_seconds: int = 6) -> list:
    """Split a normalized WAV into fixed-length chunks. Returns sorted list of chunk paths."""
    chunk_pattern = file_path.replace(".wav", "_chunk_%03d.wav")
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", file_path,
            "-f", "segment",
            "-segment_time", str(chunk_seconds),
            "-c", "copy",
            chunk_pattern,
        ],
        capture_output=True,
    )
    base = file_path.replace(".wav", "_chunk_")
    return sorted(glob.glob(f"{base}*.wav"))
