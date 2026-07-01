from datetime import datetime
from . import db

INDUSTRY_CHOICES = [
    "retail",
    "food_beverage",
    "services",
    "manufacturing",
    "technology",
    "healthcare",
    "education",
    "agriculture",
    "construction",
    "transport",
    "other",
]


class Business(db.Model):
    __tablename__ = "businesses"

    id = db.Column(db.Integer, primary_key=True)
    # One user → one business (unique FK)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False
    )
    business_name = db.Column(db.String(200), nullable=False)
    industry = db.Column(db.String(50), nullable=False, default="other")
    description = db.Column(db.Text, nullable=True)
    currency = db.Column(db.String(10), default="K")
    currency_name = db.Column(db.String(50), default="Myanmar Kyat")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = db.relationship("User", back_populates="business")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "business_name": self.business_name,
            "industry": self.industry,
            "description": self.description,
            "currency": self.currency,
            "currency_name": self.currency_name,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
