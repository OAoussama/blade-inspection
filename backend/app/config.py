"""Configuration centralisée — app/config.py"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # Pas de valeur par défaut : l'application refuse de démarrer si elle manque.
    database_url: str

    cors_origins: list[str] = ["http://localhost:3000"]

    # local | minio — c'est cette variable qui choisira l'implémentation.
    storage_backend: str = "local"
    storage_root: Path = BACKEND_DIR / "storage"

    max_upload_bytes: int = 20 * 1024 * 1024
    max_images_per_inspection: int = 50

    # Modèle de détection
    model_repo: str = "OAoussama/yolo8v"
    model_revision: str = "v2"     # tag Hugging Face, jamais "main"
    model_imgsz: int = 1024        # doit correspondre à l'entraînement
    model_conf: float = 0.4        # au-dessus du défaut 0.25


settings = Settings()