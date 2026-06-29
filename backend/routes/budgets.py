from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract

from models import db
from models.budget import Budget
from models.category import Category
from models.transaction import Transaction
from utils.auth_helpers import get_current_user, get_business_owner_id
from middleware.auth_middleware import (
    require_role, require_auth,
    ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER,
)

budgets_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")


# ── CRUD endpoints ─────────────────────────────────────────────────────────────

@budgets_bp.route("", methods=["GET"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER)
def get_budgets():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    query = Budget.query.filter_by(user_id=owner_id)
    if month:
        query = query.filter_by(month=month)
    if year:
        query = query.filter_by(year=year)

    budgets = query.all()
    return jsonify({"budgets": [b.to_dict() for b in budgets]}), 200


@budgets_bp.route("", methods=["POST"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def create_budget():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    data = request.get_json() or {}

    for field in ("category_id", "amount", "month", "year"):
        if data.get(field) is None:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        amount = float(data["amount"])
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "amount must be a positive number."}), 400

    try:
        month = int(data["month"])
        year = int(data["year"])
        if not (1 <= month <= 12):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "month must be an integer between 1 and 12, and year must be an integer."}), 400

    category_id = int(data["category_id"])
    cat = Category.query.filter_by(id=category_id, user_id=owner_id).first()
    if not cat:
        return jsonify({"error": "Category not found."}), 404

    # Upsert: check if a budget for this category, month, and year already exists
    existing = Budget.query.filter_by(
        user_id=owner_id,
        category_id=category_id,
        month=month,
        year=year
    ).first()

    if existing:
        existing.amount = amount
        existing.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"message": "Budget updated.", "budget": existing.to_dict()}), 200

    budget = Budget(
        user_id=owner_id,
        category_id=category_id,
        name=cat.name,
        amount=amount,
        month=month,
        year=year
    )
    db.session.add(budget)
    db.session.commit()
    return jsonify({"message": "Budget created.", "budget": budget.to_dict()}), 201


