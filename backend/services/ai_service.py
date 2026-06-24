"""
AI Service
==========
Handles all communication with the OpenRouter API.

Two entry points:
  get_ai_explanation(prompt)       – one-shot prompt for gap analysis reports
  get_chat_response(messages, ctx) – multi-turn conversation for the chatbot
"""

import json
import requests
from flask import current_app

# ── System prompt enforced for every AI call ──────────────────────────────────
_SYSTEM_PROMPT = """You are FinanceAI Assistant — a friendly, practical financial guide \
for small and medium-sized business owners in Myanmar.

Your responsibilities:
1. Analyse the financial summary provided in each message.
2. Explain risks and findings in plain, simple language.
3. Provide concrete, actionable recommendations.
4. Always use Myanmar Kyat (K) when mentioning currency amounts.
5. Structure longer answers with clear headings:
   ## Summary | ## Key Concerns | ## Recommendations | ## Disclaimer

Rules you must never break:
- Only comment on the data provided — never invent figures.
- End every response with a short disclaimer that your output is \
guidance only and does not constitute professional financial, tax, or legal advice.
- Do not recommend specific financial products, lenders, or investments.
- Keep language simple; avoid technical accounting jargon."""


# ── Internal request helper ───────────────────────────────────────────────────

def _call_openrouter(messages: list[dict], max_tokens: int = 1000) -> tuple[str | None, str | None]:
    """
    Send messages to the OpenRouter chat completions endpoint.
    Returns (response_text, error_string).
    """
    api_key: str = current_app.config.get("OPENROUTER_API_KEY", "")
    model: str = current_app.config.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")

    if not api_key or api_key == "your_openrouter_api_key_here":
        return (
            None,
            "OpenRouter API key is not configured. "
            "Please add OPENROUTER_API_KEY to your .env file "
            "(get a free key at https://openrouter.ai).",
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://financeai.local",
        "X-Title": "FinanceAI Assistant",
    }

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.35,
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        text: str = data["choices"][0]["message"]["content"]
        return text, None

    except requests.exceptions.Timeout:
        return None, "AI service request timed out. Please try again."
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else "unknown"
        return None, f"OpenRouter returned HTTP {status}. Check your API key and model name."
    except requests.exceptions.RequestException as e:
        return None, f"Network error connecting to AI service: {e}"
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        return None, f"Unexpected AI response format: {e}"


# ── Public API ────────────────────────────────────────────────────────────────

def get_ai_explanation(prompt: str) -> tuple[str | None, str | None]:
    """
    One-shot call for gap analysis explanation.
    The prompt should be the pre-built financial summary from gap_analysis_service.
    """
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                prompt
                + "\n\nBased on the financial data above, please provide a clear analysis "
                "with practical recommendations for this SME owner."
            ),
        },
    ]
    return _call_openrouter(messages, max_tokens=1000)


def get_chat_response(
    messages: list[dict],
    financial_context: str | None = None,
) -> tuple[str | None, str | None]:
    """
    Multi-turn chat call.
    `messages` is a list of {role, content} dicts (conversation history).
    `financial_context` is an optional aggregated summary prepended to the system prompt.
    """
    system_content = _SYSTEM_PROMPT
    if financial_context:
        system_content += (
            f"\n\n=== User's Current Financial Context ===\n{financial_context}"
        )

    api_messages = [{"role": "system", "content": system_content}]
    # Keep last 10 turns to stay within context limits
    api_messages.extend(messages[-10:])

    return _call_openrouter(api_messages, max_tokens=800)


def get_goal_projection(
    goal_name: str,
    target_amount: float,
    current_amount: float,
    target_date_str: str,
    monthly_savings: float,
) -> tuple[str | None, str | None]:
    """
    Get AI-generated goal projection narrative.
    """
    prompt = (
        f"Goal Name: {goal_name}\n"
        f"Target Amount: K{target_amount:,.2f}\n"
        f"Current Saved Amount: K{current_amount:,.2f}\n"
        f"Target Date: {target_date_str}\n"
        f"Current Monthly Savings Rate: K{monthly_savings:,.2f}\n\n"
        f"Please analyze this saving goal and calculate:\n"
        f"1. Months required to reach the remaining balance at their current monthly savings rate.\n"
        f"2. Whether they will reach the goal before the target date.\n"
        f"3. Specific tips to optimize expenses or increase savings to hit or exceed their target.\n"
        f"Keep the analysis concise and encouraging."
    )
    
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    return _call_openrouter(messages, max_tokens=800)
