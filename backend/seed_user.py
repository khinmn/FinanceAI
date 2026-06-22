"""
One-time script: creates a demo user in the FinanceAI database.
Run from the project root with the venv active:
    .venv\Scripts\python.exe backend\seed_user.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app import create_app
from models import db
from models.user import User

EMAIL    = "admin@financeai.com"
PASSWORD = "Finance@2024"
NAME     = "Admin User"

app = create_app()

with app.app_context():
    existing = User.query.filter_by(email=EMAIL).first()
    if existing:
        print(f"[INFO] User '{EMAIL}' already exists. Skipping.")
    else:
        user = User(email=EMAIL, name=NAME, is_active=True)
        user.set_password(PASSWORD)
        db.session.add(user)
        db.session.commit()
        print(f"[OK] User created successfully!")
        print(f"     Email   : {EMAIL}")
        print(f"     Password: {PASSWORD}")
        print(f"     Name    : {NAME}")
