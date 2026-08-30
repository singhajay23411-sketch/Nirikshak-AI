"""
Nirikshak AI — Optional LLM Adapter
=======================================
Optional server-side LLM integration for natural language
understanding and response polishing. Falls back to deterministic
processing on any failure.

NEVER:
- Exposes API keys to the frontend
- Sends complete data artifacts to the LLM
- Gives the LLM filesystem access
- Gives the LLM SQL or database tools
"""

import json
import os
import logging
from typing import Optional, Dict, Any

log = logging.getLogger("nirikshak.assistant.llm_adapter")

# ─── Configuration ───────────────────────────────────────────────────────────

ASSISTANT_MODE = os.environ.get("ASSISTANT_MODE", "deterministic")
LLM_PROVIDER = os.environ.get("ASSISTANT_LLM_PROVIDER", "")
LLM_MODEL = os.environ.get("ASSISTANT_LLM_MODEL", "")
LLM_API_KEY = os.environ.get("ASSISTANT_LLM_API_KEY", "")
LLM_TIMEOUT = int(os.environ.get("ASSISTANT_LLM_TIMEOUT", "10"))


def is_llm_enabled() -> bool:
    """Check if LLM mode is enabled and configured."""
    return (
        ASSISTANT_MODE == "llm" and
        bool(LLM_PROVIDER) and
        bool(LLM_API_KEY)
    )


def enhance_response(
    user_question: str,
    intent: str,
    evidence_package: Dict[str, Any],
    deterministic_answer: str,
    glossary_context: Optional[str] = None,
) -> Optional[str]:
    """
    Optionally enhance a response using an LLM.
    
    Sends ONLY:
    - User question
    - Approved intent
    - Small evidence package
    - Glossary entries
    
    Returns enhanced answer or None (triggers deterministic fallback).
    """
    if not is_llm_enabled():
        return None

    try:
        # Build constrained prompt
        system_prompt = _build_system_prompt()
        user_prompt = _build_user_prompt(
            user_question, intent, evidence_package,
            deterministic_answer, glossary_context,
        )

        # Route to provider
        if LLM_PROVIDER == "openai":
            result = _call_openai(system_prompt, user_prompt)
        elif LLM_PROVIDER == "google":
            result = _call_google(system_prompt, user_prompt)
        else:
            log.warning(f"Unknown LLM provider: {LLM_PROVIDER}")
            return None

        if result:
            # Validate: response must not introduce facts not in evidence
            validated = _validate_response(result, evidence_package)
            return validated

    except Exception as e:
        log.warning(f"LLM adapter error (falling back to deterministic): {e}")

    return None


def _build_system_prompt() -> str:
    return (
        "You are the Nirikshak AI assistant, a decision-support system for MPLADS monitoring. "
        "You must ONLY use the evidence provided to compose your answer. "
        "Never introduce facts, numbers, names, scores, or conclusions that are not "
        "in the evidence package. Use responsible language: say 'anomaly detected', "
        "'candidate duplicate', 'requires verification' — never say 'fraud confirmed', "
        "'corrupt contractor', or 'proven duplicate'. "
        "Respond in clear, concise English. Include a human-verification disclaimer."
    )


def _build_user_prompt(
    question: str,
    intent: str,
    evidence: Dict[str, Any],
    deterministic: str,
    glossary: Optional[str],
) -> str:
    parts = [
        f"User question: {question}",
        f"Detected intent: {intent}",
        f"Evidence package:\n{json.dumps(evidence, indent=2, default=str)[:3000]}",
        f"Deterministic answer (baseline):\n{deterministic[:1500]}",
    ]
    if glossary:
        parts.append(f"Relevant glossary:\n{glossary[:500]}")
    return "\n\n".join(parts)


def _validate_response(response: str, evidence: Dict[str, Any]) -> Optional[str]:
    """Basic validation that the response doesn't introduce hallucinated content."""
    # Reject if response is too short or too long
    if len(response) < 20 or len(response) > 5000:
        return None
    # Reject if it contains forbidden terms
    forbidden = ["fraud confirmed", "proven guilty", "convicted", "definitely corrupt",
                  "cartel confirmed", "absolutely certain"]
    for term in forbidden:
        if term.lower() in response.lower():
            log.warning(f"LLM response contained forbidden term: {term}")
            return None
    return response


def _call_openai(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Call OpenAI-compatible API. Not imported unless enabled."""
    try:
        import httpx
        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": LLM_MODEL or "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 1000,
                "temperature": 0.3,
            },
            timeout=LLM_TIMEOUT,
        )
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        log.warning(f"OpenAI API error: {e}")
    return None


def _call_google(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Call Google AI API. Not imported unless enabled."""
    try:
        import httpx
        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{LLM_MODEL or 'gemini-2.0-flash'}:generateContent",
            params={"key": LLM_API_KEY},
            json={
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": 1000,
                    "temperature": 0.3,
                },
            },
            timeout=LLM_TIMEOUT,
        )
        if response.status_code == 200:
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        log.warning(f"Google AI API error: {e}")
    return None
