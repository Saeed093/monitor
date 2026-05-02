from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Raw Post ──────────────────────────────────────────────────────────────────

class RawPostCreate(BaseModel):
    source: str = "manual"
    source_type: str = "Manual"
    text: str
    author_name: Optional[str] = None
    author_handle: Optional[str] = None
    post_url: Optional[str] = None
    published_at: Optional[datetime] = None
    media_urls: list[str] = Field(default_factory=list)
    city: Optional[str] = None
    province: Optional[str] = None


class RawPostOut(BaseModel):
    id: UUID
    source: str
    source_type: str
    source_post_id: Optional[str] = None
    author_name: Optional[str] = None
    author_handle: Optional[str] = None
    text: str
    media_urls: Optional[list[str]] = None
    post_url: Optional[str] = None
    published_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Event ─────────────────────────────────────────────────────────────────────

class EventOut(BaseModel):
    id: UUID
    event_type: str
    title: str
    summary: Optional[str] = None
    country: Optional[str] = "Pakistan"
    province: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = "developing"
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    source_count: int = 1
    sources: Optional[Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Process response ──────────────────────────────────────────────────────────

class ProcessResponse(BaseModel):
    raw_post_id: UUID
    event_created: bool
    event_id: Optional[UUID] = None
    event: Optional[EventOut] = None


# ── AI Extraction result (internal) ──────────────────────────────────────────

class AIExtractionResult(BaseModel):
    is_event: bool = False
    event_type: str = "not_event"
    title: str = ""
    summary: str = ""
    location_text: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    country: str = "Pakistan"
    severity: str = "low"
    status: str = "developing"
    confidence: float = 0.5
    language: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)
    reason: str = ""


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