@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def update_budget(budget_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    budget = Budget.query.filter_by(id=budget_id, user_id=owner_id).first()
    if not budget:
        return jsonify({"error": "Budget not found."}), 404

    data = request.get_json() or {}
    if "amount" in data:
        try:
            amount = float(data["amount"])
            if amount <= 0:
                raise ValueError
            budget.amount = amount
        except (ValueError, TypeError):
            return jsonify({"error": "amount must be a positive number."}), 400

    budget.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Budget updated.", "budget": budget.to_dict()}), 200


@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def delete_budget(budget_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    budget = Budget.query.filter_by(id=budget_id, user_id=owner_id).first()
    if not budget:
        return jsonify({"error": "Budget not found."}), 404

    db.session.delete(budget)
    db.session.commit()
    return jsonify({"message": "Budget deleted."}), 200


# ── Budget Summary vs Actual Spending ──────────────────────────────────────────

@budgets_bp.route("/summary", methods=["GET"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER)
def get_budget_summary():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    now = datetime.utcnow()
    month = request.args.get("month", now.month, type=int)
    year = request.args.get("year", now.year, type=int)

    # Get all user's expense categories
    categories = Category.query.filter_by(user_id=owner_id, type="expense").all()

    # Get all budgets for this month & year
    budgets = {
        b.category_id: b 
        for b in Budget.query.filter_by(user_id=owner_id, month=month, year=year).all()
    }

    # Query total expenses grouped by category for this month & year
    rows = (
        db.session.query(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.user_id == owner_id,
            Transaction.type == "expense",
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year
        )
        .group_by(Transaction.category_id)
        .all()
    )
    actual_spent = {row.category_id: float(row.total) for row in rows}

    summary = []
    for cat in categories:
        budget = budgets.get(cat.id)
        budget_amount = float(budget.amount) if budget else 0.0
        spent = actual_spent.get(cat.id, 0.0)

        summary.append({
            "category_id": cat.id,
            "category_name": cat.name,
            "category_color": cat.color or "#6B7280",
            "budget_id": budget.id if budget else None,
            "budget_amount": budget_amount,
            "actual_spent": spent,
            "remaining": max(0.0, budget_amount - spent),
            "is_exceeded": spent > budget_amount if budget_amount > 0 else False
        })

    return jsonify({
        "month": month,
        "year": year,
        "summary": summary,
        "total_budgeted": sum(s["budget_amount"] for s in summary),
        "total_spent": sum(s["actual_spent"] for s in summary)
    }), 200


@budgets_bp.route("/copy-previous", methods=["POST"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def copy_previous_budgets():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    data = request.get_json() or {}

    target_month = data.get("month")
    target_year = data.get("year")

    if not target_month or not target_year:
        return jsonify({"error": "Missing target month or year"}), 400

    try:
        target_month = int(target_month)
        target_year = int(target_year)
        if not (1 <= target_month <= 12):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid month or year"}), 400

    # Calculate previous month and year
    if target_month == 1:
        prev_month = 12
        prev_year = target_year - 1
    else:
        prev_month = target_month - 1
        prev_year = target_year

    # Get budgets from the previous month
    prev_budgets = Budget.query.filter_by(
        user_id=owner_id,
        month=prev_month,
        year=prev_year
    ).all()

    if not prev_budgets:
        return jsonify({"message": "No budgets found for the previous month to copy.", "copied_count": 0}), 200

    copied_count = 0
    for pb in prev_budgets:
        # Check if budget already exists for target month/year/category
        existing = Budget.query.filter_by(
            user_id=owner_id,
            category_id=pb.category_id,
            month=target_month,
            year=target_year
        ).first()

        if not existing:
            # Create new
            new_budget = Budget(
                user_id=owner_id,
                category_id=pb.category_id,
                name=pb.name,
                amount=pb.amount,
                month=target_month,
                year=target_year
            )
            db.session.add(new_budget)
            copied_count += 1
        else:
            # Overwrite amount
            existing.amount = pb.amount
            existing.updated_at = datetime.utcnow()
            copied_count += 1

    db.session.commit()
    return jsonify({
        "message": f"Successfully copied {copied_count} budgets from previous month ({prev_month}/{prev_year}).",
        "copied_count": copied_count
    }), 200


@budgets_bp.route("/ai-coach", methods=["GET"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT)
def get_ai_coach():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    now = datetime.utcnow()
    month = request.args.get("month", now.month, type=int)
    year = request.args.get("year", now.year, type=int)

    # 1. Fetch budget summary list exactly like `/summary`
    categories = Category.query.filter_by(user_id=owner_id, type="expense").all()
    budgets = {
        b.category_id: b 
        for b in Budget.query.filter_by(user_id=owner_id, month=month, year=year).all()
    }

    rows = (
        db.session.query(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.user_id == owner_id,
            Transaction.type == "expense",
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year
        )
        .group_by(Transaction.category_id)
        .all()
    )
    actual_spent = {row.category_id: float(row.total) for row in rows}

    summary = []
    for cat in categories:
        budget = budgets.get(cat.id)
        budget_amount = float(budget.amount) if budget else 0.0
        spent = actual_spent.get(cat.id, 0.0)

        # Only include in AI prompt if budget is configured OR if user has actual spent amount
        if budget_amount > 0 or spent > 0:
            summary.append({
                "category_name": cat.name,
                "budget_amount": budget_amount,
                "actual_spent": spent,
                "is_exceeded": spent > budget_amount if budget_amount > 0 else False
            })

    total_budgeted = sum(s["budget_amount"] for s in summary)
    total_spent = sum(s["actual_spent"] for s in summary)
    remaining_balance = total_budgeted - total_spent

    # 2. Map month number to label
    month_names = {
        1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
        7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
    }
    month_name = month_names.get(month, "Current Month")

    # 3. Build Prompt
    prompt = (
        f"Budget and Expense Analysis for {month_name} {year}:\n"
        f"- Total Budgeted: K{total_budgeted:,.2f}\n"
        f"- Total Spent: K{total_spent:,.2f}\n"
        f"- Net Balance: K{remaining_balance:,.2f}\n\n"
        f"Category breakdown:\n"
    )
    for s in summary:
        if s["budget_amount"] > 0:
            prompt += (
                f"- Category: {s['category_name']}, Budget Limit: K{s['budget_amount']:,.2f}, "
                f"Spent: K{s['actual_spent']:,.2f}, Status: {'Exceeded' if s['is_exceeded'] else 'Within limit'}\n"
            )
        else:
            prompt += (
                f"- Category: {s['category_name']}, No Budget limit, "
                f"Spent: K{s['actual_spent']:,.2f}\n"
            )

    # Call AI service
    from services.ai_service import get_ai_explanation
    insights, error = get_ai_explanation(prompt)
    if error:
        return jsonify({"error": error}), 500

    return jsonify({"insights": insights}), 200
