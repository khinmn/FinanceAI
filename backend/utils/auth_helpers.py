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


def get_business_owner_id(user: User) -> int | None:
    """
    Resolve the User ID of the business owner.
    For personal/owner accounts, returns the user's own ID.
    For team member accounts (accountant/manager/employee),
    finds the owner of the business they belong to.
    """
    if not user:
        return None
        
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
