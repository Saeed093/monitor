"""UTC timestamps as naive datetimes for TIMESTAMP WITHOUT TIME ZONE columns (asyncpg-compatible)."""

from datetime import datetime, timedelta, timezone


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def utc_cutoff_naive(delta: timedelta) -> datetime:
    return (datetime.now(timezone.utc) - delta).replace(tzinfo=None)
