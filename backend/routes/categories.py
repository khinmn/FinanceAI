"""
Category Routes  –  /api/categories
======================================
GET    /api/categories        – list user's categories (optionally filter by type)
POST   /api/categories        – create a custom category
PUT    /api/categories/<id>   – rename / recolour a category
DELETE /api/categories/<id>   – delete a non-default category
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models import db
from models.category import Category
from utils.auth_helpers import get_current_user

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.route("", methods=["GET"])
@jwt_required()
def get_categories():
    user = get_current_user()
    t_type = request.args.get("type")  # 'income' | 'expense'

    query = Category.query.filter_by(user_id=user.id)
    if t_type in ("income", "expense"):
        query = query.filter_by(type=t_type)

    categories = query.order_by(
        Category.is_default.desc(), Category.name.asc()
    ).all()
    return jsonify({"categories": [c.to_dict() for c in categories]}), 200


@categories_bp.route("", methods=["POST"])
@jwt_required()
def create_category():
    user = get_current_user()
    data = request.get_json() or {}

    if not data.get("name") or not data.get("type"):
        return jsonify({"error": "name and type are required."}), 400

    if data["type"] not in ("income", "expense"):
        return jsonify({"error": "type must be 'income' or 'expense'."}), 400

    existing = Category.query.filter_by(
        user_id=user.id,
        name=data["name"].strip(),
        type=data["type"],
    ).first()
    if existing:
        return jsonify({"error": "A category with this name already exists."}), 409

    cat = Category(
        user_id=user.id,
        name=data["name"].strip(),
        type=data["type"],
        color=data.get("color", "#6B7280"),
        is_default=False,
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({"message": "Category created.", "category": cat.to_dict()}), 201


@categories_bp.route("/<int:cat_id>", methods=["PUT"])
@jwt_required()
def update_category(cat_id):
    user = get_current_user()
    cat = Category.query.filter_by(id=cat_id, user_id=user.id).first()
    if not cat:
        return jsonify({"error": "Category not found."}), 404

    data = request.get_json() or {}
    if data.get("name"):
        cat.name = data["name"].strip()
    if data.get("color"):
        cat.color = data["color"]

    db.session.commit()
    return jsonify({"message": "Category updated.", "category": cat.to_dict()}), 200


@categories_bp.route("/<int:cat_id>", methods=["DELETE"])
@jwt_required()
def delete_category(cat_id):
    user = get_current_user()
    cat = Category.query.filter_by(id=cat_id, user_id=user.id).first()
    if not cat:
        return jsonify({"error": "Category not found."}), 404
    if cat.is_default:
        return jsonify({"error": "Default categories cannot be deleted."}), 403

    # Detach associated transactions (set to uncategorized)
    for tx in cat.transactions:
        tx.category_id = None

    db.session.delete(cat)
    db.session.commit()
    return jsonify({"message": "Category deleted."}), 200
