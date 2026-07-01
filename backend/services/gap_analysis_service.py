"""
Gap Analysis Service  (Enhanced)
=================================
Rule-based financial risk detection engine for SME financial health.

Rules implemented:
  R001 – High expense-to-income ratio (overspending vs income)
  R002 – Consecutive negative net months (cash flow instability)
  R003 – Single category dominates expenses (concentration risk)
  R004 – Zero income recorded in current month
  R005 – Expense growth > 20% month-over-month (rapid expense growth)
  R006 – Budget exceeded for any tracked category
  R007 – Low savings rate (< 10% of income)

Output includes:
  - findings: list of structured risk dicts
  - risk_score: integer 0-100 (0 = healthy, 100 = critical)
  - score_label: 'healthy' | 'low risk' | 'moderate risk' | 'high risk' | 'critical'
  - overall_health: 'good' | 'fair' | 'warning' | 'critical'
  - monthly_data: historical income/expense per month
  - analysis_period: human-readable date range string
"""

from datetime import datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, extract

from models import db
from models.transaction import Transaction
from models.category import Category


# ── Weights for risk scoring (must sum to 100) ─────────────────────────────────
# Each rule has a maximum contribution to the 0-100 score.
_RULE_WEIGHTS = {
    "R001": 25,   # High expense ratio / no income + expense
    "R002": 20,   # Consecutive monthly losses
    "R003": 15,   # Category concentration
    "R004": 15,   # Zero income
    "R005": 10,   # Rapid expense growth
    "R006": 10,   # Budget exceeded
    "R007": 5,    # Low savings rate
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _monthly_totals(user_id: int, month: int, year: int) -> tuple[float, float]:
    """Return (total_income, total_expense) for a given month/year."""
    rows = (
        db.session.query(Transaction.type, func.sum(Transaction.amount).label("total"))
        .filter(
            Transaction.user_id == user_id,
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
        )
        .group_by(Transaction.type)
        .all()
    )
    income = expense = 0.0
    for row in rows:
        if row.type == "income":
            income = float(row.total)
        elif row.type == "expense":
            expense = float(row.total)
    return income, expense


def _calc_risk_score(findings: list[dict]) -> int:
    """
    Calculate an overall risk score from 0 to 100.

    - Each triggered rule contributes its full weight.
    - High-severity rules contribute 100% of their weight.
    - Medium-severity rules contribute 60% of their weight.
    - Low-severity rules contribute 25% of their weight.
    - Score is capped at 100.
    """
    severity_multipliers = {"high": 1.0, "medium": 0.6, "low": 0.25}
    score = 0.0

    seen_rules = set()
    for finding in findings:
        rule_id = finding.get("rule_id", "")
        if rule_id in seen_rules:
            continue  # Don't double-count same rule
        seen_rules.add(rule_id)

        weight = _RULE_WEIGHTS.get(rule_id, 5)
        severity = finding.get("severity", "low")
        multiplier = severity_multipliers.get(severity, 0.25)
        score += weight * multiplier

    return min(100, round(score))


def _score_label(score: int) -> str:
    """Convert numeric score to human-readable label."""
    if score == 0:
        return "healthy"
    elif score <= 20:
        return "low risk"
    elif score <= 45:
        return "moderate risk"
    elif score <= 70:
        return "high risk"
    else:
        return "critical"


# ── Main analysis function ─────────────────────────────────────────────────────

def run_gap_analysis(user_id: int, months_back: int = 3) -> dict:
    """
    Run all seven rule-based checks and return structured results:

    {
        'findings':        list of finding dicts,
        'risk_score':      int 0-100,
        'score_label':     str,
        'overall_health':  'good' | 'fair' | 'warning' | 'critical',
        'monthly_data':    list of monthly summary dicts,
        'analysis_period': str,
    }
    """
    now = datetime.utcnow()
    findings: list[dict] = []

    # ── Collect monthly data ──────────────────────────────────────────────────
    monthly_data = []
    for i in range(months_back - 1, -1, -1):
        target = now - relativedelta(months=i)
        income, expense = _monthly_totals(user_id, target.month, target.year)
        monthly_data.append(
            {
                "month": target.strftime("%B %Y"),
                "month_num": target.month,
                "year": target.year,
                "income": income,
                "expense": expense,
                "net": income - expense,
            }
        )

    current = monthly_data[-1]

    # ── R001: High expense ratio ──────────────────────────────────────────────
    if current["income"] > 0:
        ratio = (current["expense"] / current["income"]) * 100
        if ratio >= 90:
            findings.append(
                {
                    "rule_id": "R001",
                    "title": "High Expense-to-Income Ratio",
                    "description": (
                        f"Your expenses are {ratio:.1f}% of your income this month "
                        f"({current['month']}). Very little remains for savings or "
                        "unexpected costs."
                    ),
                    "severity": "high" if ratio >= 100 else "medium",
                    "metric": f"{ratio:.1f}% expense ratio",
                    "recommendation": (
                        "Review your largest expense categories and identify where "
                        "costs can be reduced or deferred."
                    ),
                }
            )
    elif current["income"] == 0 and current["expense"] > 0:
        findings.append(
            {
                "rule_id": "R001",
                "title": "Expenses With No Income",
                "description": (
                    f"Expenses are recorded this month ({current['month']}) "
                    "but no income has been entered. This may signal a cash-flow gap."
                ),
                "severity": "high",
                "metric": "K 0 income vs non-zero expenses",
                "recommendation": (
                    "Check whether income transactions are missing, and review "
                    "upcoming payment obligations urgently."
                ),
            }
        )

    # ── R002: Consecutive negative months (cash flow instability) ─────────────
    streak = 0
    for m in monthly_data:
        has_data = m["income"] > 0 or m["expense"] > 0
        if has_data and m["net"] < 0:
            streak += 1
        else:
            streak = 0

    if streak >= 2:
        findings.append(
            {
                "rule_id": "R002",
                "title": "Cash Flow Instability — Consecutive Monthly Losses",
                "description": (
                    f"Your business has spent more than it earned for "
                    f"{streak} consecutive months. Sustained losses deplete "
                    "cash reserves quickly."
                ),
                "severity": "high",
                "metric": f"{streak} months of negative net balance",
                "recommendation": (
                    "Review pricing strategy, cut non-essential expenses, or "
                    "explore new revenue streams immediately."
                ),
            }
        )

    # ── R003: Single category concentration (high spending in one category) ──
    cat_rows = (
        db.session.query(
            Category.name,
            func.sum(Transaction.amount).label("total"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            extract("month", Transaction.date) == current["month_num"],
            extract("year", Transaction.date) == current["year"],
        )
        .group_by(Category.name)
        .all()
    )

    if cat_rows:
        total_expense = sum(float(r.total) for r in cat_rows)
        for row in cat_rows:
            pct = (float(row.total) / total_expense) * 100 if total_expense else 0
            if pct > 50:
                findings.append(
                    {
                        "rule_id": "R003",
                        "title": "High Spending in a Single Category",
                        "description": (
                            f'"{row.name}" accounts for {pct:.1f}% of your total '
                            f"expenses this month. High concentration creates "
                            "financial vulnerability."
                        ),
                        "severity": "medium",
                        "metric": f"{pct:.1f}% in '{row.name}'",
                        "recommendation": (
                            f"Review whether '{row.name}' expenses can be reduced, "
                            "renegotiated, or redistributed across other categories."
                        ),
                    }
                )

    # ── R004: Zero income ─────────────────────────────────────────────────────
    if current["income"] == 0:
        findings.append(
            {
                "rule_id": "R004",
                "title": "No Income Recorded This Month",
                "description": (
                    f"No income transactions have been recorded for "
                    f"{current['month']}. This could mean missing entries or an "
                    "actual revenue gap."
                ),
                "severity": "high" if current["expense"] > 0 else "medium",
                "metric": "K 0 income",
                "recommendation": (
                    "Verify that all income records are entered. If income is "
                    "genuinely zero, prioritise revenue-generating activities immediately."
                ),
            }
        )

    # ── R005: Rapid expense growth > 20% MoM ─────────────────────────────────
    if len(monthly_data) >= 2:
        prev = monthly_data[-2]
        curr = monthly_data[-1]
        if prev["expense"] > 0 and curr["expense"] > 0:
            growth = ((curr["expense"] - prev["expense"]) / prev["expense"]) * 100
            if growth > 20:
                findings.append(
                    {
                        "rule_id": "R005",
                        "title": "Rapid Expense Growth",
                        "description": (
                            f"Expenses increased by {growth:.1f}% from "
                            f"{prev['month']} to {curr['month']}. Rapid growth "
                            "can quickly erode profitability."
                        ),
                        "severity": "high" if growth > 50 else "medium",
                        "metric": f"{growth:.1f}% month-over-month increase",
                        "recommendation": (
                            "Identify which categories are driving the increase and "
                            "assess whether this growth is necessary or controllable."
                        ),
                    }
                )

    # ── R006: Budget exceeded ─────────────────────────────────────────────────
    try:
        from models.budget import Budget
        exceeded_budgets = []

        # Get all budgets for current month
        month_budgets = Budget.query.filter_by(
            user_id=user_id,
            month=current["month_num"],
            year=current["year"],
        ).all()

        for budget in month_budgets:
            total_spent = (
                db.session.query(func.sum(Transaction.amount))
                .filter(
                    Transaction.user_id == user_id,
                    Transaction.category_id == budget.category_id,
                    Transaction.type == "expense",
                    extract("month", Transaction.date) == current["month_num"],
                    extract("year", Transaction.date) == current["year"],
                )
                .scalar()
            ) or 0.0

            if float(total_spent) > float(budget.amount):
                overage = float(total_spent) - float(budget.amount)
                overage_pct = (overage / float(budget.amount)) * 100
                exceeded_budgets.append({
                    "category": budget.name or "Unknown",
                    "budget": float(budget.amount),
                    "spent": float(total_spent),
                    "overage": overage,
                    "overage_pct": overage_pct,
                })

        if exceeded_budgets:
            categories_str = ", ".join(
                f"'{b['category']}' (over by K{b['overage']:,.0f})"
                for b in exceeded_budgets
            )
            findings.append(
                {
                    "rule_id": "R006",
                    "title": "Budget Exceeded",
                    "description": (
                        f"You have exceeded your budget in {len(exceeded_budgets)} "
                        f"category/categories this month: {categories_str}."
                    ),
                    "severity": "high" if len(exceeded_budgets) > 1 else "medium",
                    "metric": f"{len(exceeded_budgets)} budgets exceeded",
                    "recommendation": (
                        "Review your spending in over-budget categories. Consider "
                        "reducing discretionary spending or adjusting budget limits "
                        "to reflect realistic spending patterns."
                    ),
                    "details": exceeded_budgets,
                }
            )
    except Exception:
        pass  # Budget model may not exist in all deployments; silently skip

    # ── R007: Low savings rate ────────────────────────────────────────────────
    if current["income"] > 0:
        savings_rate = ((current["income"] - current["expense"]) / current["income"]) * 100
        if savings_rate < 10:
            findings.append(
                {
                    "rule_id": "R007",
                    "title": "Low Savings Rate",
                    "description": (
                        f"Your savings rate this month is only {savings_rate:.1f}% "
                        f"({current['month']}). A healthy SME should aim to retain "
                        "at least 10% of income as savings or working capital."
                    ),
                    "severity": "medium" if savings_rate >= 0 else "high",
                    "metric": f"{savings_rate:.1f}% savings rate",
                    "recommendation": (
                        "Aim to reduce discretionary expenses. Even small reductions "
                        "across multiple categories can meaningfully improve your savings rate."
                    ),
                }
            )

    # ── Risk score calculation ────────────────────────────────────────────────
    risk_score = _calc_risk_score(findings)
    label = _score_label(risk_score)

    # ── Overall health determination ──────────────────────────────────────────
    high_count = sum(1 for f in findings if f["severity"] == "high")
    medium_count = sum(1 for f in findings if f["severity"] == "medium")

    if high_count >= 2:
        overall_health = "critical"
    elif high_count == 1 or medium_count >= 2:
        overall_health = "warning"
    elif medium_count == 1:
        overall_health = "fair"
    else:
        overall_health = "good"

    return {
        "findings": findings,
        "risk_score": risk_score,
        "score_label": label,
        "overall_health": overall_health,
        "monthly_data": monthly_data,
        "analysis_period": (
            f"{monthly_data[0]['month']} – {monthly_data[-1]['month']}"
            if monthly_data
            else "N/A"
        ),
    }


# ── AI prompt builder ──────────────────────────────────────────────────────────

def build_financial_summary(monthly_data: list, findings: list) -> str:
    """
    Build a structured, privacy-safe aggregated summary to send to OpenRouter.

    SECURITY: Uses only aggregated figures — never individual transaction details.
    This prevents raw data leakage to the AI model.
    """
    current = monthly_data[-1] if monthly_data else {}

    trend_lines = "\n".join(
        f"  • {m['month']}: Income K {m['income']:,.0f}  |  "
        f"Expense K {m['expense']:,.0f}  |  Net K {m['net']:,.0f}"
        for m in monthly_data
    )

    risk_lines = (
        "\n".join(
            f"  [{f['severity'].upper()}] {f['title']}: {f['description']}"
            for f in findings
        )
        if findings
        else "  • No significant risks detected."
    )

    return f"""
=== FinanceAI — Aggregated Financial Summary ===
Period: {monthly_data[0]['month'] if monthly_data else 'N/A'} to {monthly_data[-1]['month'] if monthly_data else 'N/A'}

Current Month ({current.get('month', 'N/A')}):
  • Total Income : K {current.get('income', 0):,.0f}
  • Total Expense: K {current.get('expense', 0):,.0f}
  • Net Balance  : K {current.get('net', 0):,.0f}
  • Savings Rate : {((current.get('income', 0) - current.get('expense', 0)) / current.get('income', 1) * 100) if current.get('income', 0) > 0 else 0:.1f}%

Monthly Trend:
{trend_lines}

Detected Risk Patterns:
{risk_lines}
""".strip()
