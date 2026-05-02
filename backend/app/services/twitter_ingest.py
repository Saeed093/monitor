"""
Pull recent tweets from X API v2 and feed them through the event-extraction pipeline.

Requirements
------------
1. Get a Bearer Token at https://developer.x.com  (pay-per-use — no free tier).
2. Set X_BEARER_TOKEN in backend/.env
3. Call POST /api/ingest/twitter  (or wait for the scheduled poll).
"""

import logging
from datetime import datetime

import httpx

from app.config import settings
from app.schemas import RawPostCreate

logger = logging.getLogger(__name__)

SEARCH_QUERIES = [
    "Pakistan protest OR rally -is:retweet",
    "Pakistan flood OR rain OR earthquake -is:retweet",
    "Pakistan blast OR attack OR security -is:retweet",
    "Karachi OR Lahore OR Islamabad traffic accident -is:retweet",
    "Pakistan power outage OR loadshedding -is:retweet",
]

SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"


async def fetch_recent_tweets(
    query: str,
    max_results: int = 20,
) -> tuple[list[dict], str | None]:
    """
    Returns (tweets, error_message). error_message is set on auth / permission failure.
    """
    token = settings.x_bearer_token_normalized
    if not token:
        logger.warning("X_BEARER_TOKEN not set — skipping Twitter ingest")
        return [], "X_BEARER_TOKEN is empty"

    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "query": query,
        "max_results": min(max_results, 100),
        "tweet.fields": "created_at,author_id,geo,text,source",
        "expansions": "author_id",
        "user.fields": "name,username",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(SEARCH_URL, headers=headers, params=params)
        if resp.status_code == 401:
            detail = _x_error_body(resp)
            logger.error("X API 401 — invalid or revoked Bearer token. %s", detail)
            return [], f"401 Unauthorized: {detail}"
        if resp.status_code == 403:
            detail = _x_error_body(resp)
            logger.error("X API 403 — app may lack Recent Search access. %s", detail)
            return [], f"403 Forbidden: {detail}"
        if resp.status_code == 429:
            logger.warning("X API rate limited — try again later")
            return [], "429 Rate limited"
        if resp.status_code >= 400:
            detail = _x_error_body(resp)
            logger.error("X API error %s: %s", resp.status_code, detail)
            return [], f"{resp.status_code}: {detail}"

        data = resp.json()

    tweets = data.get("data", [])
    users_list = data.get("includes", {}).get("users", [])
    users_map = {u["id"]: u for u in users_list}

    results: list[dict] = []
    for tw in tweets:
        author = users_map.get(tw.get("author_id"), {})
        results.append({
            "tweet_id": tw["id"],
            "text": tw["text"],
            "author_name": author.get("name"),
            "author_handle": author.get("username"),
            "created_at": tw.get("created_at"),
        })
    return results, None


def _x_error_body(resp: httpx.Response) -> str:
    try:
        j = resp.json()
        detail = j.get("detail") or j.get("errors") or j.get("title") or j
        return str(detail)[:500]
    except Exception:
        return (resp.text or "")[:500]


async def ingest_twitter_posts() -> tuple[list[RawPostCreate], str | None]:
    """Run all search queries; returns (posts, fatal_api_error_if_any)."""
    all_posts: list[RawPostCreate] = []
    seen_ids: set[str] = set()
    last_error: str | None = None

    for query in SEARCH_QUERIES:
        try:
            tweets, err = await fetch_recent_tweets(query)
            if err:
                last_error = err
                if err.startswith("401") or err.startswith("403"):
                    return all_posts, err
                continue
        except Exception:
            logger.exception("Twitter query failed: %s", query)
            continue

        for tw in tweets:
            tid = tw["tweet_id"]
            if tid in seen_ids:
                continue
            seen_ids.add(tid)

            published = None
            if tw.get("created_at"):
                try:
                    published = datetime.fromisoformat(
                        tw["created_at"].replace("Z", "+00:00")
                    ).replace(tzinfo=None)
                except ValueError:
                    pass

            all_posts.append(
                RawPostCreate(
                    source=f"x:{tid}",
                    source_type="X",
                    text=tw["text"],
                    author_name=tw.get("author_name"),
                    author_handle=tw.get("author_handle"),
                    post_url=f"https://x.com/i/status/{tid}",
                    published_at=published,
                )
            )

    logger.info("Twitter ingest collected %d unique posts", len(all_posts))
    if not all_posts and last_error:
        logger.warning("Twitter ingest finished with no tweets; last error: %s", last_error)
    return all_posts, last_error


async def probe_x_api_search() -> dict:
    """One lightweight request to verify Bearer token and Recent Search access."""
    tweets, err = await fetch_recent_tweets("Pakistan -is:retweet lang:en", max_results=10)
    token_set = bool(settings.x_bearer_token_normalized)
    return {
        "token_configured": token_set,
        "token_length": len(settings.x_bearer_token_normalized) if token_set else 0,
        "recent_search_ok": err is None,
        "sample_tweets_returned": len(tweets),
        "error": err,
    }
