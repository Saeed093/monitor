import logging
from dataclasses import dataclass

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from thefuzz import fuzz

from app.models import PkLocation

logger = logging.getLogger(__name__)

FUZZY_THRESHOLD = 70


@dataclass
class ResolvedLocation:
    name: str
    city: str | None
    district: str | None
    province: str | None
    latitude: float | None
    longitude: float | None
    match_type: str  # exact, alternate, fuzzy


async def resolve_location(
    db: AsyncSession,
    location_text: str | None,
    city: str | None,
    province: str | None,
) -> ResolvedLocation | None:
    """Resolve location strings against pk_locations table."""
    candidates = [s for s in [location_text, city, province] if s]
    if not candidates:
        return None

    result = await db.execute(select(PkLocation))
    all_locations = result.scalars().all()

    if not all_locations:
        return None

    # 1. Exact name match
    for search_term in candidates:
        term_lower = search_term.lower().strip()
        for loc in all_locations:
            if loc.name.lower() == term_lower:
                return _to_resolved(loc, "exact")

    # 2. Alternate names match
    for search_term in candidates:
        term_lower = search_term.lower().strip()
        for loc in all_locations:
            if loc.alternate_names:
                for alt in loc.alternate_names:
                    if alt.lower() == term_lower:
                        return _to_resolved(loc, "alternate")

    # 3. Substring containment (location_text may contain a known name)
    if location_text:
        lt_lower = location_text.lower()
        for loc in all_locations:
            if loc.name.lower() in lt_lower:
                return _to_resolved(loc, "exact")
            if loc.alternate_names:
                for alt in loc.alternate_names:
                    if alt.lower() in lt_lower:
                        return _to_resolved(loc, "alternate")

    # 4. Fuzzy match
    best_score = 0
    best_loc = None
    for search_term in candidates:
        for loc in all_locations:
            score = fuzz.token_sort_ratio(search_term.lower(), loc.name.lower())
            if loc.alternate_names:
                for alt in loc.alternate_names:
                    alt_score = fuzz.token_sort_ratio(search_term.lower(), alt.lower())
                    score = max(score, alt_score)

            # Prefer matches in the same city if city hint is provided
            if city and loc.city and loc.city.lower() == city.lower():
                score += 10

            if score > best_score:
                best_score = score
                best_loc = loc

    if best_loc and best_score >= FUZZY_THRESHOLD:
        return _to_resolved(best_loc, "fuzzy")

    logger.info("No location match found for: %s / %s / %s", location_text, city, province)
    return None


def _to_resolved(loc: PkLocation, match_type: str) -> ResolvedLocation:
    return ResolvedLocation(
        name=loc.name,
        city=loc.city,
        district=loc.district,
        province=loc.province,
        latitude=loc.latitude,
        longitude=loc.longitude,
        match_type=match_type,
    )
