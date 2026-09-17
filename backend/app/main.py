"""Point d'entrée — app/main.py"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, images, inspections
from app.config import settings

# app = FastAPI(title="Blade Inspection API", version="0.1.0")

from contextlib import asynccontextmanager
from app.services import inference


@asynccontextmanager
async def lifespan(app: FastAPI):
    inference.warmup()
    yield


app = FastAPI(title="Blade Inspection API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(inspections.router)
app.include_router(images.router)