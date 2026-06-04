"""
Reports Routes  –  /api/reports
==================================
GET /api/reports/monthly            – full monthly income/expense breakdown
GET /api/reports/cashflow           – N-month cash-flow trend with cumulative
GET /api/reports/category-breakdown – annual category breakdown (income or expense)
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract
from dateutil.relativedelta import relativedelta

from models import db
from models.transaction import Transaction
from models.category import Category
from utils.auth_helpers import get_current_user

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


# ── Monthly report ─────────────────────────────────────────────────────────────

@reports_bp.route("/monthly", methods=["GET"])
@jwt_required()
def monthly_report():
    user = get_current_user()
    now = datetime.utcnow()
    month = request.args.get("month", now.month, type=int)
    year = request.args.get("year", now.year, type=int)

    def _by_category(t_type):
        return (
            db.session.query(
                Category.name,
                Category.color,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .join(Transaction, Transaction.category_id == Category.id)
            .filter(
                Transaction.user_id == user.id,
                Transaction.type == t_type,
                extract("month", Transaction.date) == month,
                extract("year", Transaction.date) == year,
            )
            .group_by(Category.name, Category.color)
            .order_by(func.sum(Transaction.amount).desc())
            .all()
        )

    income_rows = _by_category("income")
    expense_rows = _by_category("expense")
    total_income = sum(float(r.total) for r in income_rows)
    total_expense = sum(float(r.total) for r in expense_rows)

    # All transactions for the month
    txs = (
        Transaction.query.filter(
            Transaction.user_id == user.id,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .order_by(Transaction.date.desc())
        .all()
    )

    def _fmt(rows, total):
        return [
            {
                "name": r.name,
                "color": r.color,
                "total": float(r.total),
                "count": r.count,
                "percentage": round(float(r.total) / total * 100, 1) if total else 0,
            }
            for r in rows
        ]

    return jsonify(
        {
            "period": {"month": month, "year": year},
            "total_income": total_income,
            "total_expense": total_expense,
            "net_balance": total_income - total_expense,
            "income_by_category": _fmt(income_rows, total_income),
            "expense_by_category": _fmt(expense_rows, total_expense),
            "transactions": [t.to_dict() for t in txs],
            "currency": "K",
        }
    ), 200


# ── Cash-flow trend ────────────────────────────────────────────────────────────

@reports_bp.route("/cashflow", methods=["GET"])
@jwt_required()
def cashflow():
    user = get_current_user()
    num_months = min(request.args.get("months", 6, type=int), 12)
    now = datetime.utcnow()

    data = []
    for i in range(num_months - 1, -1, -1):
        target = now - relativedelta(months=i)
        rows = (
            db.session.query(
                Transaction.type, func.sum(Transaction.amount).label("total")
            )
            .filter(
                Transaction.user_id == user.id,
                extract("month", Transaction.date) == target.month,
                extract("year", Transaction.date) == target.year,
            )
            .group_by(Transaction.type)
            .all()
        )
        income = expense = 0.0
        for row in rows:
            if row.type == "income":
                income = float(row.total)
            else:
                expense = float(row.total)

        data.append(
            {
                "period": target.strftime("%b %Y"),
                "month": target.month,
                "year": target.year,
                "income": income,
                "expense": expense,
                "net_cashflow": round(income - expense, 2),
                "cumulative": None,  # filled below
            }
        )

    # Running cumulative
    running = 0.0
    for item in data:
        running += item["net_cashflow"]
        item["cumulative"] = round(running, 2)

    return jsonify({"cashflow": data, "currency": "K"}), 200


# ── Annual category breakdown ──────────────────────────────────────────────────

@reports_bp.route("/category-breakdown", methods=["GET"])
@jwt_required()
def category_breakdown():
    user = get_current_user()
    year = request.args.get("year", datetime.utcnow().year, type=int)
    t_type = request.args.get("type", "expense")

    rows = (
        db.session.query(
            Category.name,
            Category.color,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user.id,
            Transaction.type == t_type,
            extract("year", Transaction.date) == year,
        )
        .group_by(Category.name, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    total = sum(float(r.total) for r in rows)
    return jsonify(
        {
            "year": year,
            "type": t_type,
            "total": total,
            "currency": "K",
            "breakdown": [
                {
                    "name": r.name,
                    "color": r.color,
                    "total": float(r.total),
                    "count": r.count,
                    "percentage": round(float(r.total) / total * 100, 1) if total else 0,
                }
                for r in rows
            ],
        }
    ), 200
