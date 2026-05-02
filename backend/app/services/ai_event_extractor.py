import json
import logging
import re

import httpx

from app.config import settings
from app.schemas import AIExtractionResult

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are an event extraction engine for a Pakistan situational awareness platform.
Your job is to analyze public posts, captions, news snippets, or official alerts and decide whether they describe a real-world event in Pakistan.

You must support English, Urdu, and Roman Urdu.

Return ONLY valid JSON. Do not include markdown. Do not include explanations.

Classify into one of these event types:
- protest
- road_block
- traffic_disruption
- fire
- flood
- rain
- power_outage
- security_incident
- political_rally
- earthquake
- natural_disaster
- economic_alert
- general_alert
- not_event

Severity must be one of:
- low
- medium
- high
- critical

Status must be one of:
- unverified
- developing
- likely
- confirmed

Return JSON in this exact schema:
{
  "is_event": true,
  "event_type": "protest",
  "title": "Short event title",
  "summary": "One to two sentence summary",
  "location_text": "Detected place name or null",
  "city": "Detected city or null",
  "district": "Detected district or null",
  "province": "Detected province or null",
  "country": "Pakistan",
  "severity": "medium",
  "status": "developing",
  "confidence": 0.75,
  "language": "English/Urdu/Roman Urdu/Mixed",
  "keywords": ["keyword1", "keyword2"],
  "reason": "Short reason why this is or is not an event"
}

Rules:
1. If the text is only an opinion, joke, political argument, advertisement, or general discussion, set is_event=false and event_type="not_event".
2. If a specific real-world incident is mentioned, set is_event=true.
3. If location is unclear, keep location_text/city/province as null.
4. Confidence should be between 0 and 1.
5. Be careful with rumors. If the post sounds unverified, reduce confidence.
6. Do not invent exact coordinates.
7. Do not include personal private information.
8. Do not output anything except valid JSON.

Text to analyze:
"""


def _extract_json_from_text(text: str) -> dict | None:
    """Try to pull a JSON object from potentially messy LLM output."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find first { ... last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    return None


async def extract_event(raw_text: str) -> AIExtractionResult:
    """Send raw text to Ollama and return structured extraction."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": EXTRACTION_PROMPT + raw_text,
                    }
                ],
                "stream": False,
                "options": {
                    "temperature": 0.1,
                },
            }

            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json=payload,
            )
            resp.raise_for_status()

            data = resp.json()
            content = data.get("message", {}).get("content", "")
            logger.info("Ollama raw response: %s", content[:500])

            parsed = _extract_json_from_text(content)
            if parsed is None:
                logger.warning("Could not parse JSON from Ollama response")
                return _fallback_result(raw_text)

            return AIExtractionResult(**parsed)

    except httpx.HTTPError as exc:
        logger.error("Ollama HTTP error: %s", exc)
        return _fallback_result(raw_text)
    except Exception as exc:
        logger.error("AI extraction failed: %s", exc)
        return _fallback_result(raw_text)


def _fallback_result(raw_text: str) -> AIExtractionResult:
    """Produce a low-confidence fallback when Ollama is unavailable."""
    return AIExtractionResult(
        is_event=True,
        event_type="general_alert",
        title="Unprocessed signal",
        summary=raw_text[:200],
        confidence=0.2,
        status="unverified",
        severity="low",
        reason="AI extraction unavailable; saved as unprocessed signal",
    )
