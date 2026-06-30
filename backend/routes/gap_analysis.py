"""
Gap Analysis Routes  –  /api/gap-analysis
===========================================
POST /api/gap-analysis/run         – run full analysis (rule-based + AI explanation)
GET  /api/gap-analysis/history     – paginated history of past results
GET  /api/gap-analysis/<id>        – get a single past result

Security:
  - All routes require JWT authentication (@jwt_required)
  - All queries filtered by user_id (data ownership enforced)
  - AI receives ONLY aggregated summaries (no raw transactions)
  - months_back is clamped to 1-12 (no unbounded queries)
"""

from datetime import date as date_type
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models import db
from models.gap_analysis import GapAnalysisResult
from models.transaction import Transaction
from services.gap_analysis_service import run_gap_analysis, build_financial_summary
from services.ai_service import get_ai_explanation
from utils.auth_helpers import get_current_user, get_business_owner_id
from middleware.auth_middleware import (
    require_role, require_auth,
    ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER,
)

gap_bp = Blueprint("gap_analysis", __name__, url_prefix="/api/gap-analysis")


@gap_bp.route("/run", methods=["POST"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT)
def run_analysis():
    """
    Run the full gap analysis for the authenticated user's business.

    Optional body: { "months_back": 1-12 }  (default: 3)

    Returns:
        200 with analysis result including risk_score, score_label, findings, and AI explanation
        400 if no transactions exist
    """
    user = get_current_user()
    owner_id = get_business_owner_id(user)

    # Need at least one transaction to analyse
    tx_count = Transaction.query.filter_by(user_id=owner_id).count()
    if tx_count == 0:
        return jsonify(
            {
                "error": (
                    "No transactions found. Please add some income and "
                    "expense records before running gap analysis."
                )
            }
        ), 400

    data = request.get_json() or {}
    months_back = max(1, min(data.get("months_back", 3), 12))

    # ── Step 1: Rule-based analysis ──────────────────────────────────────────
    analysis = run_gap_analysis(owner_id, months_back=months_back)
    findings = analysis["findings"]
    monthly_data = analysis["monthly_data"]
    overall_health = analysis["overall_health"]
    risk_score = analysis.get("risk_score", 0)
    score_label = analysis.get("score_label", "healthy")

    # ── Step 2: Build AI prompt (aggregated summary only) ─────────────────────
    summary_text = build_financial_summary(monthly_data, findings)
    ai_prompt = (
        summary_text
        + "\n\nBased on the financial data above, provide a clear, friendly analysis "
        "with practical recommendations for this SME owner."
    )

    # ── Step 3: AI explanation with fallback ──────────────────────────────────
    ai_text, ai_error = get_ai_explanation(ai_prompt)
    if ai_error:
        ai_text = (
            f"⚠️ AI analysis is temporarily unavailable: {ai_error}\n\n"
            "The rule-based findings above are still accurate and actionable."
        )

    # ── Step 4: Persist result under owner_id so team shares history ───────────
    period_start = (
        date_type(monthly_data[0]["year"], monthly_data[0]["month_num"], 1)
        if monthly_data else None
    )
    period_end = (
        date_type(monthly_data[-1]["year"], monthly_data[-1]["month_num"], 1)
        if monthly_data else None
    )

    result = GapAnalysisResult(
        user_id=owner_id,
        period_start=period_start,
        period_end=period_end,
        ai_explanation=ai_text,
        overall_health=overall_health,
    )
    result.rule_findings = findings
    db.session.add(result)
    db.session.commit()

    return jsonify(
        {
            "message": "Gap analysis completed.",
            "result": result.to_dict(),
            "monthly_data": monthly_data,
            "analysis_period": analysis["analysis_period"],
            "risk_score": risk_score,
            "score_label": score_label,
        }
    ), 200


@gap_bp.route("/history", methods=["GET"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER)
def history():
    """Return paginated history of past gap analysis results for the current business."""
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    summary_only = (user.role == ROLE_MANAGER)
    
    page = max(1, request.args.get("page", 1, type=int))

    paginated = (
        GapAnalysisResult.query.filter_by(user_id=owner_id)
        .order_by(GapAnalysisResult.generated_at.desc())
        .paginate(page=page, per_page=10, error_out=False)
    )

    return jsonify(
        {
            "results": [r.to_dict(summary_only=summary_only) for r in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
        }
    ), 200


@gap_bp.route("/<int:result_id>", methods=["GET"])
@require_role(ROLE_OWNER, ROLE_PERSONAL, ROLE_ACCOUNTANT, ROLE_MANAGER)
def get_result(result_id):
    """Return a single past gap analysis result. Enforces business ownership."""
    user = get_current_user()
    owner_id = get_business_owner_id(user)
    summary_only = (user.role == ROLE_MANAGER)
    
    result = GapAnalysisResult.query.filter_by(
        id=result_id, user_id=owner_id
    ).first()
    if not result:
        return jsonify({"error": "Analysis result not found."}), 404
    return jsonify({"result": result.to_dict(summary_only=summary_only)}), 200
