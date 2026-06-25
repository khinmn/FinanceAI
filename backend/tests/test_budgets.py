"""
Unit Tests: Budget Routes & Calculations
==========================================
Tests for budget creation, validation, summary calculations,
and budget-vs-actual comparison logic.

Run with:
    cd backend
    python -m pytest tests/test_budgets.py -v
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from models import db


class BudgetValidatorTestCase(unittest.TestCase):
    """Pure unit tests for budget validation logic (no DB required)."""

    def test_month_year_valid_range(self):
        """Months 1-12 and years 2000-2100 should pass."""
        from utils.validators import validate_month_year
        for month in range(1, 13):
            ok, err = validate_month_year(month, 2025)
            self.assertTrue(ok, f"Month {month} should be valid")
            self.assertIsNone(err)

    def test_month_zero_invalid(self):
        from utils.validators import validate_month_year
        ok, _ = validate_month_year(0, 2025)
        self.assertFalse(ok)

    def test_month_thirteen_invalid(self):
        from utils.validators import validate_month_year
        ok, _ = validate_month_year(13, 2025)
        self.assertFalse(ok)

    def test_year_below_range_invalid(self):
        from utils.validators import validate_month_year
        ok, _ = validate_month_year(6, 1999)
        self.assertFalse(ok)

    def test_year_above_range_invalid(self):
        from utils.validators import validate_month_year
        ok, _ = validate_month_year(6, 2101)
        self.assertFalse(ok)

    def test_amount_positive(self):
        from utils.validators import validate_amount
        amount, err = validate_amount(1_000_000)
        self.assertEqual(amount, 1_000_000.0)
        self.assertIsNone(err)

    def test_amount_fractional(self):
        """Fractional kyat amounts should be accepted."""
        from utils.validators import validate_amount
        amount, err = validate_amount(1500.50)
        self.assertIsNotNone(amount)
        self.assertIsNone(err)

    def test_amount_string_numeric(self):
        """Numeric string should be coerced to float."""
        from utils.validators import validate_amount
        amount, err = validate_amount("250000")
        self.assertEqual(amount, 250000.0)
        self.assertIsNone(err)

    def test_amount_string_non_numeric(self):
        """Non-numeric string should fail."""
        from utils.validators import validate_amount
        amount, err = validate_amount("ten thousand")
        self.assertIsNone(amount)
        self.assertIsNotNone(err)


class BudgetCalculationTestCase(unittest.TestCase):
    """
    Tests for budget vs actual spending calculations.

    These tests verify the mathematical logic without needing a real database
    by using pure Python arithmetic that mirrors the backend queries.
    """

    # ── Test data: simulated budget and transaction records ───────────────────
    # Represents a June 2025 scenario:
    #   - Marketing budget: K 200,000, actual: K 250,000 (exceeded by K 50,000)
    #   - Rent budget: K 500,000, actual: K 500,000 (at limit)
    #   - Utilities budget: K 100,000, actual: K 80,000 (within budget)
    #   - Food budget: K 150,000, actual: K 0 (no spending)

    BUDGETS = [
        {"category_name": "Marketing", "budget_amount": 200_000, "actual_spent": 250_000},
        {"category_name": "Rent", "budget_amount": 500_000, "actual_spent": 500_000},
        {"category_name": "Utilities", "budget_amount": 100_000, "actual_spent": 80_000},
        {"category_name": "Food", "budget_amount": 150_000, "actual_spent": 0},
    ]

    def _enrich(self, budget_entries):
        """Compute remaining, is_exceeded, and return enriched records."""
        result = []
        for b in budget_entries:
            ba = b["budget_amount"]
            spent = b["actual_spent"]
            result.append({
                **b,
                "remaining": max(0.0, ba - spent),
                "is_exceeded": spent > ba if ba > 0 else False,
            })
        return result

    def test_exceeded_budget_detection(self):
        """Marketing should be flagged as exceeded."""
        enriched = self._enrich(self.BUDGETS)
        marketing = next(b for b in enriched if b["category_name"] == "Marketing")
        self.assertTrue(marketing["is_exceeded"])

    def test_at_limit_budget_not_exceeded(self):
        """Rent exactly at budget should NOT be flagged as exceeded."""
        enriched = self._enrich(self.BUDGETS)
        rent = next(b for b in enriched if b["category_name"] == "Rent")
        self.assertFalse(rent["is_exceeded"])

    def test_within_budget_not_exceeded(self):
        """Utilities under budget should not be exceeded."""
        enriched = self._enrich(self.BUDGETS)
        utilities = next(b for b in enriched if b["category_name"] == "Utilities")
        self.assertFalse(utilities["is_exceeded"])

    def test_remaining_amount_correct(self):
        """Remaining should be budget - spent, floored at 0."""
        enriched = self._enrich(self.BUDGETS)
        utilities = next(b for b in enriched if b["category_name"] == "Utilities")
        self.assertEqual(utilities["remaining"], 20_000)

    def test_exceeded_budget_remaining_is_zero(self):
        """When exceeded, remaining should be 0 (not negative)."""
        enriched = self._enrich(self.BUDGETS)
        marketing = next(b for b in enriched if b["category_name"] == "Marketing")
        self.assertEqual(marketing["remaining"], 0.0)

    def test_no_spending_budget_not_exceeded(self):
        """Budget with no spending should not be exceeded."""
        enriched = self._enrich(self.BUDGETS)
        food = next(b for b in enriched if b["category_name"] == "Food")
        self.assertFalse(food["is_exceeded"])
        self.assertEqual(food["remaining"], 150_000)

    def test_total_budgeted_sum(self):
        """Total budgeted should be sum of all category budgets."""
        enriched = self._enrich(self.BUDGETS)
        total = sum(b["budget_amount"] for b in enriched)
        self.assertEqual(total, 950_000)

    def test_total_spent_sum(self):
        """Total spent should be sum of all actual spending."""
        enriched = self._enrich(self.BUDGETS)
        total = sum(b["actual_spent"] for b in enriched)
        self.assertEqual(total, 830_000)

    def test_count_exceeded_budgets(self):
        """Only one category (Marketing) should be exceeded."""
        enriched = self._enrich(self.BUDGETS)
        exceeded = [b for b in enriched if b["is_exceeded"]]
        self.assertEqual(len(exceeded), 1)
        self.assertEqual(exceeded[0]["category_name"], "Marketing")

    # ── Additional edge cases ─────────────────────────────────────────────────

    def test_zero_budget_not_exceeded(self):
        """Category with K0 budget should not show as exceeded even if spent."""
        entries = [{"category_name": "Misc", "budget_amount": 0, "actual_spent": 50_000}]
        enriched = self._enrich(entries)
        self.assertFalse(enriched[0]["is_exceeded"])

    def test_large_amount_budget(self):
        """Should handle large Myanmar Kyat amounts correctly."""
        entries = [{"category_name": "Payroll", "budget_amount": 10_000_000, "actual_spent": 9_500_000}]
        enriched = self._enrich(entries)
        self.assertFalse(enriched[0]["is_exceeded"])
        self.assertEqual(enriched[0]["remaining"], 500_000)


class BudgetAPITestCase(unittest.TestCase):
    """Integration tests for /api/budgets endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "JWT_SECRET_KEY": "test-budget-key",
        })
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()
            resp = cls.client.post(
                "/api/auth/register",
                json={
                    "name": "Budget Tester",
                    "email": "budget@test.com",
                    "password": "TestBudget123",
                    "business_name": "Budget Test SME",
                    "industry": "retail",
                },
            )
            cls.token = resp.get_json().get("access_token", "")

    def _auth(self):
        return {"Authorization": f"Bearer {self.token}"}

    def _get_expense_category_id(self) -> int | None:
        resp = self.client.get("/api/categories?type=expense", headers=self._auth())
        cats = resp.get_json().get("categories", [])
        return cats[0]["id"] if cats else None

    def test_create_budget_missing_fields(self):
        """Should return 400 for incomplete budget creation."""
        resp = self.client.post(
            "/api/budgets",
            json={"amount": 100000},  # Missing category_id, month, year
            headers=self._auth(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_create_budget_invalid_amount(self):
        """Should return 400 for negative budget amount."""
        cat_id = self._get_expense_category_id()
        if not cat_id:
            self.skipTest("No expense category available")
        resp = self.client.post(
            "/api/budgets",
            json={"category_id": cat_id, "amount": -1000, "month": 6, "year": 2025},
            headers=self._auth(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_create_budget_invalid_month(self):
        """Should return 400 for month = 0."""
        cat_id = self._get_expense_category_id()
        if not cat_id:
            self.skipTest("No expense category available")
        resp = self.client.post(
            "/api/budgets",
            json={"category_id": cat_id, "amount": 100000, "month": 0, "year": 2025},
            headers=self._auth(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_create_valid_budget(self):
        """Should successfully create a budget."""
        cat_id = self._get_expense_category_id()
        if not cat_id:
            self.skipTest("No expense category available")
        resp = self.client.post(
            "/api/budgets",
            json={"category_id": cat_id, "amount": 500000, "month": 6, "year": 2025},
            headers=self._auth(),
        )
        self.assertIn(resp.status_code, [200, 201])
        data = resp.get_json()
        self.assertIn("budget", data)

    def test_budget_requires_auth(self):
        """Budget endpoints should require JWT authentication."""
        resp = self.client.get("/api/budgets")
        self.assertIn(resp.status_code, [401, 422])

    def test_get_budget_summary(self):
        """Budget summary endpoint should return structured data."""
        resp = self.client.get(
            "/api/budgets/summary?month=6&year=2025",
            headers=self._auth(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("summary", data)
        self.assertIn("total_budgeted", data)
        self.assertIn("total_spent", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
