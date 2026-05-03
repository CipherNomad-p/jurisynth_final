import subprocess

def normalize_audio(input_path: str, output_path: str):
    subprocess.run([
        "ffmpeg",
        "-y",              # overwrite if exists
        "-i", input_path,
        "-ar", "16000",    # sample rate
        "-ac", "1",        # mono channel
        output_path
    ])
