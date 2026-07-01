from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import db
from models.user import User
from models.team_member import TeamMember
from models.business import Business


def get_current_user() -> User | None:
    """Return the User object for the current JWT identity."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


def require_user():
    """
    Return the authenticated User, or a 401 error response tuple.

    Use in route functions *after* @require_role so the user is guaranteed
    to exist. Returns a plain User (never None), keeping Pylance happy.

    Example::

        user, err = require_user()
        if err:
            return err
    """
    user = get_current_user()
    if user is None:
        return None, (jsonify({"error": "User not found."}), 401)
    return user, None


def get_business_owner_id(user: User) -> int:
    """
    Resolve the User ID of the business owner.
    For personal/owner accounts, returns the user's own ID.
    For team member accounts (accountant/manager/employee),
    finds the owner of the business they belong to.

    Always returns an int — falls back to user.id when no business found.
    """
    if user.role in ("personal", "owner"):
        return user.id

    # Resolve from team member email
    member = TeamMember.query.filter_by(email=user.email, status="Active").first()
    if member:
        biz = db.session.get(Business, member.business_id)
        if biz:
            return biz.user_id

    # Fallback to own ID
    return user.id
