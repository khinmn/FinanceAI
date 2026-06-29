"""
RBAC & Security Middleware
===========================
Provides decorators and helpers for:

  - require_auth()             – enforce JWT authentication only (any role)
  - require_role(*roles)       – enforce JWT + role-based access control
  - ownership_required(model)  – ensure the resource belongs to the current user
  - rate_limit_response()      – standard 429 response helper
  - sanitize_request_json()    – strip XSS from all incoming string fields

Role hierarchy (lowest → highest privilege):
  employee < manager < accountant < personal < owner

Usage examples in routes:
  @require_auth()
  @require_role("owner")
  @require_role("owner", "accountant")
"""

import re
from functools import wraps
from typing import Type

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.user import User
from models import db

# Canonical role constants — use these everywhere, never raw strings
ROLE_PERSONAL  = "personal"
ROLE_OWNER     = "owner"
ROLE_ACCOUNTANT = "accountant"
ROLE_MANAGER   = "manager"
ROLE_EMPLOYEE  = "employee"

# All valid roles
ALL_ROLES = (ROLE_PERSONAL, ROLE_OWNER, ROLE_ACCOUNTANT, ROLE_MANAGER, ROLE_EMPLOYEE)

# Roles that can manage their own business (full-access users)
BUSINESS_ADMIN_ROLES = (ROLE_OWNER,)

# Roles that can perform read-heavy financial review
FINANCE_REVIEWER_ROLES = (ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT)

# Roles with at least manager-level access
MANAGER_AND_ABOVE = (ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER)

# Roles that can create/add transactions
TRANSACTION_CREATE_ROLES = (ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER, ROLE_EMPLOYEE)

# Roles that can see dashboards and reports
DASHBOARD_ROLES = (ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_user_from_token() -> User | None:
    """Resolve the User object from the current JWT identity."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


def _strip_html(value: str) -> str:
    """Remove HTML/script tags from a string (XSS prevention)."""
    # Remove all HTML tags
    clean = re.sub(r"<[^>]+>", "", value)
    # Remove common injection patterns
    clean = re.sub(r"(?i)(javascript:|vbscript:|data:text/html)", "", clean)
    return clean.strip()


# ── Auth-Only Decorator ────────────────────────────────────────────────────────

def require_auth():
    """
    Decorator that enforces JWT authentication — any valid role is accepted.
    Use this for routes that all authenticated users can access.

    Example::

        @app.route("/api/profile")
        @require_auth()
        def profile():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = _get_user_from_token()
            if not user:
                return jsonify({"error": "User not found."}), 404
            if not user.is_active:
                return jsonify({"error": "Account is deactivated."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ── RBAC Decorator ─────────────────────────────────────────────────────────────

def require_role(*roles: str):
    """
    Decorator that enforces JWT authentication AND role-based access control.

    The authenticated user's ``role`` field must be in the allowed ``roles`` tuple.

    Example::

        @app.route("/admin/users")
        @require_role("owner")
        def admin_users():
            ...

        @app.route("/api/reports")
        @require_role("owner", "accountant", "personal")
        def reports():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = _get_user_from_token()
            if not user:
                return jsonify({"error": "User not found."}), 404

            if not user.is_active:
                return jsonify({"error": "Account is deactivated."}), 403

            # Only enforce role restriction if roles are specified
            if roles and user.role not in roles:
                return jsonify({
                    "error": "Access denied. Insufficient permissions.",
                    "required_roles": list(roles),
                    "your_role": user.role,
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ── Ownership Guard ────────────────────────────────────────────────────────────

def ownership_required(model: Type, id_param: str = "id"):
    """
    Decorator factory that verifies a database resource belongs to the
    currently authenticated user before allowing access.

    The model must have a ``user_id`` column.

    Parameters
    ----------
    model       : SQLAlchemy model class (e.g. Transaction, Budget)
    id_param    : Name of the URL parameter containing the resource ID
                  (default: "id")

    Example::

        @app.route("/api/transactions/<int:tx_id>")
        @jwt_required()
        @ownership_required(Transaction, id_param="tx_id")
        def get_tx(tx_id):
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            if not user_id:
                return jsonify({"error": "Authentication required."}), 401

            resource_id = kwargs.get(id_param)
            if resource_id is None:
                return jsonify({"error": f"Resource ID '{id_param}' not found in URL."}), 400

            resource = db.session.get(model, resource_id)
            if not resource:
                return jsonify({"error": "Resource not found."}), 404

            if str(resource.user_id) != str(user_id):
                return jsonify({"error": "Access denied. This resource does not belong to you."}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ── Input Sanitization ─────────────────────────────────────────────────────────

def sanitize_json(data: dict) -> dict:
    """
    Recursively strip HTML tags from all string values in a JSON dict.
    Protects against stored XSS.

    Usage::

        data = sanitize_json(request.get_json() or {})
    """
    if not isinstance(data, dict):
        return data

    cleaned = {}
    for key, value in data.items():
        if isinstance(value, str):
            cleaned[key] = _strip_html(value)
        elif isinstance(value, dict):
            cleaned[key] = sanitize_json(value)
        elif isinstance(value, list):
            cleaned[key] = [
                sanitize_json(item) if isinstance(item, dict)
                else (_strip_html(item) if isinstance(item, str) else item)
                for item in value
            ]
        else:
            cleaned[key] = value
    return cleaned


# ── Active Account Guard ───────────────────────────────────────────────────────

def active_required(fn):
    """
    Decorator that ensures the authenticated user's account is active.
    Must be used after @jwt_required().

    Example::

        @app.route("/api/protected")
        @jwt_required()
        @active_required
        def protected():
            ...
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _get_user_from_token()
        if not user:
            return jsonify({"error": "User not found."}), 404
        if not user.is_active:
            return jsonify({"error": "Account is deactivated. Contact support."}), 403
        return fn(*args, **kwargs)
    return wrapper
