"""
Input Validators
================
Validation helpers for all API endpoints.
Each function returns a tuple: (valid_value_or_None, error_message_or_None)

OWASP A03 - Injection: Validates types, ranges, and formats before use.
"""

import re
from datetime import datetime


# ── Existing validators ────────────────────────────────────────────────────────

def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str | None]:
    """
    Returns (True, None) if valid.
    Returns (False, error_message) if invalid.
    Rules: min 8 chars, at least one letter, at least one digit.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number."
    return True, None


def validate_transaction_type(t: str) -> bool:
    return t in ("income", "expense")


def validate_payment_method(m: str) -> bool:
    return m in ("cash", "bank", "card", "mobile", "other")


def validate_date(date_str: str) -> tuple:
    """Parse YYYY-MM-DD string. Returns (date_obj, None) or (None, error_str)."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date(), None
    except ValueError:
        return None, "Invalid date format. Use YYYY-MM-DD."


# ── Enhanced validators for OWASP compliance ───────────────────────────────────

def validate_amount(value) -> tuple[float | None, str | None]:
    """
    Validate a monetary amount.
    Must be a positive number and not exceed 10 billion (reasonable SME upper bound).
    Returns (float_amount, None) or (None, error_str).
    """
    try:
        amount = float(value)
    except (ValueError, TypeError):
        return None, "amount must be a valid number."
    if amount <= 0:
        return None, "amount must be greater than zero."
    if amount > 10_000_000_000:
        return None, "amount exceeds the maximum allowed value (10,000,000,000)."
    return amount, None


def validate_string(value, field_name: str = "field", max_length: int = 500) -> tuple[str | None, str | None]:
    """
    Validate a non-empty string within a length limit.
    Returns (stripped_str, None) or (None, error_str).
    """
    if not isinstance(value, str):
        return None, f"{field_name} must be a string."
    stripped = value.strip()
    if not stripped:
        return None, f"{field_name} cannot be empty."
    if len(stripped) > max_length:
        return None, f"{field_name} must not exceed {max_length} characters."
    return stripped, None


def validate_month_year(month, year) -> tuple[bool, str | None]:
    """
    Validate integer month (1-12) and year (2000-2100).
    Returns (True, None) or (False, error_str).
    """
    try:
        m = int(month)
        y = int(year)
    except (ValueError, TypeError):
        return False, "month and year must be integers."
    if not (1 <= m <= 12):
        return False, "month must be between 1 and 12."
    if not (2000 <= y <= 2100):
        return False, "year must be between 2000 and 2100."
    return True, None


def validate_pagination(page, per_page, max_per_page: int = 100) -> tuple[int, int]:
    """
    Coerce and clamp pagination parameters to safe values.
    Returns (safe_page, safe_per_page).
    """
    try:
        page = max(1, int(page))
    except (ValueError, TypeError):
        page = 1
    try:
        per_page = max(1, min(int(per_page), max_per_page))
    except (ValueError, TypeError):
        per_page = 20
    return page, per_page


def validate_goal_name(name: str) -> tuple[str | None, str | None]:
    """
    Validate a savings goal name: non-empty, max 200 characters.
    """
    return validate_string(name, field_name="name", max_length=200)


def validate_positive_amount(value, field_name: str = "amount") -> tuple[float | None, str | None]:
    """
    Validate a non-negative numeric value (allows zero, unlike validate_amount).
    Used for current_amount and similar fields.
    Returns (float_value, None) or (None, error_str).
    """
    try:
        amount = float(value)
    except (ValueError, TypeError):
        return None, f"{field_name} must be a valid number."
    if amount < 0:
        return None, f"{field_name} must be zero or greater."
    if amount > 10_000_000_000:
        return None, f"{field_name} exceeds the maximum allowed value."
    return amount, None
