def compute_confidence(
    base_confidence: float,
    location_resolved: bool,
    source_type: str,
    has_source_url: bool,
    language: str | None,
) -> float:
    """Adjust the base LLM confidence score based on contextual signals."""
    score = base_confidence

    if location_resolved:
        score += 0.10
    else:
        score -= 0.15

    source_upper = (source_type or "").lower()
    if source_upper == "government":
        score += 0.10
    elif source_upper == "news":
        score += 0.08

    if has_source_url:
        score += 0.05

    if not language or language.lower() in ("unknown", "unclear", ""):
        score -= 0.10

    return min(max(score, 0.0), 1.0)
