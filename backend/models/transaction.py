from datetime import datetime
from . import db


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    type = db.Column(db.String(10), nullable=False)          # 'income' | 'expense'
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False)
    payment_method = db.Column(db.String(20), default="cash")
    # cash | bank | card | mobile | other
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = db.relationship("User", back_populates="transactions")
    category = db.relationship("Category", back_populates="transactions")

    def to_dict(self) -> dict:
        updated = self.updated_at or self.created_at
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "Uncategorized",
            "category_color": self.category.color if self.category else "#6B7280",
            "type": self.type,
            "amount": float(self.amount),
            "description": self.description,
            "date": self.date.isoformat(),
            "payment_method": self.payment_method,
            "note": self.note,
            "created_at": self.created_at.isoformat(),
            "updated_at": updated.isoformat() if updated else None,
        }
