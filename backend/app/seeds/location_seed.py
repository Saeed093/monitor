"""Geocode reference rows for Pakistan location resolution (not sample events)."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PkLocation
from app.seeds.pk_locations import PK_LOCATIONS

logger = logging.getLogger(__name__)


async def seed_locations(db: AsyncSession) -> int:
    """Insert pk_locations if table is empty. Returns count inserted."""
    result = await db.execute(select(PkLocation).limit(1))
    if result.scalar_one_or_none() is not None:
        return 0

    count = 0
    for loc_data in PK_LOCATIONS:
        loc = PkLocation(**loc_data)
        db.add(loc)
        count += 1

    await db.commit()
    logger.info("Seeded %d Pakistan reference locations", count)
    return count
