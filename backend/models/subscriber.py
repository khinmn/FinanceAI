"""
Subscriber model — stores newsletter email subscriptions.
"""

from datetime import datetime
from models import db


class Subscriber(db.Model):
    __tablename__ = "subscribers"

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id":            self.id,
            "email":         self.email,
            "subscribed_at": self.subscribed_at.isoformat(),
        }
