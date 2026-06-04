import re
from datetime import datetime


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
