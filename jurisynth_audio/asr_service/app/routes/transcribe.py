from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid
import os

from app.services.whisper_service import run_whisper_chunked
from app.utils.audio import normalize_audio

router = APIRouter()

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)


def _save_and_normalize(upload: UploadFile, data: bytes, file_id: str):
    raw_path = f"{TEMP_DIR}/{file_id}_raw"
    processed_path = f"{TEMP_DIR}/{file_id}.wav"

    with open(raw_path, "wb") as f:
        f.write(data)

    ok = normalize_audio(raw_path, processed_path)
    try:
        os.remove(raw_path)
    except OSError:
        pass

    if not ok:
        raise HTTPException(status_code=422, detail="Audio normalization failed")

    return processed_path


@router.post("/transcriptions")
async def transcribe(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    data = await file.read()
    processed_path = _save_and_normalize(file, data, file_id)

    try:
        text = run_whisper_chunked(processed_path, mode="transcribe")
    finally:
        try:
            os.remove(processed_path)
        except OSError:
            pass

    return {"text": text}


@router.post("/transcribe")
async def transcribe_and_translate(
    audio: UploadFile = File(...),
    language: str = Form("auto"),
    target: str = Form("en"),
):
    file_id = str(uuid.uuid4())
    data = await audio.read()
    processed_path = _save_and_normalize(audio, data, file_id)

    try:
        transcript = run_whisper_chunked(processed_path, mode="transcribe", language=language)

        translation = ""
        if target == "en" and language not in ("en", "auto"):
            # processed_path is still present — translation reads same normalized file
            translation = run_whisper_chunked(processed_path, mode="translate", language=language)
    finally:
        try:
            os.remove(processed_path)
        except OSError:
            pass

    return {
        "transcript": transcript,
        "language": language,
        "translation": translation,
    }
