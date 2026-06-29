"""
Transaction Routes  –  /api/transactions
==========================================
GET    /api/transactions              – paginated list with filters
POST   /api/transactions              – create new transaction
GET    /api/transactions/<id>         – get single transaction
PUT    /api/transactions/<id>         – update transaction
DELETE /api/transactions/<id>         – delete transaction
GET    /api/transactions/summary      – monthly income/expense totals

RBAC:
  GET  (list, single, summary)  – all authenticated roles
  POST (create)                 – owner, personal, manager, employee
  PUT  (update)                 – owner, personal, manager
  DELETE                        – owner, personal only
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract

from models import db
from models.transaction import Transaction
from models.category import Category
from utils.auth_helpers import get_current_user, get_business_owner_id
from utils.validators import (
    validate_transaction_type,
    validate_payment_method,
    validate_date,
)
from middleware.auth_middleware import (
    require_role, require_auth,
    ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER, ROLE_EMPLOYEE,
)

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


# ── List ───────────────────────────────────────────────────────────────────────

@transactions_bp.route("", methods=["GET"])
@require_auth()
def get_transactions():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    t_type = request.args.get("type")
    category_id = request.args.get("category_id", type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    search = request.args.get("search", "").strip()

    query = Transaction.query.filter_by(user_id=owner_id)

    if t_type and validate_transaction_type(t_type):
        query = query.filter_by(type=t_type)
    if category_id:
        query = query.filter_by(category_id=category_id)
    if date_from:
        d, _ = validate_date(date_from)
        if d:
            query = query.filter(Transaction.date >= d)
    if date_to:
        d, _ = validate_date(date_to)
        if d:
            query = query.filter(Transaction.date <= d)
    if search:
        safe_search = f"%{search}%"
        query = query.filter(
            db.or_(
                Transaction.description.ilike(safe_search),
                Transaction.note.ilike(safe_search),
            )
        )

    query = query.order_by(Transaction.date.desc(), Transaction.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "transactions": [t.to_dict() for t in paginated.items],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": paginated.total,
                "pages": paginated.pages,
                "has_next": paginated.has_next,
                "has_prev": paginated.has_prev,
            },
        }
    ), 200


# ── Create ─────────────────────────────────────────────────────────────────────

@transactions_bp.route("", methods=["POST"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_MANAGER, ROLE_EMPLOYEE)
def create_transaction():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    data = request.get_json() or {}

    for field in ("type", "amount", "description", "date"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    if not validate_transaction_type(data["type"]):
        return jsonify({"error": "type must be 'income' or 'expense'."}), 400

    try:
        amount = float(data["amount"])
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "amount must be a positive number."}), 400

    t_date, date_err = validate_date(data["date"])
    if date_err:
        return jsonify({"error": date_err}), 400

    payment_method = data.get("payment_method", "cash")
    if not validate_payment_method(payment_method):
        payment_method = "cash"

    category_id = data.get("category_id")
    if category_id:
        cat = Category.query.filter_by(id=category_id, user_id=owner_id).first()
        if not cat:
            return jsonify({"error": "Category not found."}), 404
        if cat.type != data["type"]:
            return jsonify(
                {"error": f"Category type mismatch – expected a {data['type']} category."}
            ), 400

    tx = Transaction(
        user_id=owner_id,
        category_id=category_id,
        type=data["type"],
        amount=amount,
        description=data["description"].strip(),
        date=t_date,
        payment_method=payment_method,
        note=data.get("note", ""),
        receipt_url=data.get("receipt_url"),
    )
    db.session.add(tx)
    db.session.commit()

    # Check budget limit for this category/month
    budget_alert = False
    if tx.type == "expense" and tx.category_id:
        from models.budget import Budget
        month = tx.date.month
        year = tx.date.year
        budget = Budget.query.filter_by(
            user_id=owner_id,
            category_id=tx.category_id,
            month=month,
            year=year
        ).first()
        if budget:
            total_spent = db.session.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == owner_id,
                Transaction.category_id == tx.category_id,
                Transaction.type == "expense",
                extract("month", Transaction.date) == month,
                extract("year", Transaction.date) == year
            ).scalar() or 0.0
            if float(total_spent) > float(budget.amount):
                budget_alert = True

    return jsonify({
        "message": "Transaction created.",
        "transaction": tx.to_dict(),
        "budget_alert": budget_alert
    }), 201


# ── Read one ───────────────────────────────────────────────────────────────────

@transactions_bp.route("/<int:tx_id>", methods=["GET"])
@require_auth()
def get_transaction(tx_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    tx = Transaction.query.filter_by(id=tx_id, user_id=owner_id).first()
    if not tx:
        return jsonify({"error": "Transaction not found."}), 404
    return jsonify({"transaction": tx.to_dict()}), 200


# ── Update ─────────────────────────────────────────────────────────────────────

@transactions_bp.route("/<int:tx_id>", methods=["PUT"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_MANAGER)
def update_transaction(tx_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    tx = Transaction.query.filter_by(id=tx_id, user_id=owner_id).first()
    if not tx:
        return jsonify({"error": "Transaction not found."}), 404

    data = request.get_json() or {}

    if "type" in data:
        if not validate_transaction_type(data["type"]):
            return jsonify({"error": "type must be 'income' or 'expense'."}), 400
        tx.type = data["type"]

    if "amount" in data:
        try:
            amount = float(data["amount"])
            if amount <= 0:
                raise ValueError
            tx.amount = amount
        except (ValueError, TypeError):
            return jsonify({"error": "amount must be a positive number."}), 400

    if "description" in data:
        tx.description = data["description"].strip()

    if "date" in data:
        d, err = validate_date(data["date"])
        if err:
            return jsonify({"error": err}), 400
        tx.date = d

    if "payment_method" in data and validate_payment_method(data["payment_method"]):
        tx.payment_method = data["payment_method"]

    if "note" in data:
        tx.note = data["note"]

    if "receipt_url" in data:
        tx.receipt_url = data["receipt_url"]

    if "category_id" in data:
        cat_id = data["category_id"]
        if cat_id:
            cat = Category.query.filter_by(id=cat_id, user_id=owner_id).first()
            if not cat:
                return jsonify({"error": "Category not found."}), 404
        tx.category_id = cat_id

    tx.updated_at = datetime.utcnow()
    db.session.commit()

    # Check budget limit for this category/month
    budget_alert = False
    if tx.type == "expense" and tx.category_id:
        from models.budget import Budget
        month = tx.date.month
        year = tx.date.year
        budget = Budget.query.filter_by(
            user_id=owner_id,
            category_id=tx.category_id,
            month=month,
            year=year
        ).first()
        if budget:
            total_spent = db.session.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == owner_id,
                Transaction.category_id == tx.category_id,
                Transaction.type == "expense",
                extract("month", Transaction.date) == month,
                extract("year", Transaction.date) == year
            ).scalar() or 0.0
            if float(total_spent) > float(budget.amount):
                budget_alert = True

    return jsonify({
        "message": "Transaction updated.",
        "transaction": tx.to_dict(),
        "budget_alert": budget_alert
    }), 200


# ── Delete ─────────────────────────────────────────────────────────────────────

@transactions_bp.route("/<int:tx_id>", methods=["DELETE"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def delete_transaction(tx_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    tx = Transaction.query.filter_by(id=tx_id, user_id=owner_id).first()
    if not tx:
        return jsonify({"error": "Transaction not found."}), 404
    db.session.delete(tx)
    db.session.commit()
    return jsonify({"message": "Transaction deleted."}), 200


# ── Monthly summary ────────────────────────────────────────────────────────────

@transactions_bp.route("/summary", methods=["GET"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER)
def monthly_summary():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    now = datetime.utcnow()
    month = request.args.get("month", now.month, type=int)
    year = request.args.get("year", now.year, type=int)

    rows = (
        db.session.query(
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .filter(
            Transaction.user_id == owner_id,
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

    return jsonify(
        {
            "month": month,
            "year": year,
            "total_income": income,
            "total_expense": expense,
            "net_balance": income - expense,
            "income_count": income_count,
            "expense_count": expense_count,
            "currency": "K",
        }
    ), 200
