from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.process import router as process_router
from app.routes.transcribe import router as transcribe_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process_router, prefix="/v1/audio")
app.include_router(transcribe_router)
