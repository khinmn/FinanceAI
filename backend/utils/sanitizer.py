"""
Input Sanitizer Utility
========================
Provides HTML/XSS stripping functions for all user-supplied text
before it is stored in the database or returned in responses.

This module is separate from validators.py which handles TYPE/FORMAT checks.
"""

import re
import html


# ── Constants ──────────────────────────────────────────────────────────────────

# Tags that are unconditionally dangerous
_DANGEROUS_TAG_PATTERN = re.compile(
    r"<\s*(script|iframe|object|embed|form|link|meta|style|svg|math)"
    r"[\s>].*?</\s*\1\s*>",
    re.IGNORECASE | re.DOTALL,
)

# Any remaining HTML tags
_ALL_TAGS_PATTERN = re.compile(r"<[^>]+>", re.DOTALL)

# Dangerous URL schemes in attribute values
_DANGEROUS_SCHEMES = re.compile(
    r"(?i)\b(javascript|vbscript|data\s*:\s*text/html)\s*:",
    re.IGNORECASE,
)

# SQL injection patterns (basic detection — ORM prevents actual injection)
_SQL_PATTERNS = re.compile(
    r"(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b"
    r"|\bUNION\b|\bEXEC\b|--|;--)",
    re.IGNORECASE,
)


# ── Core Functions ─────────────────────────────────────────────────────────────

def strip_html(value: str) -> str:
    """
    Remove all HTML tags and dangerous patterns from a string.

    Steps:
    1. Remove dangerous block-level tags (script, iframe, etc.)
    2. Remove all remaining HTML tags
    3. Remove dangerous URL schemes
    4. Unescape HTML entities (so &amp; → &) then re-escape for safety

    Returns the sanitized string.
    """
    if not isinstance(value, str):
        return value

    # 1. Remove dangerous block tags
    value = _DANGEROUS_TAG_PATTERN.sub("", value)

    # 2. Remove all remaining HTML tags
    value = _ALL_TAGS_PATTERN.sub("", value)

    # 3. Strip dangerous URL schemes
    value = _DANGEROUS_SCHEMES.sub("[removed]", value)

    # 4. Decode HTML entities then strip whitespace
    value = html.unescape(value).strip()

    return value


def sanitize_text(value: str, max_length: int | None = None) -> str:
    """
    Strip HTML from a string AND optionally truncate to max_length.

    Parameters
    ----------
    value       : The raw user input string
    max_length  : Optional maximum character length after sanitization

    Returns the cleaned, truncated string.
    """
    cleaned = strip_html(value)
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned


def sanitize_dict(data: dict) -> dict:
    """
    Recursively sanitize all string values in a dict (JSON payload).

    Safe for use on request.get_json() output.
    """
    if not isinstance(data, dict):
        return data

    result = {}
    for key, val in data.items():
        if isinstance(val, str):
            result[key] = strip_html(val)
        elif isinstance(val, dict):
            result[key] = sanitize_dict(val)
        elif isinstance(val, list):
            result[key] = [
                sanitize_dict(item) if isinstance(item, dict)
                else (strip_html(item) if isinstance(item, str) else item)
                for item in val
            ]
        else:
            result[key] = val
    return result


def is_safe_string(value: str) -> bool:
    """
    Return True if the string contains no HTML tags or SQL-like patterns.
    Useful for quick sanity checks on search/filter inputs.
    """
    if _ALL_TAGS_PATTERN.search(value):
        return False
    if _SQL_PATTERNS.search(value):
        return False
    return True


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal attacks.
    Keeps only alphanumerics, dots, dashes, and underscores.
    """
    # Remove path separators
    filename = filename.replace("\\", "").replace("/", "").replace("..", "")
    # Keep only safe characters
    filename = re.sub(r"[^a-zA-Z0-9._\-]", "_", filename)
    return filename[:255]  # OS filename length limit
