from datetime import datetime
from . import db


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("budgets", lazy=True))
    category = db.relationship("Category", backref=db.backref("budgets", lazy=True))

    def __init__(
        self,
        user_id: int,
        category_id: "int | None",
        name: str,
        amount: float,
        month: int,
        year: int,
    ) -> None:
        self.user_id = user_id
        self.category_id = category_id
        self.name = name
        self.amount = amount  # type: ignore[assignment]
        self.month = month
        self.year = year

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "name": self.name,
            "amount": float(self.amount),
            "month": self.month,
            "year": self.year,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
