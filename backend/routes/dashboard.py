"""
Dashboard Routes  –  /api/dashboard
======================================
GET /api/dashboard/summary          – KPIs: income, expense, net, savings rate, MoM change
GET /api/dashboard/chart/monthly    – monthly income vs expense trend (N months)
GET /api/dashboard/chart/categories – category breakdown pie-chart data
GET /api/dashboard/recent           – last N transactions
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

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


# ── Helper ─────────────────────────────────────────────────────────────────────

def _period_totals(user_id, month, year):
    rows = (
        db.session.query(
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .filter(
            Transaction.user_id == user_id,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .group_by(Transaction.type)
        .all()
    )
    income = expense = 0.0
    income_count = expense_count = 0
    for row in rows:
        if row.type == "income":
            income, income_count = float(row.total), row.count
        else:
            expense, expense_count = float(row.total), row.count
    return income, expense, income_count, expense_count


# ── Summary ────────────────────────────────────────────────────────────────────

@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    user = get_current_user()
    now = datetime.utcnow()
    month = request.args.get("month", now.month, type=int)
    year = request.args.get("year", now.year, type=int)

    income, expense, inc_cnt, exp_cnt = _period_totals(user.id, month, year)
    net = income - expense
    savings_rate = round((net / income * 100), 1) if income > 0 else 0
    expense_ratio = round((expense / income * 100), 1) if income > 0 else 0

    # Previous month for MoM comparison
    prev = datetime(year, month, 1) - relativedelta(months=1)
    prev_income, prev_expense, _, _ = _period_totals(user.id, prev.month, prev.year)

    income_change = (
        round((income - prev_income) / prev_income * 100, 1) if prev_income > 0 else None
    )
    expense_change = (
        round((expense - prev_expense) / prev_expense * 100, 1) if prev_expense > 0 else None
    )

    return jsonify(
        {
            "period": {"month": month, "year": year},
            "total_income": income,
            "total_expense": expense,
            "net_balance": net,
            "savings_rate": savings_rate,
            "expense_ratio": expense_ratio,
            "transaction_count": inc_cnt + exp_cnt,
            "income_count": inc_cnt,
            "expense_count": exp_cnt,
            "income_change_pct": income_change,
            "expense_change_pct": expense_change,
            "currency": "K",
        }
    ), 200


# ── Monthly chart (income vs expense trend) ────────────────────────────────────

@dashboard_bp.route("/chart/monthly", methods=["GET"])
@jwt_required()
def monthly_chart():
    user = get_current_user()
    num_months = min(request.args.get("months", 6, type=int), 12)
    now = datetime.utcnow()

    result = []
    for i in range(num_months - 1, -1, -1):
        target = now - relativedelta(months=i)
        income, expense, _, _ = _period_totals(user.id, target.month, target.year)
        result.append(
            {
                "month": target.strftime("%b"),
                "year": target.year,
                "month_num": target.month,
                "income": income,
                "expense": expense,
                "net": round(income - expense, 2),
            }
        )

    return jsonify({"chart_data": result}), 200


# ── Category pie-chart ─────────────────────────────────────────────────────────

@dashboard_bp.route("/chart/categories", methods=["GET"])
@jwt_required()
def category_chart():
    user = get_current_user()
    now = datetime.utcnow()
    month = request.args.get("month", now.month, type=int)
    year = request.args.get("year", now.year, type=int)
    t_type = request.args.get("type", "expense")

    rows = (
        db.session.query(
            Category.name,
            Category.color,
            func.sum(Transaction.amount).label("total"),
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

    total = sum(float(r.total) for r in rows)
    chart_data = [
        {
            "name": r.name,
            "color": r.color,
            "amount": float(r.total),
            "percentage": round(float(r.total) / total * 100, 1) if total else 0,
        }
        for r in rows
    ]

    return jsonify({"chart_data": chart_data, "total": total, "type": t_type}), 200


# ── Recent transactions ────────────────────────────────────────────────────────

@dashboard_bp.route("/recent", methods=["GET"])
@jwt_required()
def recent_transactions():
    user = get_current_user()
    limit = min(request.args.get("limit", 5, type=int), 20)
    txs = (
        Transaction.query.filter_by(user_id=user.id)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return jsonify({"transactions": [t.to_dict() for t in txs]}), 200
