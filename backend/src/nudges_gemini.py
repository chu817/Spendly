"""
Personalized behavioural nudges via Gemini API.
Input: aggregated metrics and top drivers only (no raw transactions).
Fallback: deterministic nudges when Gemini is unavailable.
"""
import json
import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

NUDGE_SCHEMA = """
Return a JSON array of 3 to 5 behavioural nudges. Each nudge must have exactly:
- "title": string, short headline
- "message": string, one or two sentences
- "why_this": string, why this nudge is suggested
- "action_step": string, one concrete action
- "confidence": number between 0 and 1

Base suggestions only on the aggregated metrics and drivers provided. Do not invent data.
"""


def _fallback_nudges(risk_band: str, top_drivers: List[str]) -> List[Dict[str, Any]]:
    """Deterministic nudges when Gemini is unavailable."""
    nudges = []
    drivers_set = set(d.lower() for d in top_drivers)
    if "burst" in str(drivers_set) or "burst buying" in " ".join(top_drivers).lower():
        nudges.append({
            "title": "Cooldown after bursts",
            "message": "You tend to make several purchases in quick succession. A short pause can help.",
            "why_this": "Your burst buying pattern suggests impulse clustering.",
            "action_step": "Wait 15–30 minutes before a second purchase in the same session.",
            "confidence": 0.85,
        })
    if "end-of-month" in str(drivers_set) or "eom" in str(drivers_set) or "surge" in " ".join(top_drivers).lower():
        nudges.append({
            "title": "End-of-month cap",
            "message": "Spending often rises in the last days of the month.",
            "why_this": "Your end-of-month surge ratio is elevated.",
            "action_step": "Set a weekly discretionary cap in the last week of the month.",
            "confidence": 0.8,
        })
    if "late-night" in str(drivers_set) or "timing" in " ".join(top_drivers).lower():
        nudges.append({
            "title": "Sleep-mode spending",
            "message": "Late-night transactions can be more impulsive.",
            "why_this": "A notable share of your transactions occur late at night.",
            "action_step": "Avoid making non-essential purchases between 22:00 and 05:00.",
            "confidence": 0.8,
        })
    if "category" in str(drivers_set) or "concentration" in str(drivers_set):
        nudges.append({
            "title": "Category budget",
            "message": "Spending is concentrated in few categories.",
            "why_this": "High category concentration can reflect habit-driven spending.",
            "action_step": "Set a monthly limit for your top 1–2 categories.",
            "confidence": 0.75,
        })
    if risk_band in ("High", "Critical"):
        nudges.append({
            "title": "Review spending patterns",
            "message": "Several impulse indicators are elevated. Small changes can help.",
            "why_this": f"Your impulse risk band is {risk_band}.",
            "action_step": "Review one behavioural driver per week and pick one action to try.",
            "confidence": 0.9,
        })
    if not nudges:
        nudges.append({
            "title": "Stay aware",
            "message": "Awareness of when and how you spend helps reduce impulse.",
            "why_this": "General best practice for spending behaviour.",
            "action_step": "Check your transaction history once a week.",
            "confidence": 0.7,
        })
    return nudges[:5]


def _parse_nudges_json(text: str) -> List[Dict[str, Any]]:
    """Extract JSON array of nudges from model output (handle markdown code blocks)."""
    text = text.strip()
    match = re.search(r"\[[\s\S]*\]", text)
    if match:
        arr = json.loads(match.group())
        if isinstance(arr, list):
            out = []
            for n in arr:
                if isinstance(n, dict) and "title" in n and "message" in n:
                    out.append({
                        "title": str(n.get("title", "")),
                        "message": str(n.get("message", "")),
                        "why_this": str(n.get("why_this", "")),
                        "action_step": str(n.get("action_step", "")),
                        "confidence": float(n.get("confidence", 0.7)),
                    })
            return out[:5]
    return []


def get_nudges(
    risk_score: float,
    risk_band: str,
    profile_label: str,
    top_drivers: List[str],
    metrics: Dict[str, Any],
    api_key: str,
) -> List[Dict[str, Any]]:
    """
    Call Gemini to generate nudges from aggregated inputs. On failure, return fallback nudges.
    """
    prompt = f"""You are a behavioural nudge assistant for spending behaviour. Do not diagnose or treat any condition.

Aggregated metrics (no raw data):
- Risk score: {risk_score} (band: {risk_band})
- Profile: {profile_label}
- Top drivers: {top_drivers}
- Metrics: {json.dumps(metrics, default=str)}

{NUDGE_SCHEMA}
Output only the JSON array, no other text."""

    if not api_key:
        return _fallback_nudges(risk_band, top_drivers)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response and response.text:
            nudges = _parse_nudges_json(response.text)
            if nudges:
                return nudges
    except Exception as e:
        logger.warning("Gemini nudge generation failed: %s", e)
    return _fallback_nudges(risk_band, top_drivers)
