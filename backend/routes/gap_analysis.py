"""
Gap Analysis Routes  –  /api/gap-analysis
===========================================
POST /api/gap-analysis/run         – run full analysis (rule-based + AI explanation)
GET  /api/gap-analysis/history     – paginated history of past results
GET  /api/gap-analysis/<id>        – get a single past result
"""

from datetime import date as date_type
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models import db
from models.gap_analysis import GapAnalysisResult
from models.transaction import Transaction
from services.gap_analysis_service import run_gap_analysis, build_financial_summary
from services.ai_service import get_ai_explanation
from utils.auth_helpers import get_current_user

gap_bp = Blueprint("gap_analysis", __name__, url_prefix="/api/gap-analysis")


@gap_bp.route("/run", methods=["POST"])
@jwt_required()
def run_analysis():
    user = get_current_user()

    # Need at least one transaction to analyse
    tx_count = Transaction.query.filter_by(user_id=user.id).count()
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
    analysis = run_gap_analysis(user.id, months_back=months_back)
    findings = analysis["findings"]
    monthly_data = analysis["monthly_data"]
    overall_health = analysis["overall_health"]

    # ── Step 2: Build AI prompt ───────────────────────────────────────────────
    summary_text = build_financial_summary(monthly_data, findings)
    ai_prompt = (
        summary_text
        + "\n\nBased on the financial data above, provide a clear, friendly analysis "
        "with practical recommendations for this SME owner."
    )

    # ── Step 3: AI explanation ────────────────────────────────────────────────
    ai_text, ai_error = get_ai_explanation(ai_prompt)
    if ai_error:
        ai_text = (
            f"⚠️ AI analysis is temporarily unavailable: {ai_error}\n\n"
            "The rule-based findings above are still accurate and actionable."
        )

    # ── Step 4: Persist result ────────────────────────────────────────────────
    period_start = (
        date_type(monthly_data[0]["year"], monthly_data[0]["month_num"], 1)
        if monthly_data else None
    )
    period_end = (
        date_type(monthly_data[-1]["year"], monthly_data[-1]["month_num"], 1)
        if monthly_data else None
    )

    result = GapAnalysisResult(
        user_id=user.id,
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
        }
    ), 200


@gap_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user = get_current_user()
    page = request.args.get("page", 1, type=int)

    paginated = (
        GapAnalysisResult.query.filter_by(user_id=user.id)
        .order_by(GapAnalysisResult.generated_at.desc())
        .paginate(page=page, per_page=10, error_out=False)
    )

    return jsonify(
        {
            "results": [r.to_dict() for r in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
        }
    ), 200


@gap_bp.route("/<int:result_id>", methods=["GET"])
@jwt_required()
def get_result(result_id):
    user = get_current_user()
    result = GapAnalysisResult.query.filter_by(
        id=result_id, user_id=user.id
    ).first()
    if not result:
        return jsonify({"error": "Analysis result not found."}), 404
    return jsonify({"result": result.to_dict()}), 200
