"""
Newsletter Subscription Route  –  /api/subscribe
==================================================
POST /api/subscribe  – subscribe an email address (no auth required)
"""

import re
from flask import Blueprint, request, jsonify
from models import db
from models.subscriber import Subscriber

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

    # Check for duplicate
    existing = Subscriber.query.filter_by(email=email).first()
    if existing:
        return jsonify({"message": "You're already subscribed! Thanks."}), 200

    subscriber = Subscriber(email=email)
    db.session.add(subscriber)
    db.session.commit()

    return jsonify({
        "message": "🎉 You've been subscribed! Thanks for joining FinanceAI.",
        "email": email,
    }), 201
