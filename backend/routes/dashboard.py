"""
Dashboard Routes  –  /api/dashboard
======================================
GET /api/dashboard/summary          – KPIs: income, expense, net, savings rate, MoM change
GET /api/dashboard/chart/monthly    – monthly income vs expense trend (N months)
GET /api/dashboard/chart/categories – category breakdown pie-chart data
GET /api/dashboard/recent           – last N transactions

Security & Data Accuracy:
  - All routes require JWT authentication
  - All queries strictly filtered by user_id (no cross-user data leakage)
  - Month/year parameters validated and clamped to safe ranges
  - All calculations performed server-side using ORM (no raw SQL)
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
from utils.validators import validate_month_year

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


# ── Helper ─────────────────────────────────────────────────────────────────────

def _period_totals(user_id: int, month: int, year: int) -> tuple[float, float, int, int]:
    """
    Return (total_income, total_expense, income_tx_count, expense_tx_count)
    for a specific user, month, and year.

    Security: user_id filter ensures users cannot access other users' data.
    """
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
        elif row.type == "expense":
            expense, expense_count = float(row.total), row.count
    return income, expense, income_count, expense_count


# ── Summary ────────────────────────────────────────────────────────────────────

@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    """
    Return KPI summary for a given month/year.

    Query params:
        month (int, 1-12, default: current month)
        year  (int, 2000-2100, default: current year)

    Returns:
        total_income, total_expense, net_balance, savings_rate, expense_ratio,
        transaction_count, income_count, expense_count,
        income_change_pct (vs prev month), expense_change_pct (vs prev month)
    """
    user = get_current_user()
    now = datetime.utcnow()

    raw_month = request.args.get("month", now.month, type=int)
    raw_year = request.args.get("year", now.year, type=int)

    # Validate and clamp month/year
    valid, err = validate_month_year(raw_month, raw_year)
    if not valid:
        return jsonify({"error": f"Invalid date parameters: {err}"}), 400

    month, year = raw_month, raw_year

    # Current month totals
    income, expense, inc_cnt, exp_cnt = _period_totals(user.id, month, year)
    net = round(income - expense, 2)

    # Ratios — safe division
    savings_rate = round((net / income * 100), 1) if income > 0 else 0.0
    expense_ratio = round((expense / income * 100), 1) if income > 0 else 0.0

    # Previous month for MoM comparison
    prev_dt = datetime(year, month, 1) - relativedelta(months=1)
    prev_income, prev_expense, _, _ = _period_totals(user.id, prev_dt.month, prev_dt.year)

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
    """
    Return monthly income vs expense trend data.

    Query params:
        months (int, 1-12, default: 6) — number of months to include

    Returns: chart_data list ordered oldest → newest
    """
    user = get_current_user()
    # Clamp to safe range
    raw_months = request.args.get("months", 6, type=int)
    num_months = max(1, min(raw_months, 12))
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
                "savings_rate": round((income - expense) / income * 100, 1) if income > 0 else 0.0,
            }
        )

    return jsonify({"chart_data": result}), 200


# ── Category pie-chart ─────────────────────────────────────────────────────────

@dashboard_bp.route("/chart/categories", methods=["GET"])
@jwt_required()
def category_chart():
    """
    Return category-wise spending breakdown for a given month.

    Query params:
        month (int)     — default: current month
        year  (int)     — default: current year
        type  (str)     — 'income' or 'expense' (default: 'expense')

    Returns: chart_data list with name, color, amount, percentage
    """
    user = get_current_user()
    now = datetime.utcnow()
    month = request.args.get("month", now.month, type=int)
    year = request.args.get("year", now.year, type=int)

    # Validate type parameter
    raw_type = request.args.get("type", "expense")
    t_type = raw_type if raw_type in ("income", "expense") else "expense"

    # Validate month/year
    valid, _ = validate_month_year(month, year)
    if not valid:
        month, year = now.month, now.year

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

    return jsonify({
        "chart_data": chart_data,
        "total": total,
        "type": t_type,
        "period": {"month": month, "year": year},
    }), 200


# ── Recent transactions ────────────────────────────────────────────────────────

@dashboard_bp.route("/recent", methods=["GET"])
@jwt_required()
def recent_transactions():
    """
    Return the most recent N transactions for the authenticated user.

    Query params:
        limit (int, 1-20, default: 5)

    Security: Only returns transactions belonging to the authenticated user.
    """
    user = get_current_user()
    raw_limit = request.args.get("limit", 5, type=int)
    limit = max(1, min(raw_limit, 20))  # Clamp to safe range

    txs = (
        Transaction.query.filter_by(user_id=user.id)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return jsonify({"transactions": [t.to_dict() for t in txs]}), 200
