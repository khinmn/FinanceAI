from flask_jwt_extended import get_jwt_identity
from models.user import User


def get_current_user() -> User | None:
    """Return the User object for the current JWT identity."""
    user_id = get_jwt_identity()
    return User.query.get(user_id)
