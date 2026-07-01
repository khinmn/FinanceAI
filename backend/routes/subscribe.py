"""
Newsletter Subscription Route  –  /api/subscribe
==================================================
POST /api/subscribe  – subscribe an email address (no auth required)
"""

import re
from flask import Blueprint, request, jsonify
from models import db
from models.subscriber import Subscriber
from services.email_service import send_newsletter_subscription_notice

subscribe_bp = Blueprint("subscribe", __name__, url_prefix="/api")


def _valid_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email))


@subscribe_bp.route("/subscribe", methods=["POST"])
def subscribe():
    data  = request.get_json() or {}
    email = (data.get("email") or "").lower().strip()

    if not email:
        return jsonify({"error": "Email address is required."}), 400

    if not _valid_email(email):
        return jsonify({"error": "Please enter a valid email address."}), 400

    # Existing subscribers are not inserted again, but the admin is still
    # notified so testing the newsletter form with the same email remains visible.
    existing = Subscriber.query.filter_by(email=email).first()
    if existing:
        mail_sent, mail_error = send_newsletter_subscription_notice(email, already_subscribed=True)
        return jsonify({
            "message": "You're already subscribed! Thanks.",
            "email": email,
            "mail_sent": mail_sent,
            "mail_warning": None if mail_sent else mail_error,
        }), 200

    subscriber = Subscriber(email=email)
    db.session.add(subscriber)
    db.session.commit()

    mail_sent, mail_error = send_newsletter_subscription_notice(email)

    return jsonify({
        "message": "🎉 You've been subscribed! Thanks for joining FinanceAI.",
        "email": email,
        "mail_sent": mail_sent,
        "mail_warning": None if mail_sent else mail_error,
    }), 201
