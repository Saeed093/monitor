import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import RawPost
from app.schemas import EventOut, ProcessResponse, RawPostCreate, RawPostOut
from app.services.ai_event_extractor import extract_event
from app.services.confidence import compute_confidence
from app.services.event_merger import find_or_create_event
from app.services.location_resolver import resolve_location
from app.util_time import utc_now_naive

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/raw-posts", tags=["raw_posts"])


async def process_raw_post(body: RawPostCreate, db: AsyncSession) -> ProcessResponse:
    """Full pipeline: save raw post -> AI extract -> resolve location -> score -> merge/create."""
    # 1. Save raw post
    raw_post = RawPost(
        id=uuid.uuid4(),
        source=body.source,
        source_type=body.source_type,
        author_name=body.author_name,
        author_handle=body.author_handle,
        text=body.text,
        media_urls=body.media_urls or [],
        post_url=body.post_url,
        published_at=body.published_at,
        collected_at=utc_now_naive(),
    )
    db.add(raw_post)
    await db.commit()
    await db.refresh(raw_post)

    # 2. AI extraction
    extraction = await extract_event(body.text)

    if not extraction.is_event:
        return ProcessResponse(
            raw_post_id=raw_post.id,
            event_created=False,
            event_id=None,
            event=None,
        )

    # Override city/province from form if AI didn't detect them
    if body.city and not extraction.city:
        extraction.city = body.city
    if body.province and not extraction.province:
        extraction.province = body.province

    # 3. Location resolution
    resolved = await resolve_location(
        db,
        extraction.location_text,
        extraction.city,
        extraction.province,
    )

    latitude = resolved.latitude if resolved else None
    longitude = resolved.longitude if resolved else None

    # Fill in location details from resolved match
    if resolved:
        if not extraction.city:
            extraction.city = resolved.city
        if not extraction.province:
            extraction.province = resolved.province
        if not extraction.district:
            extraction.district = resolved.district

    # 4. Confidence scoring
    confidence = compute_confidence(
        base_confidence=extraction.confidence,
        location_resolved=resolved is not None,
        source_type=body.source_type,
        has_source_url=bool(body.post_url),
        language=extraction.language,
    )

    # 5. Merge or create event
    event, is_new = await find_or_create_event(
        db=db,
        extraction=extraction,
        latitude=latitude,
        longitude=longitude,
        confidence=confidence,
        raw_post_id=raw_post.id,
        raw_text=body.text,
        source_type=body.source_type,
        post_url=body.post_url,
        raw_source=body.source,
    )

    return ProcessResponse(
        raw_post_id=raw_post.id,
        event_created=is_new,
        event_id=event.id,
        event=EventOut.model_validate(event),
    )


@router.post("/process", response_model=ProcessResponse)
async def create_and_process(body: RawPostCreate, db: AsyncSession = Depends(get_db)):
    return await process_raw_post(body, db)


@router.get("", response_model=list[RawPostOut])
async def list_raw_posts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RawPost).order_by(RawPost.collected_at.desc()))
    return result.scalars().all()
