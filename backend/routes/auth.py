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
from models.user import User, VALID_ROLES
from models.business import Business
from models.team_member import TeamMember
from models.category import Category, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES
from utils.validators import validate_email, validate_password
from utils.auth_helpers import get_current_user
from middleware.auth_middleware import require_role, ROLE_OWNER

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ── Helpers ─────────────────────────────────────────────────────────────────────

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


def _get_user_business(user: User) -> dict | None:
    """Resolve business profile for a user (either owned or joined via TeamMember)."""
    if not user:
        return None
    if user.business:
        return user.business.to_dict()
        
    # Check if team member
    member = TeamMember.query.filter_by(email=user.email, status="Active").first()
    if member:
        biz = Business.query.get(member.business_id)
        if biz:
            return biz.to_dict()
            
    return None


# ── Routes ─────────────────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    # Email and password check are always required
    for field in ("name", "email", "password"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    email_clean = data["email"].lower().strip()

    if not validate_email(email_clean):
        return jsonify({"error": "Invalid email format."}), 400

    valid_pw, pw_err = validate_password(data["password"])
    if not valid_pw:
        return jsonify({"error": pw_err}), 400

    if User.query.filter_by(email=email_clean).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    # Check if this email is invited as a TeamMember
    invited_member = TeamMember.query.filter_by(email=email_clean).first()
    
    if invited_member:
        # User is invited as team member
        # Role is forced to the invited role (lowercased)
        user_role = invited_member.role.lower().strip()
        if user_role not in VALID_ROLES:
            user_role = "employee"
            
        user = User(
            name=data["name"].strip(),
            email=email_clean,
            role=user_role,
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.flush()

        # Update invitation status
        invited_member.status = "Active"
        db.session.commit()

        # Seed categories or other features not required, they share owner's categories
        business_dict = _get_user_business(user)
    else:
        # Regular registration: create new business workspace
        for field in ("business_name", "industry"):
            if not data.get(field):
                return jsonify({"error": f"Missing required field for business registration: {field}"}), 400

        # Validate requested role
        requested_role = data.get("role", "owner").lower().strip()
        if requested_role not in VALID_ROLES or requested_role in ("accountant", "manager", "employee"):
            requested_role = "owner"

        user = User(
            name=data["name"].strip(),
            email=email_clean,
            role=requested_role,
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.flush()

        # Create business profile
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
        business_dict = business.to_dict()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return (
        jsonify(
            {
                "message": "Registration successful. Welcome to FinanceAI!",
                "user": user.to_dict(),
                "business": business_dict,
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
            "business": _get_user_business(user),
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
            "business": _get_user_business(user),
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

    # Update business profile if user is the business owner
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
            "business": _get_user_business(user),
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
