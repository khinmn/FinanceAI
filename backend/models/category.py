from datetime import datetime
from . import db

# ── Default categories seeded for every new user ───────────────────────────────
DEFAULT_INCOME_CATEGORIES = [
    {"name": "Sales Revenue",      "color": "#10B981"},
    {"name": "Service Income",     "color": "#3B82F6"},
    {"name": "Investment Income",  "color": "#8B5CF6"},
    {"name": "Other Income",       "color": "#6B7280"},
]

DEFAULT_EXPENSE_CATEGORIES = [
    {"name": "Rent & Utilities",        "color": "#EF4444"},
    {"name": "Salaries & Wages",        "color": "#F59E0B"},
    {"name": "Supplies & Materials",    "color": "#EC4899"},
    {"name": "Marketing & Advertising", "color": "#14B8A6"},
    {"name": "Transport & Delivery",    "color": "#F97316"},
    {"name": "Equipment & Maintenance", "color": "#6366F1"},
    {"name": "Food & Beverages",        "color": "#84CC16"},
    {"name": "Other Expenses",          "color": "#9CA3AF"},
]


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(10), nullable=False)   # 'income' | 'expense'
    color = db.Column(db.String(7), default="#6B7280")  # hex colour for charts
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", back_populates="categories")
    transactions = db.relationship("Transaction", back_populates="category")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "color": self.color,
            "is_default": self.is_default,
        }
