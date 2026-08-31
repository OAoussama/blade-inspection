"""Dépendances partagées — app/api/deps.py"""

from functools import lru_cache

from app.config import settings
from app.storage.base import Storage
from app.storage.local import LocalStorage


@lru_cache(maxsize=1)
def get_storage() -> Storage:
    """Instancie le backend de stockage choisi par configuration.

    Le jour où tu ajoutes MinIO : une branche de plus ici, et
    STORAGE_BACKEND=minio dans le .env. Rien d'autre ne bouge.
    """
    if settings.storage_backend == "local":
        return LocalStorage(settings.storage_root)
    raise ValueError(f"STORAGE_BACKEND inconnu : {settings.storage_backend}")