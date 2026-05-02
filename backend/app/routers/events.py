import uuid
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Event
from app.schemas import EventOut
from app.util_time import utc_cutoff_naive

router = APIRouter(prefix="/api/events", tags=["events"])

TIME_RANGE_MAP = {
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
}


@router.get("", response_model=list[EventOut])
async def list_events(
    event_type: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None, ge=0, le=1),
    time_range: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    conditions = []

    if event_type:
        conditions.append(Event.event_type == event_type)
    if province:
        conditions.append(Event.province == province)
    if city:
        conditions.append(Event.city == city)
    if min_confidence is not None:
        conditions.append(Event.confidence >= min_confidence)
    if severity:
        conditions.append(Event.severity == severity)
    if status:
        conditions.append(Event.status == status)
    if time_range and time_range in TIME_RANGE_MAP:
        cutoff = utc_cutoff_naive(TIME_RANGE_MAP[time_range])
        conditions.append(Event.first_seen >= cutoff)

    query = select(Event)
    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(Event.last_seen.desc())

    result = await db.execute(query)
    events = result.scalars().all()

    if search:
        term = search.lower()
        events = [
            e
            for e in events
            if term in (e.title or "").lower() or term in (e.summary or "").lower()
        ]

    return events


@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
