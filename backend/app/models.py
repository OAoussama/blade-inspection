"""Modeles SQLAlchemy 2.0 pour PostgreSQL — backend/app/models.py"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Computed,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# --------------------------------------------------------------------------
# Enumerations — types ENUM natifs PostgreSQL
#
# values_callable est obligatoire : sans lui SQLAlchemy stocke le NOM du
# membre ("QUEUED") au lieu de sa valeur ("queued"), et tes reponses JSON
# ne correspondent plus a ce qu'il y a en base.
# --------------------------------------------------------------------------
class InspectionStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DamageClass(str, enum.Enum):
    CRACK = "crack"
    EROSION = "erosion"
    LIGHTNING_STRIKE = "lightning_strike"
    DELAMINATION = "delamination"


class BladeSide(str, enum.Enum):
    LEADING_EDGE = "leading_edge"
    TRAILING_EDGE = "trailing_edge"
    SUCTION = "suction"
    PRESSURE = "pressure"


def pg_enum(python_enum: type[enum.Enum], name: str) -> Enum:
    return Enum(
        python_enum,
        name=name,
        values_callable=lambda e: [member.value for member in e],
        native_enum=True,
    )


def uuid_pk() -> Mapped[uuid.UUID]:
    # default cote Python (et non gen_random_uuid() cote serveur) : tu obtiens
    # l'id immediatement, avant le flush. Indispensable pour renvoyer un 202
    # avec l'id de l'inspection avant que le job d'inference ne demarre.
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------
# Tables
# --------------------------------------------------------------------------
class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = uuid_pk()
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), server_default="technician", nullable=False)

    inspections: Mapped[list[Inspection]] = relationship(back_populates="uploader")


class Turbine(Base, TimestampMixin):
    __tablename__ = "turbines"

    id: Mapped[uuid.UUID] = uuid_pk()
    tag: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    site_name: Mapped[str | None] = mapped_column(String(255))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    model: Mapped[str | None] = mapped_column(String(128))

    inspections: Mapped[list[Inspection]] = relationship(
        back_populates="turbine", cascade="all, delete-orphan"
    )


class Inspection(Base, TimestampMixin):
    __tablename__ = "inspections"
    __table_args__ = (
        Index("ix_inspections_turbine_created", "turbine_id", text("created_at DESC")),
        # Index partiel : n'indexe que les lignes que le worker interroge en
        # boucle. Reste minuscule meme avec des milliers d'inspections finies.
        Index(
            "ix_inspections_pending",
            "status",
            postgresql_where=text("status IN ('queued','processing')"),
        ),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    turbine_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("turbines.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    status: Mapped[InspectionStatus] = mapped_column(
        pg_enum(InspectionStatus, "inspection_status"),
        server_default=InspectionStatus.QUEUED.value,
        nullable=False,
    )
    # Version des poids YOLOv8 ayant produit ces resultats (tag ou revision
    # Hugging Face). Sans ca, impossible de savoir quel modele a detecte quoi
    # apres un re-entrainement.
    model_version: Mapped[str | None] = mapped_column(String(128))
    error_message: Mapped[str | None] = mapped_column(String(1024))

    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    turbine: Mapped[Turbine] = relationship(back_populates="inspections")
    uploader: Mapped[User | None] = relationship(back_populates="inspections")
    images: Mapped[list[Image]] = relationship(
        back_populates="inspection", cascade="all, delete-orphan"
    )
    report: Mapped[Report | None] = relationship(
        back_populates="inspection", cascade="all, delete-orphan", uselist=False
    )


class Image(Base, TimestampMixin):
    __tablename__ = "images"
    __table_args__ = (Index("ix_images_inspection", "inspection_id"),)

    id: Mapped[uuid.UUID] = uuid_pk()
    inspection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False
    )

    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(255))
    # SHA-256 du fichier : rejette les doublons, evite de recompter les memes
    # dommages et de gaspiller du GPU.
    checksum: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    blade_side: Mapped[BladeSide | None] = mapped_column(pg_enum(BladeSide, "blade_side"))
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    # JSONB et non JSON : stockage binaire, indexable, requetable.
    exif: Mapped[dict | None] = mapped_column(JSONB)

    inspection: Mapped[Inspection] = relationship(back_populates="images")
    detections: Mapped[list[Detection]] = relationship(
        back_populates="image", cascade="all, delete-orphan"
    )


class Detection(Base, TimestampMixin):
    __tablename__ = "detections"
    __table_args__ = (
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_detection_confidence"),
        CheckConstraint("bbox_x >= 0 AND bbox_x <= 1", name="ck_detection_bbox_x"),
        CheckConstraint("bbox_y >= 0 AND bbox_y <= 1", name="ck_detection_bbox_y"),
        CheckConstraint("bbox_w > 0 AND bbox_w <= 1", name="ck_detection_bbox_w"),
        CheckConstraint("bbox_h > 0 AND bbox_h <= 1", name="ck_detection_bbox_h"),
        Index("ix_detections_image", "image_id"),
        Index("ix_detections_severity_class", "severity", "damage_class"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    image_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("images.id", ondelete="CASCADE"), nullable=False
    )

    damage_class: Mapped[DamageClass] = mapped_column(
        pg_enum(DamageClass, "damage_class"), nullable=False
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Coordonnees normalisees 0-1 (format YOLO), pas des pixels : elles
    # restent valides quelle que soit la taille d'affichage cote frontend.
    bbox_x: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_y: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_w: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_h: Mapped[float] = mapped_column(Float, nullable=False)

    # Colonne generee, calculee et stockee par Postgres lui-meme : elle ne
    # peut jamais se desynchroniser des bbox, et reste indexable.
    area_ratio: Mapped[float] = mapped_column(
        Float, Computed("bbox_w * bbox_h", persisted=True)
    )

    severity: Mapped[Severity] = mapped_column(pg_enum(Severity, "severity_level"), nullable=False)

    image: Mapped[Image] = relationship(back_populates="detections")


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = uuid_pk()
    inspection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inspections.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    pdf_key: Mapped[str | None] = mapped_column(String(512))
    # Compteurs pre-agreges : {"crack": 3, "erosion": 7, "max_severity": "high"}
    summary: Mapped[dict | None] = mapped_column(JSONB)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    inspection: Mapped[Inspection] = relationship(back_populates="report")