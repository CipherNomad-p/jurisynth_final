from fastapi import APIRouter, UploadFile, File, Form
import uuid
import os

from app.services.whisper_service import run_whisper
from app.utils.audio import normalize_audio

router = APIRouter()

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)


@router.post("/process")
async def process_audio(
    file: UploadFile = File(...),
    mode: str = Form("transcribe"),
    language: str = Form("auto")
):
    file_id = str(uuid.uuid4())

    raw_path = f"{TEMP_DIR}/{file_id}_raw"
    processed_path = f"{TEMP_DIR}/{file_id}.wav"

    contents = await file.read()

    with open(raw_path, "wb") as f:
        f.write(contents)

    normalize_audio(raw_path, processed_path)

    text = run_whisper(processed_path, mode, language)

    os.remove(raw_path)
    os.remove(processed_path)

    return {"text": text}
