"""Stockage sur disque — app/storage/local.py"""

import shutil
from pathlib import Path
from typing import BinaryIO

from app.storage.base import Storage


class LocalStorage(Storage):
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        # Un client peut poster une clé contenant "..". Sans cette vérification,
        # il écrirait n'importe où sur le disque : c'est la faille classique
        # des endpoints d'upload.
        candidate = (self.root / key).resolve()
        if not candidate.is_relative_to(self.root):
            raise ValueError(f"Cle de stockage invalide : {key}")
        return candidate

    def save(self, key: str, data: bytes) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        # Écriture puis renommage : un fichier n'apparaît jamais à moitié écrit.
        tmp = path.with_suffix(path.suffix + ".part")
        tmp.write_bytes(data)
        tmp.replace(path)

    def open(self, key: str) -> BinaryIO:
        return self._path(key).open("rb")

    def delete_prefix(self, prefix: str) -> None:
        target = self._path(prefix)
        if target.is_dir():
            shutil.rmtree(target, ignore_errors=True)
        elif target.exists():
            target.unlink()

    def url_for(self, key: str) -> str | None:
        return None