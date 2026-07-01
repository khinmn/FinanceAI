"""
Dynamic Notifications Route  –  /api/notifications
====================================================
GET /api/notifications – build current in-app notifications from live finance data.
"""

from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func, extract

from models import db
from models.budget import Budget
from models.transaction import Transaction
from models.goal import Goal
from models.gap_analysis import GapAnalysisResult
from utils.auth_helpers import get_current_user, get_business_owner_id
from middleware.auth_middleware import require_auth

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api")


def _relative_time(dt: datetime | None) -> str:
    if not dt:
        return "just now"

    delta = datetime.utcnow() - dt
    seconds = max(0, int(delta.total_seconds()))

    if seconds < 60:
        return "just now"
    if seconds < 3600:
        minutes = seconds // 60
        return f"{minutes}m ago"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours}h ago"
    days = seconds // 86400
    if days < 7:
        return f"{days}d ago"
    weeks = days // 7
    if weeks < 5:
        return f"{weeks}w ago"
    return dt.strftime("%d %b %Y")


def _make_notification(
    notification_id: str,
    notification_type: str,
    title: str,
    message: str,
    created_at: datetime | None,
) -> dict:
    return {
        "id": notification_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "created_at": created_at.isoformat() if created_at else None,
        "time": _relative_time(created_at),
        "read": False,
    }


@notifications_bp.route("/notifications", methods=["GET"])
@require_auth()
def get_notifications():
    """Return live notifications based on budgets, goals, latest analysis, and transactions."""
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    now = datetime.utcnow()

    notifications: list[dict] = []

    # Current-month budget threshold notifications.
    spend_rows = (
        db.session.query(
            Transaction.category_id,
            func.sum(Transaction.amount).label("spent"),
            func.max(Transaction.updated_at).label("latest_update"),
        )
        .filter(
            Transaction.user_id == owner_id,
            Transaction.type == "expense",
            extract("month", Transaction.date) == now.month,
            extract("year", Transaction.date) == now.year,
        )
        .group_by(Transaction.category_id)
        .all()
    )
    spent_by_category = {
        row.category_id: {
            "spent": float(row.spent or 0),
            "latest_update": row.latest_update,
        }
        for row in spend_rows
    }

    budgets = Budget.query.filter_by(user_id=owner_id, month=now.month, year=now.year).all()
    for budget in budgets:
        budget_amount = float(budget.amount or 0)
        if budget_amount <= 0:
            continue

        actual = spent_by_category.get(budget.category_id, {"spent": 0.0, "latest_update": budget.updated_at})
        spent = actual["spent"]
        ratio = spent / budget_amount if budget_amount else 0
        category_name = budget.category.name if budget.category else budget.name
        created_at = actual.get("latest_update") or budget.updated_at or now

        if ratio >= 1:
            notifications.append(
                _make_notification(
                    f"budget-exceeded-{budget.id}-{now.year}-{now.month}",
                    "alert",
                    "Budget Limit Exceeded",
                    f"{category_name} has spent K {spent:,.0f}, which is above the K {budget_amount:,.0f} monthly limit.",
                    created_at,
                )
            )
        elif ratio >= 0.8:
            notifications.append(
                _make_notification(
                    f"budget-threshold-{budget.id}-{now.year}-{now.month}",
                    "alert",
                    "Budget Threshold Warning",
                    f"{category_name} has used {ratio * 100:.0f}% of its K {budget_amount:,.0f} monthly budget.",
                    created_at,
                )
            )

    # Goal progress notifications.
    goals = Goal.query.filter_by(user_id=owner_id).order_by(Goal.updated_at.desc()).limit(5).all()
    for goal in goals:
        target = float(goal.target_amount or 0)
        current = float(goal.current_amount or 0)
        created_at = goal.updated_at or goal.created_at or now
        if target > 0 and current >= target:
            notifications.append(
                _make_notification(
                    f"goal-reached-{goal.id}",
                    "success",
                    "Goal Reached",
                    f"You reached the K {target:,.0f} target for \"{goal.name}\".",
                    created_at,
                )
            )
        elif goal.target_date and goal.target_date <= (now.date() + timedelta(days=7)) and current < target:
            remaining = max(target - current, 0)
            notifications.append(
                _make_notification(
                    f"goal-due-soon-{goal.id}",
                    "alert",
                    "Goal Deadline Coming Up",
                    f"\"{goal.name}\" is due soon with K {remaining:,.0f} remaining.",
                    created_at,
                )
            )

    # Latest gap analysis notification.
    latest_analysis = (
        GapAnalysisResult.query.filter_by(user_id=owner_id)
        .order_by(GapAnalysisResult.generated_at.desc())
        .first()
    )
    if latest_analysis:
        finding_count = len(latest_analysis.rule_findings)
        health = (latest_analysis.overall_health or "unknown").title()
        n_type = "alert" if latest_analysis.overall_health in {"warning", "critical"} else "info"
        notifications.append(
            _make_notification(
                f"gap-analysis-{latest_analysis.id}",
                n_type,
                "Latest Gap Analysis Updated",
                f"Financial health is {health}. {finding_count} finding{'s' if finding_count != 1 else ''} detected.",
                latest_analysis.generated_at,
            )
        )

    # Latest transaction notification so the bell reflects the newest financial activity.
    latest_tx = (
        Transaction.query.filter_by(user_id=owner_id)
        .order_by(Transaction.updated_at.desc(), Transaction.created_at.desc())
        .first()
    )
    if latest_tx:
        tx_type = "Income" if latest_tx.type == "income" else "Expense"
        notifications.append(
            _make_notification(
                f"latest-transaction-{latest_tx.id}",
                "info",
                f"Latest {tx_type} Recorded",
                f"{latest_tx.description} was recorded for K {float(latest_tx.amount):,.0f}.",
                latest_tx.updated_at or latest_tx.created_at,
            )
        )

    notifications.sort(key=lambda item: item.get("created_at") or "", reverse=True)
    return jsonify({"notifications": notifications[:10]}), 200
