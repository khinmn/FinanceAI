"""
Email notification helpers for FinanceAI.

Currently used by the newsletter subscription endpoint to notify the
FinanceAI admin when a newsletter form is submitted.
"""

import os
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from flask import current_app


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def send_newsletter_subscription_notice(
    subscriber_email: str,
    already_subscribed: bool = False,
) -> tuple[bool, str | None]:
    """
    Send an email notification when the newsletter form is submitted.

    Returns:
        (True, None) when the email is sent.
        (False, reason) when SMTP settings are missing or sending fails.

    The route should not fail just because email delivery is unavailable.
    """
    notify_to = os.getenv("NEWSLETTER_NOTIFY_EMAIL", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587") or 587)
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", "").strip() or smtp_username
    use_tls = _env_bool("SMTP_USE_TLS", True)
    use_ssl = _env_bool("SMTP_USE_SSL", False)

    if not notify_to or not smtp_host or not smtp_username or not smtp_password or not smtp_from:
        return False, (
            "Newsletter email notification is not configured. Set "
            "NEWSLETTER_NOTIFY_EMAIL, SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in backend/.env."
        )

    event_label = (
        "Existing subscriber submitted the newsletter form"
        if already_subscribed
        else "New FinanceAI newsletter subscriber"
    )

    message = EmailMessage()
    message["Subject"] = event_label
    message["From"] = smtp_from
    message["To"] = notify_to
    message.set_content(
        f"{event_label}.\n\n"
        f"Subscriber email: {subscriber_email}\n"
        f"Submitted at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n"
        "This notification was sent automatically by FinanceAI."
    )

    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=20) as server:
                server.login(smtp_username, smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                server.ehlo()
                if use_tls:
                    server.starttls(context=ssl.create_default_context())
                    server.ehlo()
                server.login(smtp_username, smtp_password)
                server.send_message(message)
        return True, None
    except Exception as exc:  # Email should never block subscription success.
        current_app.logger.warning("Newsletter email notification failed: %s", exc)
        return False, str(exc)
