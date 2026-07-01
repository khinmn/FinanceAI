from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

from models import db
from models.goal import Goal
from utils.auth_helpers import get_current_user, get_business_owner_id
from services.ai_service import get_goal_projection
from middleware.auth_middleware import require_role, ROLE_OWNER, ROLE_PERSONAL

goals_bp = Blueprint("goals", __name__, url_prefix="/api/goals")


@goals_bp.route("", methods=["GET"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def get_goals():
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    
    goals = Goal.query.filter_by(user_id=owner_id).order_by(Goal.created_at.desc()).all()
    return jsonify({"goals": [g.to_dict() for g in goals]}), 200


@goals_bp.route("", methods=["POST"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def create_goal():
    user = get_current_user()
    owner_id = get_business_owner_id(user)

    data = request.get_json() or {}

    for field in ("name", "target_amount", "current_amount", "target_date", "monthly_savings"):
        if data.get(field) is None:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        target_amount = float(data["target_amount"])
        current_amount = float(data["current_amount"])
        monthly_savings = float(data["monthly_savings"])
        if target_amount <= 0 or current_amount < 0 or monthly_savings < 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Amounts must be positive numeric values."}), 400

    try:
        target_date = datetime.strptime(data["target_date"], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    goal = Goal(
        user_id=owner_id,
        name=data["name"],
        target_amount=target_amount,
        current_amount=current_amount,
        target_date=target_date,
        monthly_savings=monthly_savings,
    )
    db.session.add(goal)
    db.session.commit()

    return jsonify({"message": "Goal created successfully.", "goal": goal.to_dict()}), 201


@goals_bp.route("/<int:goal_id>", methods=["PUT"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def update_goal(goal_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)

    goal = Goal.query.filter_by(id=goal_id, user_id=owner_id).first()
    if not goal:
        return jsonify({"error": "Goal not found."}), 404

    data = request.get_json() or {}

    if "name" in data:
        goal.name = data["name"]

    if "target_amount" in data:
        try:
            target_amount = float(data["target_amount"])
            if target_amount <= 0:
                raise ValueError
            goal.target_amount = target_amount
        except (ValueError, TypeError):
            return jsonify({"error": "target_amount must be a positive number."}), 400

    if "current_amount" in data:
        try:
            current_amount = float(data["current_amount"])
            if current_amount < 0:
                raise ValueError
            goal.current_amount = current_amount
        except (ValueError, TypeError):
            return jsonify({"error": "current_amount must be non-negative."}), 400

    if "monthly_savings" in data:
        try:
            monthly_savings = float(data["monthly_savings"])
            if monthly_savings < 0:
                raise ValueError
            goal.monthly_savings = monthly_savings
        except (ValueError, TypeError):
            return jsonify({"error": "monthly_savings must be non-negative."}), 400

    if "target_date" in data:
        try:
            target_date = datetime.strptime(data["target_date"], "%Y-%m-%d").date()
            goal.target_date = target_date
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    goal.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Goal updated successfully.", "goal": goal.to_dict()}), 200


@goals_bp.route("/<int:goal_id>", methods=["DELETE"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def delete_goal(goal_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)

    goal = Goal.query.filter_by(id=goal_id, user_id=owner_id).first()
    if not goal:
        return jsonify({"error": "Goal not found."}), 404

    db.session.delete(goal)
    db.session.commit()

    return jsonify({"message": "Goal deleted successfully."}), 200


@goals_bp.route("/<int:goal_id>/projection", methods=["POST"])
@require_role(ROLE_OWNER, ROLE_PERSONAL)
def get_goal_ai_projection(goal_id):
    user = get_current_user()
    owner_id = get_business_owner_id(user)

    goal = Goal.query.filter_by(id=goal_id, user_id=owner_id).first()
    if not goal:
        return jsonify({"error": "Goal not found."}), 404

    try:
        # get_goal_projection returns (text, error)
        projection_text, error_msg = get_goal_projection(
            goal_name=goal.name,
            target_amount=float(goal.target_amount),
            current_amount=float(goal.current_amount),
            target_date_str=goal.target_date.strftime("%B %Y"),
            monthly_savings=float(goal.monthly_savings),
        )
        if error_msg:
            current_app.logger.warning("Goal projection AI fallback used: %s", error_msg)
        return jsonify({"projection": projection_text}), 200
    except Exception as exc:
        return jsonify({"error": f"AI service failed: {exc}"}), 500
