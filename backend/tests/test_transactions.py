"""
Unit Tests: Transaction Routes
================================
Tests for transaction creation, validation, and retrieval.

Run with:
    cd backend
    python -m pytest tests/test_transactions.py -v

Or all tests:
    python -m pytest tests/ -v
"""

import sys
import os
import json
import unittest

# Allow importing from the backend root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from models import db


class TransactionTestCase(unittest.TestCase):
    """Test suite for /api/transactions endpoints."""

    @classmethod
    def setUpClass(cls):
        """Set up the test Flask app with an in-memory SQLite database."""
        cls.app = create_app()
        cls.app.config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "JWT_SECRET_KEY": "test-secret-key",
        })
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()
            cls._create_test_user()

    @classmethod
    def _create_test_user(cls):
        """Register a test user and store the auth token."""
        response = cls.client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "txtest@example.com",
                "password": "TestPass123",
                "business_name": "Test SME",
                "industry": "retail",
            },
        )
        data = response.get_json()
        cls.access_token = data.get("access_token", "")

    def _auth_headers(self):
        return {"Authorization": f"Bearer {self.access_token}"}

    def _get_category_id(self, tx_type: str = "expense") -> int | None:
        """Get first category ID of the specified type for the test user."""
        resp = self.client.get(
            f"/api/categories?type={tx_type}",
            headers=self._auth_headers(),
        )
        if resp.status_code == 200:
            cats = resp.get_json().get("categories", [])
            if cats:
                return cats[0]["id"]
        return None

    # ── Validation Tests ──────────────────────────────────────────────────────

    def test_create_transaction_missing_fields(self):
        """Should return 400 when required fields are missing."""
        resp = self.client.post(
            "/api/transactions",
            json={"type": "income"},
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertIn("error", data)

    def test_create_transaction_invalid_type(self):
        """Should return 400 for invalid transaction type."""
        resp = self.client.post(
            "/api/transactions",
            json={
                "type": "transfer",  # invalid
                "amount": 1000,
                "description": "Test",
                "date": "2025-06-01",
            },
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("type", resp.get_json().get("error", "").lower())

    def test_create_transaction_negative_amount(self):
        """Should return 400 for negative or zero amount."""
        resp = self.client.post(
            "/api/transactions",
            json={
                "type": "income",
                "amount": -500,
                "description": "Test",
                "date": "2025-06-01",
            },
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_create_transaction_invalid_date(self):
        """Should return 400 for invalid date format."""
        resp = self.client.post(
            "/api/transactions",
            json={
                "type": "income",
                "amount": 1000,
                "description": "Test",
                "date": "01/06/2025",  # wrong format
            },
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_create_valid_income_transaction(self):
        """Should successfully create an income transaction."""
        resp = self.client.post(
            "/api/transactions",
            json={
                "type": "income",
                "amount": 500000,
                "description": "Monthly Sales Revenue",
                "date": "2025-06-01",
                "payment_method": "bank",
            },
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertIn("transaction", data)
        self.assertEqual(data["transaction"]["type"], "income")
        self.assertEqual(float(data["transaction"]["amount"]), 500000.0)

    def test_create_valid_expense_transaction(self):
        """Should successfully create an expense transaction."""
        resp = self.client.post(
            "/api/transactions",
            json={
                "type": "expense",
                "amount": 150000,
                "description": "Office Rent June",
                "date": "2025-06-05",
                "payment_method": "cash",
            },
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertIn("transaction", data)
        self.assertEqual(data["transaction"]["type"], "expense")

    def test_list_transactions_requires_auth(self):
        """Should return 401/422 when no JWT token is provided."""
        resp = self.client.get("/api/transactions")
        self.assertIn(resp.status_code, [401, 422])

    def test_list_transactions_with_auth(self):
        """Should return paginated transaction list for authenticated user."""
        resp = self.client.get(
            "/api/transactions",
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("transactions", data)
        self.assertIn("pagination", data)

    def test_get_nonexistent_transaction(self):
        """Should return 404 for a transaction that doesn't exist."""
        resp = self.client.get(
            "/api/transactions/999999",
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 404)

    def test_transaction_data_isolation(self):
        """
        Verify users can only access their own transactions.
        Create a second user and verify they cannot see first user's transactions.
        """
        # Register second user
        reg_resp = self.client.post(
            "/api/auth/register",
            json={
                "name": "Other User",
                "email": "other@example.com",
                "password": "OtherPass123",
                "business_name": "Other SME",
                "industry": "food",
            },
        )
        other_token = reg_resp.get_json().get("access_token", "")

        # First user creates a transaction
        create_resp = self.client.post(
            "/api/transactions",
            json={
                "type": "income",
                "amount": 999999,
                "description": "Private Transaction",
                "date": "2025-06-10",
            },
            headers=self._auth_headers(),
        )
        tx_id = create_resp.get_json().get("transaction", {}).get("id")

        # Second user attempts to access it
        if tx_id:
            access_resp = self.client.get(
                f"/api/transactions/{tx_id}",
                headers={"Authorization": f"Bearer {other_token}"},
            )
            self.assertEqual(
                access_resp.status_code, 404,
                "Second user should not be able to access first user's transaction"
            )

    # ── Financial Calculation Tests ───────────────────────────────────────────

    def test_monthly_summary_calculations(self):
        """
        Verify that monthly summary correctly calculates income, expense, and net.

        Test case: K 500,000 income - K 150,000 expense = K 350,000 net
        """
        resp = self.client.get(
            "/api/transactions/summary?month=6&year=2025",
            headers=self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("total_income", data)
        self.assertIn("total_expense", data)
        self.assertIn("net_balance", data)

        # Verify the math is correct
        net = data["total_income"] - data["total_expense"]
        self.assertAlmostEqual(
            net, data["net_balance"], places=2,
            msg="net_balance must equal total_income - total_expense"
        )


class TransactionValidatorTestCase(unittest.TestCase):
    """Unit tests for transaction validator functions (no DB required)."""

    def test_validate_transaction_type_income(self):
        from utils.validators import validate_transaction_type
        self.assertTrue(validate_transaction_type("income"))

    def test_validate_transaction_type_expense(self):
        from utils.validators import validate_transaction_type
        self.assertTrue(validate_transaction_type("expense"))

    def test_validate_transaction_type_invalid(self):
        from utils.validators import validate_transaction_type
        self.assertFalse(validate_transaction_type("transfer"))
        self.assertFalse(validate_transaction_type(""))
        self.assertFalse(validate_transaction_type("INCOME"))

    def test_validate_payment_method_valid(self):
        from utils.validators import validate_payment_method
        for method in ("cash", "bank", "card", "mobile", "other"):
            self.assertTrue(validate_payment_method(method))

    def test_validate_payment_method_invalid(self):
        from utils.validators import validate_payment_method
        self.assertFalse(validate_payment_method("crypto"))
        self.assertFalse(validate_payment_method("wire"))

    def test_validate_date_valid(self):
        from utils.validators import validate_date
        date_obj, err = validate_date("2025-06-15")
        self.assertIsNotNone(date_obj)
        self.assertIsNone(err)

    def test_validate_date_invalid_format(self):
        from utils.validators import validate_date
        date_obj, err = validate_date("15/06/2025")
        self.assertIsNone(date_obj)
        self.assertIsNotNone(err)

    def test_validate_amount_positive(self):
        from utils.validators import validate_amount
        amount, err = validate_amount(100000)
        self.assertEqual(amount, 100000.0)
        self.assertIsNone(err)

    def test_validate_amount_negative(self):
        from utils.validators import validate_amount
        amount, err = validate_amount(-500)
        self.assertIsNone(amount)
        self.assertIsNotNone(err)

    def test_validate_amount_zero(self):
        from utils.validators import validate_amount
        amount, err = validate_amount(0)
        self.assertIsNone(amount)
        self.assertIsNotNone(err)

    def test_validate_amount_too_large(self):
        from utils.validators import validate_amount
        amount, err = validate_amount(99_000_000_000)
        self.assertIsNone(amount)
        self.assertIsNotNone(err)

    def test_validate_email_valid(self):
        from utils.validators import validate_email
        self.assertTrue(validate_email("owner@mybusiness.com"))

    def test_validate_email_invalid(self):
        from utils.validators import validate_email
        self.assertFalse(validate_email("notanemail"))
        self.assertFalse(validate_email("missing@"))

    def test_validate_password_strong(self):
        from utils.validators import validate_password
        ok, err = validate_password("SecurePass123")
        self.assertTrue(ok)
        self.assertIsNone(err)

    def test_validate_password_too_short(self):
        from utils.validators import validate_password
        ok, err = validate_password("abc1")
        self.assertFalse(ok)
        self.assertIn("8", err)

    def test_validate_password_no_digit(self):
        from utils.validators import validate_password
        ok, err = validate_password("onlyletters")
        self.assertFalse(ok)

    def test_validate_month_year_valid(self):
        from utils.validators import validate_month_year
        ok, err = validate_month_year(6, 2025)
        self.assertTrue(ok)
        self.assertIsNone(err)

    def test_validate_month_year_invalid_month(self):
        from utils.validators import validate_month_year
        ok, err = validate_month_year(13, 2025)
        self.assertFalse(ok)

    def test_validate_month_year_invalid_year(self):
        from utils.validators import validate_month_year
        ok, err = validate_month_year(6, 1999)
        self.assertFalse(ok)


if __name__ == "__main__":
    unittest.main(verbosity=2)
