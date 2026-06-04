"""
Gap Analysis Service
====================
Runs five rule-based financial risk checks against the user's transaction history
and returns structured findings with severity levels (high / medium / low).

Rules:
  R001 – Expense ratio ≥ 90% of income (current month)
  R002 – Negative net balance for 2+ consecutive months
  R003 – Single expense category > 50% of total expenses (current month)
  R004 – Zero income recorded in current month
  R005 – Expense growth > 20% month-over-month
"""

from datetime import datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, extract

from models import db, Transaction
from models.category import Category


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


# ── Main analysis function ─────────────────────────────────────────────────────

def run_gap_analysis(user_id: int, months_back: int = 3) -> dict:
    """
    Run all five rule-based checks and return:
      {
        'findings':        list of finding dicts,
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
                "title": "Expenses Recorded With No Income",
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

    # ── R002: Consecutive negative months ────────────────────────────────────
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
                "title": "Consecutive Monthly Losses",
                "description": (
                    f"Your business has spent more than it earned for "
                    f"{streak} consecutive months. Sustained losses deplete "
                    "cash reserves quickly."
                ),
                "severity": "high",
                "metric": f"{streak} months of negative net balance",
                "recommendation": (
                    "Review pricing strategy, cut non-essential expenses, or "
                    "explore new revenue streams."
                ),
            }
        )

    # ── R003: Single category dominance ──────────────────────────────────────
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
                        "title": "Over-Reliance on a Single Expense Category",
                        "description": (
                            f'"{row.name}" accounts for {pct:.1f}% of your total '
                            f"expenses this month. High concentration creates "
                            "financial vulnerability."
                        ),
                        "severity": "medium",
                        "metric": f"{pct:.1f}% in {row.name}",
                        "recommendation": (
                            f"Review whether {row.name} expenses can be reduced, "
                            "renegotiated, or redistributed across categories."
                        ),
                    }
                )

    # ── R004: Zero income ────────────────────────────────────────────────────
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

    # ── R005: Expense growth > 20% MoM ───────────────────────────────────────
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

    # ── Determine overall health ──────────────────────────────────────────────
    high = sum(1 for f in findings if f["severity"] == "high")
    medium = sum(1 for f in findings if f["severity"] == "medium")

    if high >= 2:
        overall_health = "critical"
    elif high == 1 or medium >= 2:
        overall_health = "warning"
    elif medium == 1:
        overall_health = "fair"
    else:
        overall_health = "good"

    return {
        "findings": findings,
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
    Build a structured, privacy-safe summary to send to OpenRouter.
    Uses only aggregated figures — never individual transaction details.
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

Monthly Trend:
{trend_lines}

Detected Risk Patterns:
{risk_lines}
""".strip()
