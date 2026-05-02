"""
Pull recent posts from Facebook public pages via the Graph API and feed them
through the event-extraction pipeline.

Requirements
------------
1. Create an app at https://developers.facebook.com
2. Generate a Page Access Token (needs pages_read_engagement permission).
3. Set FB_ACCESS_TOKEN and FB_PAGE_IDS in backend/.env
   FB_PAGE_IDS is a comma-separated list of numeric page IDs.

Find a page's numeric ID:
  curl "https://graph.facebook.com/v21.0/{page-slug}?access_token=TOKEN"
"""

import logging
from datetime import datetime

import httpx

from app.config import settings
from app.schemas import RawPostCreate

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.facebook.com/v21.0"

DEFAULT_PAGE_IDS = [
    "161818498592",     # Dawn News
    "113378462039498",  # Geo News
    "144894498874670",  # ARY News
]


def _configured_page_ids() -> list[str]:
    if settings.FB_PAGE_IDS:
        return [pid.strip() for pid in settings.FB_PAGE_IDS.split(",") if pid.strip()]
    return DEFAULT_PAGE_IDS


async def fetch_page_posts(page_id: str, limit: int = 10) -> list[dict]:
    if not settings.FB_ACCESS_TOKEN:
        logger.warning("FB_ACCESS_TOKEN not set — skipping Facebook ingest for page %s", page_id)
        return []

    url = f"{GRAPH_BASE}/{page_id}/feed"
    params = {
        "access_token": settings.FB_ACCESS_TOKEN,
        "fields": "id,message,created_time,from,permalink_url",
        "limit": min(limit, 100),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, params=params)
        if resp.status_code == 400:
            body = resp.json().get("error", {})
            logger.error("FB Graph error for page %s: %s", page_id, body.get("message", resp.text))
            return []
        resp.raise_for_status()
        return resp.json().get("data", [])


async def ingest_facebook_posts() -> list[RawPostCreate]:
    """Fetch from all configured pages and return RawPostCreate objects."""
    all_posts: list[RawPostCreate] = []
    seen_ids: set[str] = set()

    for page_id in _configured_page_ids():
        try:
            posts = await fetch_page_posts(page_id)
        except Exception:
            logger.exception("Facebook fetch failed for page %s", page_id)
            continue

        for p in posts:
            pid = p.get("id", "")
            if pid in seen_ids or not p.get("message"):
                continue
            seen_ids.add(pid)

            published = None
            if p.get("created_time"):
                try:
                    published = datetime.fromisoformat(
                        p["created_time"].replace("+0000", "+00:00")
                    ).replace(tzinfo=None)
                except ValueError:
                    pass

            from_data = p.get("from", {})

            all_posts.append(
                RawPostCreate(
                    source=f"fb:{pid}",
                    source_type="Facebook",
                    text=p["message"],
                    author_name=from_data.get("name"),
                    post_url=p.get("permalink_url"),
                    published_at=published,
                )
            )

    logger.info("Facebook ingest collected %d unique posts", len(all_posts))
    return all_posts
