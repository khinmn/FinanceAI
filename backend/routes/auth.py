"""
Authentication Routes  –  /api/auth
=====================================
POST  /api/auth/register        – create account + business profile + seed categories
POST  /api/auth/login           – email/password login → JWT tokens
POST  /api/auth/refresh         – exchange refresh token for new access token
GET   /api/auth/me              – get current user + business profile
PUT   /api/auth/update-profile  – update name / business details
POST  /api/auth/change-password – change password (requires current password)
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)

from models import db
from models.user import User
from models.business import Business
from models.category import Category, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES
from utils.validators import validate_email, validate_password
from utils.auth_helpers import get_current_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ── Helper ─────────────────────────────────────────────────────────────────────

def _seed_default_categories(user_id: int) -> None:
    """Create the 12 default income/expense categories for a new user."""
    for cat in DEFAULT_INCOME_CATEGORIES:
        db.session.add(
            Category(
                user_id=user_id,
                name=cat["name"],
                type="income",
                color=cat["color"],
                is_default=True,
            )
        )
    for cat in DEFAULT_EXPENSE_CATEGORIES:
        db.session.add(
            Category(
                user_id=user_id,
                name=cat["name"],
                type="expense",
                color=cat["color"],
                is_default=True,
            )
        )
    db.session.commit()


# ── Routes ─────────────────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    # Required fields
    for field in ("name", "email", "password", "business_name", "industry"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    if not validate_email(data["email"]):
        return jsonify({"error": "Invalid email format."}), 400

    valid_pw, pw_err = validate_password(data["password"])
    if not valid_pw:
        return jsonify({"error": pw_err}), 400

    if User.query.filter_by(email=data["email"].lower().strip()).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    # Create user
    user = User(
        name=data["name"].strip(),
        email=data["email"].lower().strip(),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()  # populate user.id before commit

    # Create business profile (one per user)
    business = Business(
        user_id=user.id,
        business_name=data["business_name"].strip(),
        industry=data.get("industry", "other"),
        description=data.get("description", ""),
        currency="K",
        currency_name="Myanmar Kyat",
    )
    db.session.add(business)
    db.session.commit()

    # Seed default categories
    _seed_default_categories(user.id)

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return (
        jsonify(
            {
                "message": "Registration successful. Welcome to FinanceAI!",
                "user": user.to_dict(),
                "business": business.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=data["email"].lower().strip()).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password."}), 401

    if not user.is_active:
        return jsonify({"error": "This account has been deactivated."}), 403

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify(
        {
            "message": "Login successful.",
            "user": user.to_dict(),
            "business": user.business.to_dict() if user.business else None,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    ), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(
        {
            "user": user.to_dict(),
            "business": user.business.to_dict() if user.business else None,
        }
    ), 200


@auth_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = get_current_user()
    data = request.get_json() or {}

    if data.get("name"):
        user.name = data["name"].strip()
    user.updated_at = datetime.utcnow()

    if user.business and data.get("business"):
        biz = data["business"]
        if biz.get("business_name"):
            user.business.business_name = biz["business_name"].strip()
        if biz.get("industry"):
            user.business.industry = biz["industry"]
        if "description" in biz:
            user.business.description = biz["description"]
        user.business.updated_at = datetime.utcnow()

    db.session.commit()
    return jsonify(
        {
            "message": "Profile updated successfully.",
            "user": user.to_dict(),
            "business": user.business.to_dict() if user.business else None,
        }
    ), 200


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user = get_current_user()
    data = request.get_json() or {}

    if not data.get("current_password") or not data.get("new_password"):
        return jsonify({"error": "current_password and new_password are required."}), 400

    if not user.check_password(data["current_password"]):
        return jsonify({"error": "Current password is incorrect."}), 401

    valid_pw, pw_err = validate_password(data["new_password"])
    if not valid_pw:
        return jsonify({"error": pw_err}), 400

    user.set_password(data["new_password"])
    user.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Password changed successfully."}), 200
