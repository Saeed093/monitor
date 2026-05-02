import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from thefuzz import fuzz

from app.models import Event
from app.schemas import AIExtractionResult
from app.util_time import utc_now_naive

MERGE_WINDOW_HOURS = 6
TITLE_SIMILARITY_THRESHOLD = 60


def _source_entry(
    raw_post_id: uuid.UUID,
    source_type: str,
    raw_text: str,
    *,
    post_url: str | None = None,
    raw_source: str | None = None,
) -> dict:
    d = {
        "raw_post_id": str(raw_post_id),
        "source_type": source_type,
        "text_snippet": raw_text[:200],
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    if post_url:
        d["post_url"] = post_url
    if raw_source:
        d["raw_source"] = raw_source
    return d


async def find_or_create_event(
    db: AsyncSession,
    extraction: AIExtractionResult,
    latitude: float | None,
    longitude: float | None,
    confidence: float,
    raw_post_id: uuid.UUID,
    raw_text: str,
    source_type: str,
    post_url: str | None = None,
    raw_source: str | None = None,
) -> tuple[Event, bool]:
    """
    Find an existing event to merge into, or create a new one.
    Returns (event, is_new).
    """
    now = utc_now_naive()
    cutoff = now - timedelta(hours=MERGE_WINDOW_HOURS)

    # Search for potential duplicates
    conditions = [
        Event.event_type == extraction.event_type,
        Event.first_seen >= cutoff,
    ]
    if extraction.city:
        conditions.append(Event.city == extraction.city)

    result = await db.execute(select(Event).where(and_(*conditions)))
    candidates = result.scalars().all()

    for candidate in candidates:
        title_score = fuzz.token_sort_ratio(
            (extraction.title or "").lower(),
            (candidate.title or "").lower(),
        )
        summary_score = fuzz.token_sort_ratio(
            (extraction.summary or "").lower(),
            (candidate.summary or "").lower(),
        )
        if max(title_score, summary_score) >= TITLE_SIMILARITY_THRESHOLD:
            # Merge into existing event
            candidate.source_count = (candidate.source_count or 1) + 1
            candidate.last_seen = now

            sources = candidate.sources or []
            sources.append(
                _source_entry(
                    raw_post_id,
                    source_type,
                    raw_text,
                    post_url=post_url,
                    raw_source=raw_source,
                )
            )
            candidate.sources = sources

            # Slight confidence bump for corroboration
            candidate.confidence = min((candidate.confidence or 0) + 0.05, 1.0)
            candidate.updated_at = now

            await db.commit()
            await db.refresh(candidate)
            return candidate, False

    # Create new event
    event = Event(
        id=uuid.uuid4(),
        event_type=extraction.event_type,
        title=extraction.title,
        summary=extraction.summary,
        country=extraction.country,
        province=extraction.province,
        district=extraction.district,
        city=extraction.city,
        location_text=extraction.location_text,
        latitude=latitude,
        longitude=longitude,
        severity=extraction.severity,
        confidence=confidence,
        status=extraction.status,
        first_seen=now,
        last_seen=now,
        source_count=1,
        sources=[
            _source_entry(
                raw_post_id,
                source_type,
                raw_text,
                post_url=post_url,
                raw_source=raw_source,
            )
        ],
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event, True
