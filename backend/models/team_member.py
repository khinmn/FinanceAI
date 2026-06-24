from datetime import datetime
from . import db


class TeamMember(db.Model):
    __tablename__ = "team_members"

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(
        db.Integer, db.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False
    )
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # 'Owner', 'Accountant', 'Manager', 'Employee'
    status = db.Column(db.String(20), nullable=False, default="Active")  # 'Active', 'Pending'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    business = db.relationship(
        "Business", backref=db.backref("team_members", lazy=True, cascade="all, delete-orphan")
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "business_id": self.business_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
