from fastapi import APIRouter, UploadFile, File
import uuid
import os

from app.services.whisper_service import run_whisper
from app.utils.audio import normalize_audio

router = APIRouter()   # <-- THIS LINE IS REQUIRED

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)


@router.post("/transcriptions")
async def transcribe(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())

    raw_path = f"{TEMP_DIR}/{file_id}_raw"
    processed_path = f"{TEMP_DIR}/{file_id}.wav"

    with open(raw_path, "wb") as f:
        f.write(await file.read())

    normalize_audio(raw_path, processed_path)

    text = run_whisper(processed_path)

    os.remove(raw_path)
    os.remove(processed_path)

    return {"text": text}


@router.post("/transcribe")
async def transcribe_and_translate(audio: UploadFile = File(...)):
    file_id = str(uuid.uuid4())

    raw_path = f"{TEMP_DIR}/{file_id}_raw"
    processed_path = f"{TEMP_DIR}/{file_id}.wav"

    with open(raw_path, "wb") as f:
        f.write(await audio.read())

    normalize_audio(raw_path, processed_path)

    transcript = run_whisper(processed_path, mode="transcribe", language="auto")
    translation = run_whisper(processed_path, mode="translate", language="auto")

    os.remove(raw_path)
    os.remove(processed_path)

    return {
        "transcript": transcript,
        "language": "auto",
        "translation": translation,
    }
