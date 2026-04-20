"""
Backend regression tests for PIN setup/verify, Bill Payments, Recharge (PIN req),
Wallet PIN checks, and Firebase public config.
"""
import os
import time
import random
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend .env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].rstrip("/")
                    break
    except Exception:
        pass
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

API = f"{BASE_URL}/api"
ADMIN_MOBILE = "9999999999"
ADMIN_PASSWORD = "Admin@123"
ADMIN_PIN = "1234"


# ---------- Fixtures ----------

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _mk_mobile():
    return "7" + "".join(str(random.randint(0, 9)) for _ in range(9))


@pytest.fixture(scope="session")
def fresh_user():
    """Register a new user for testing setup-pin, recharge, bills."""
    mobile = _mk_mobile()
    payload = {"name": "TEST_User", "mobile": mobile, "password": "Test@123"}
    r = requests.post(f"{API}/auth/register", json=payload, timeout=15)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "token": data["access_token"],
        "id": data["id"],
        "mobile": mobile,
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


# ---------- Admin login ----------

class TestAdminAuth:
    def test_admin_login_returns_admin_role(self):
        r = requests.post(f"{API}/auth/login", json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "admin"
        assert data["mobile"] == ADMIN_MOBILE
        assert isinstance(data.get("access_token"), str) and len(data["access_token"]) > 0
        assert data.get("has_pin") is True


# ---------- Firebase config ----------

class TestFirebaseConfig:
    def test_firebase_public_config(self):
        r = requests.get(f"{API}/config/firebase", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "apiKey" in data and isinstance(data["apiKey"], str) and len(data["apiKey"]) > 0
        assert data.get("projectId") == "rida786"


# ---------- PIN setup/verify on fresh user ----------

class TestPinFlow:
    def test_setup_pin_requires_4_digits(self, fresh_user):
        r = requests.post(f"{API}/auth/setup-pin", json={"pin": "12"}, headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 400

    def test_setup_pin_success_and_me_reflects(self, fresh_user):
        r = requests.post(f"{API}/auth/setup-pin", json={"pin": "5678"}, headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("message")

        # Verify persisted via /auth/me
        me = requests.get(f"{API}/auth/me", headers=fresh_user["headers"], timeout=15)
        assert me.status_code == 200
        assert me.json().get("has_pin") is True

    def test_verify_pin_correct(self, fresh_user):
        r = requests.post(f"{API}/auth/verify-pin", json={"pin": "5678"}, headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 200
        assert "verified" in r.json().get("message", "").lower()

    def test_verify_pin_incorrect(self, fresh_user):
        r = requests.post(f"{API}/auth/verify-pin", json={"pin": "0000"}, headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 401


# ---------- Bills categories/billers ----------

class TestBills:
    EXPECTED_CATEGORIES = {
        "electricity", "water", "gas", "broadband", "landline", "dth",
        "insurance", "lpg", "credit_card", "fastag", "education", "municipal",
    }

    def test_bill_categories_requires_auth(self):
        r = requests.get(f"{API}/bills/categories", timeout=15)
        assert r.status_code in (401, 403)

    def test_bill_categories_returns_12(self, admin_headers):
        r = requests.get(f"{API}/bills/categories", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        cats = r.json()["categories"]
        assert len(cats) == 12
        codes = {c["code"] for c in cats}
        assert codes == self.EXPECTED_CATEGORIES
        for c in cats:
            assert "name" in c and "icon" in c and "color" in c

    @pytest.mark.parametrize("cat", ["electricity", "water", "gas", "broadband",
                                     "landline", "dth", "insurance", "lpg",
                                     "credit_card", "fastag", "education", "municipal"])
    def test_billers_per_category(self, admin_headers, cat):
        r = requests.get(f"{API}/bills/billers/{cat}", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["category"] == cat
        assert isinstance(data["billers"], list) and len(data["billers"]) >= 1
        for b in data["billers"]:
            assert "code" in b and "name" in b

    def test_pay_bill_without_pin_returns_422_or_401(self, fresh_user):
        # BillPaymentRequest requires pin -> missing pin => 422 pydantic error
        payload = {
            "biller_category": "electricity",
            "biller_code": "TATAPOWER",
            "biller_name": "Tata Power",
            "consumer_number": "1234567",
            "amount": 100,
            "payment_mode": "e_wallet",
        }
        r = requests.post(f"{API}/bills/pay", json=payload, headers=fresh_user["headers"], timeout=15)
        assert r.status_code in (401, 422)

    def test_pay_bill_with_invalid_pin_returns_401(self, fresh_user):
        payload = {
            "biller_category": "electricity",
            "biller_code": "TATAPOWER",
            "biller_name": "Tata Power",
            "consumer_number": "1234567",
            "amount": 100,
            "payment_mode": "e_wallet",
            "pin": "9999",
        }
        r = requests.post(f"{API}/bills/pay", json=payload, headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 401
        assert "pin" in r.text.lower()

    def test_pay_bill_negative_amount_rejected(self, fresh_user):
        payload = {
            "biller_category": "electricity",
            "biller_code": "TATAPOWER",
            "biller_name": "Tata Power",
            "consumer_number": "1234567",
            "amount": -10,
            "payment_mode": "e_wallet",
            "pin": "5678",
        }
        r = requests.post(f"{API}/bills/pay", json=payload, headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 400
        assert "positive" in r.text.lower()

    def test_pay_bill_insufficient_balance_with_valid_pin(self, fresh_user):
        # With valid PIN but 0 balance -> 400 Insufficient
        payload = {
            "biller_category": "water",
            "biller_code": "DJB",
            "biller_name": "Delhi Jal Board",
            "consumer_number": "W-555",
            "amount": 250,
            "payment_mode": "e_wallet",
            "pin": "5678",
        }
        r = requests.post(f"{API}/bills/pay", json=payload, headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 400
        assert "insufficient" in r.text.lower()

    def test_bills_history_empty_for_new_user(self, fresh_user):
        r = requests.get(f"{API}/bills/history", headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "bills" in data and isinstance(data["bills"], list)


# ---------- Admin bill payment success (admin has PIN 1234 but 0 balance; test needs funds) ----------
# Strategy: credit admin e_wallet via direct admin adjust endpoints if available, else skip success path.
# We at least confirm PIN validation path passes on admin (correct PIN, insufficient balance 400).

class TestBillsAdminPin:
    def test_admin_valid_pin_insufficient_balance(self, admin_headers):
        payload = {
            "biller_category": "gas",
            "biller_code": "IGL",
            "biller_name": "Indraprastha Gas",
            "consumer_number": "G-42",
            "amount": 999999,
            "payment_mode": "main_wallet",
            "pin": ADMIN_PIN,
        }
        r = requests.post(f"{API}/bills/pay", json=payload, headers=admin_headers, timeout=15)
        # Either insufficient balance (400) or success if admin has funds
        assert r.status_code in (200, 400)
        if r.status_code == 400:
            assert "insufficient" in r.text.lower()

    def test_admin_invalid_pin_401(self, admin_headers):
        payload = {
            "biller_category": "gas",
            "biller_code": "IGL",
            "biller_name": "Indraprastha Gas",
            "consumer_number": "G-42",
            "amount": 50,
            "payment_mode": "main_wallet",
            "pin": "0000",
        }
        r = requests.post(f"{API}/bills/pay", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 401


# ---------- Recharge PIN enforcement ----------

class TestRechargePin:
    def _base_payload(self, pin=None):
        p = {
            "recharge_type": "prepaid",
            "number": "9876543210",
            "operator": "Jio",
            "amount": 100,
            "payment_mode": "e_wallet",
        }
        if pin is not None:
            p["pin"] = pin
        return p

    def test_recharge_missing_pin_rejected(self, fresh_user):
        r = requests.post(f"{API}/recharge", json=self._base_payload(), headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 401

    def test_recharge_invalid_pin_401(self, fresh_user):
        r = requests.post(f"{API}/recharge", json=self._base_payload("0000"), headers=fresh_user["headers"], timeout=15)
        assert r.status_code == 401

    def test_recharge_valid_pin_insufficient_balance(self, fresh_user):
        r = requests.post(f"{API}/recharge", json=self._base_payload("5678"), headers=fresh_user["headers"], timeout=15)
        # Fresh user has 0 balance so we get 400 Insufficient (proves PIN accepted)
        assert r.status_code == 400
        assert "insufficient" in r.text.lower()


# ---------- Wallet endpoints PIN enforcement ----------

class TestWalletPin:
    def test_self_transfer_invalid_pin(self, fresh_user):
        r = requests.post(
            f"{API}/wallet/self-transfer",
            json={"amount": 10, "pin": "0000"},
            headers=fresh_user["headers"], timeout=15,
        )
        assert r.status_code == 401

    def test_user_transfer_invalid_pin(self, fresh_user):
        r = requests.post(
            f"{API}/wallet/user-transfer",
            json={"receiver_mobile": ADMIN_MOBILE, "amount": 10, "pin": "0000"},
            headers=fresh_user["headers"], timeout=15,
        )
        assert r.status_code == 401

    def test_withdraw_invalid_pin(self, fresh_user):
        r = requests.post(
            f"{API}/wallet/withdraw",
            json={
                "amount": 200,
                "pin": "0000",
                "method": "bank",
                "bank_name": "SBI",
                "account_number": "111222",
                "ifsc_code": "SBIN0001",
                "account_holder": "Test",
            },
            headers=fresh_user["headers"], timeout=15,
        )
        assert r.status_code == 401
