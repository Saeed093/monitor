"""
Social-media ingestion endpoints.

POST /api/ingest/twitter    — pull recent tweets, run through AI pipeline
POST /api/ingest/facebook   — pull recent FB posts, run through AI pipeline
POST /api/ingest/all        — run both
"""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.raw_posts import process_raw_post
from app.services.twitter_ingest import ingest_twitter_posts, probe_x_api_search
from app.services.facebook_ingest import ingest_facebook_posts
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


async def _run_pipeline(posts, db: AsyncSession) -> list[dict]:
    results = []
    for body in posts:
        try:
            resp = await process_raw_post(body, db)
            results.append({
                "source": body.source,
                "text": body.text[:100],
                "event_created": resp.event_created,
                "event_id": str(resp.event_id) if resp.event_id else None,
            })
        except Exception:
            logger.exception("Pipeline error for %s", body.source)
            results.append({"source": body.source, "error": True})
    return results


@router.get("/twitter/status")
async def twitter_status():
    """Verify X Bearer token and Recent Search API access (does not write to DB)."""
    return await probe_x_api_search()


@router.post("/twitter")
async def ingest_twitter(db: AsyncSession = Depends(get_db)):
    if not settings.x_bearer_token_normalized:
        return {
            "status": "skipped",
            "reason": "X_BEARER_TOKEN not configured in .env",
            "help": "Get a Bearer Token at https://developer.x.com (pay-per-use). Paste raw token (with = not %3D).",
        }
    posts, api_err = await ingest_twitter_posts()
    results = await _run_pipeline(posts, db)
    out = {"source": "twitter", "posts_fetched": len(posts), "results": results}
    if api_err:
        out["x_api_error"] = api_err
    return out


@router.post("/facebook")
async def ingest_facebook(db: AsyncSession = Depends(get_db)):
    if not settings.FB_ACCESS_TOKEN:
        return {
            "status": "skipped",
            "reason": "FB_ACCESS_TOKEN not configured in .env",
            "help": "Create an app at https://developers.facebook.com and set FB_ACCESS_TOKEN + FB_PAGE_IDS.",
        }
    posts = await ingest_facebook_posts()
    results = await _run_pipeline(posts, db)
    return {"source": "facebook", "posts_fetched": len(posts), "results": results}


@router.post("/all")
async def ingest_all(db: AsyncSession = Depends(get_db)):
    tw_posts, tw_err = await ingest_twitter_posts()
    fb_posts = await ingest_facebook_posts()
    all_posts = tw_posts + fb_posts
    results = await _run_pipeline(all_posts, db)
    out = {
        "twitter_fetched": len(tw_posts),
        "facebook_fetched": len(fb_posts),
        "total_processed": len(results),
        "results": results,
    }
    if tw_err:
        out["x_api_error"] = tw_err
    return out
