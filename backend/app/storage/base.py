"""Interface de stockage — app/storage/base.py

Aucun service ni router ne doit savoir où sont physiquement les fichiers.
Passer à MinIO = ajouter une implémentation, changer une variable d'env.
"""

from abc import ABC, abstractmethod
from typing import BinaryIO


class Storage(ABC):
    @abstractmethod
    def save(self, key: str, data: bytes) -> None:
        """Écrit un objet sous une clé relative (inspections/<id>/<img>.jpg)."""

    @abstractmethod
    def open(self, key: str) -> BinaryIO:
        """Ouvre l'objet en lecture binaire."""

    @abstractmethod
    def delete_prefix(self, prefix: str) -> None:
        """Supprime tous les objets sous un préfixe (nettoyage d'inspection)."""

    @abstractmethod
    def url_for(self, key: str) -> str | None:
        """URL directe si le backend sait en produire, sinon None.

        En local il n'y en a pas : le frontend passe par GET /images/{id}/file.
        Avec MinIO, ce sera une URL signée à durée limitée.
        """