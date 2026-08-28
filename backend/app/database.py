"""Configuration SQLAlchemy pour PostgreSQL — backend/app/database.py"""

import os
from collections.abc import Generator
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Chemin absolu vers backend/.env : le fichier est trouvé quel que soit
# le dossier depuis lequel tu lances uvicorn, alembic ou pytest.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


# Jamais de mot de passe en dur dans le code : il finirait dans Git.
# Mets la vraie valeur dans backend/.env (déjà couvert par ton .gitignore).
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    # Pas de valeur par défaut : si DATABASE_URL manque, l'application
    # refuse de démarrer avec un message explicite au lieu de se rabattre
    # en silence sur une base qui n'est pas la bonne.
    database_url: str


settings = Settings()

settings = Settings()
engine = create_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    # Vérifie la connexion avant de la réutiliser : évite les erreurs
    # "server closed the connection unexpectedly" après une inactivité.
    pool_pre_ping=True,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Classe de base declarative — c'est ce que pointe target_metadata dans Alembic."""


def get_db() -> Generator[Session, None, None]:
    """Dependance FastAPI : db: Session = Depends(get_db) dans tes endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()