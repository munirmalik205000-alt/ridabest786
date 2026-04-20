"""
SmartPay360 Backend API Tests - Auth Token Response Changes (Iteration 3)
Tests: access_token in login/register response, Bearer token auth, cookie fallback
Focus: Verify auth changes for iframe/cross-site support don't break existing flows
"""
import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_MOBILE = "9999999999"
ADMIN_PASSWORD = "Admin@123"
ADMIN_PIN = "1234"
ADMIN_REFERRAL_CODE = "ADMIN001"


def generate_test_mobile():
    """Generate unique test mobile number"""
    return f"TEST{random.randint(1000000, 9999999)}"


def generate_test_name():
    """Generate unique test name"""
    return f"TEST_User_{''.join(random.choices(string.ascii_uppercase, k=4))}"


# ============ LOGIN ACCESS_TOKEN TESTS ============

class TestLoginAccessToken:
    """Verify POST /api/auth/login returns access_token in response body"""
    
    def test_login_returns_access_token_in_body(self):
        """POST /api/auth/login should return access_token field in JSON response"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        print(f"Login status: {response.status_code}")
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        print(f"Login response keys: {list(data.keys())}")
        
        # CRITICAL: access_token must be in response body (new requirement)
        assert "access_token" in data, f"access_token missing from login response! Keys: {list(data.keys())}"
        assert isinstance(data["access_token"], str), "access_token should be a string"
        assert len(data["access_token"]) > 50, f"access_token seems too short: {len(data['access_token'])} chars"
        
        # Verify other expected fields still present
        assert "id" in data, "id missing from login response"
        assert "name" in data, "name missing from login response"
        assert "mobile" in data, "mobile missing from login response"
        assert "role" in data, "role missing from login response"
        assert "has_pin" in data, "has_pin missing from login response"
        
        print(f"✓ Login returns access_token: {data['access_token'][:50]}...")
        print(f"✓ User: {data['name']}, role: {data['role']}")
    
    def test_login_still_sets_cookies(self):
        """POST /api/auth/login should still set cookies (for backward compatibility)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        
        # Cookies should still be set
        assert "access_token" in response.cookies, "access_token cookie not set"
        assert "refresh_token" in response.cookies, "refresh_token cookie not set"
        
        print(f"✓ Cookies set: access_token={response.cookies['access_token'][:30]}...")


# ============ REGISTER ACCESS_TOKEN TESTS ============

class TestRegisterAccessToken:
    """Verify POST /api/auth/register returns access_token in response body"""
    
    def test_register_returns_access_token_in_body(self):
        """POST /api/auth/register should return access_token field in JSON response"""
        test_mobile = generate_test_mobile()
        test_name = generate_test_name()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": test_name,
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        print(f"Register status: {response.status_code}")
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        print(f"Register response keys: {list(data.keys())}")
        
        # CRITICAL: access_token must be in response body (new requirement)
        assert "access_token" in data, f"access_token missing from register response! Keys: {list(data.keys())}"
        assert isinstance(data["access_token"], str), "access_token should be a string"
        assert len(data["access_token"]) > 50, f"access_token seems too short: {len(data['access_token'])} chars"
        
        # Verify other expected fields still present
        assert "id" in data, "id missing from register response"
        assert "name" in data, "name missing from register response"
        assert "mobile" in data, "mobile missing from register response"
        assert "role" in data, "role missing from register response"
        assert "referral_code" in data, "referral_code missing from register response"
        assert "has_pin" in data, "has_pin missing from register response"
        
        print(f"✓ Register returns access_token: {data['access_token'][:50]}...")
        print(f"✓ New user: {data['name']}, referral_code: {data['referral_code']}")
    
    def test_register_still_sets_cookies(self):
        """POST /api/auth/register should still set cookies (for backward compatibility)"""
        test_mobile = generate_test_mobile()
        test_name = generate_test_name()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": test_name,
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        assert response.status_code == 200
        
        # Cookies should still be set
        assert "access_token" in response.cookies, "access_token cookie not set on register"
        assert "refresh_token" in response.cookies, "refresh_token cookie not set on register"
        
        print(f"✓ Register sets cookies: access_token={response.cookies['access_token'][:30]}...")


# ============ BEARER TOKEN AUTH TESTS ============

class TestBearerTokenAuth:
    """Verify Authorization: Bearer <token> header works for all protected endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin access_token from login response body"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        token = response.json().get("access_token")
        assert token, "No access_token in login response"
        return token
    
    @pytest.fixture
    def user_token(self):
        """Create test user and get access_token from register response"""
        test_mobile = generate_test_mobile()
        test_name = generate_test_name()
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": test_name,
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        assert response.status_code == 200
        token = response.json().get("access_token")
        assert token, "No access_token in register response"
        return token
    
    def test_bearer_auth_me_endpoint(self, admin_token):
        """GET /api/auth/me works with Bearer token (no cookies)"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"GET /api/auth/me with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/auth/me: {response.text}"
        
        data = response.json()
        assert data.get("role") == "admin"
        assert data.get("mobile") == ADMIN_MOBILE
        print(f"✓ /api/auth/me works with Bearer token: {data['name']}")
    
    def test_bearer_auth_dashboard_stats(self, admin_token):
        """GET /api/dashboard/stats works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"GET /api/dashboard/stats with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/dashboard/stats: {response.text}"
        
        data = response.json()
        assert "main_wallet" in data
        assert "e_wallet" in data
        print(f"✓ /api/dashboard/stats works with Bearer token")
    
    def test_bearer_auth_wallet_balance(self, admin_token):
        """GET /api/wallet/balance works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/wallet/balance",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"GET /api/wallet/balance with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/wallet/balance: {response.text}"
        
        data = response.json()
        assert "main_wallet" in data
        assert "e_wallet" in data
        assert "coins" in data
        print(f"✓ /api/wallet/balance works with Bearer token")
    
    def test_bearer_auth_packages(self, user_token):
        """GET /api/packages works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/packages",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/packages with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/packages: {response.text}"
        
        data = response.json()
        assert "packages" in data
        assert len(data["packages"]) >= 6  # 6 default packages
        print(f"✓ /api/packages works with Bearer token: {len(data['packages'])} packages")
    
    def test_bearer_auth_my_packages(self, user_token):
        """GET /api/packages/my works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/packages/my",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/packages/my with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/packages/my: {response.text}"
        
        data = response.json()
        assert "packages" in data
        print(f"✓ /api/packages/my works with Bearer token")
    
    def test_bearer_auth_notifications(self, user_token):
        """GET /api/notifications works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/notifications with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/notifications: {response.text}"
        
        data = response.json()
        assert "notifications" in data
        assert "unread" in data
        print(f"✓ /api/notifications works with Bearer token")
    
    def test_bearer_auth_admin_users(self, admin_token):
        """GET /api/admin/users works with Bearer token (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"GET /api/admin/users with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/admin/users: {response.text}"
        
        data = response.json()
        assert "users" in data
        print(f"✓ /api/admin/users works with Bearer token: {len(data['users'])} users")
    
    def test_bearer_auth_admin_packages(self, admin_token):
        """GET /api/admin/packages works with Bearer token (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/packages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"GET /api/admin/packages with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/admin/packages: {response.text}"
        
        data = response.json()
        assert "packages" in data
        print(f"✓ /api/admin/packages works with Bearer token")
    
    def test_bearer_auth_admin_kyc(self, admin_token):
        """GET /api/admin/kyc works with Bearer token (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/kyc",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"GET /api/admin/kyc with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/admin/kyc: {response.text}"
        
        data = response.json()
        assert "users" in data
        print(f"✓ /api/admin/kyc works with Bearer token")
    
    def test_bearer_auth_profile(self, user_token):
        """GET /api/profile works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/profile with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/profile: {response.text}"
        
        data = response.json()
        assert "name" in data
        assert "mobile" in data
        print(f"✓ /api/profile works with Bearer token")
    
    def test_bearer_auth_transactions(self, user_token):
        """GET /api/transactions works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/transactions",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/transactions with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/transactions: {response.text}"
        
        data = response.json()
        assert "transactions" in data
        print(f"✓ /api/transactions works with Bearer token")
    
    def test_bearer_auth_referral_stats(self, user_token):
        """GET /api/referral/stats works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/referral/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/referral/stats with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/referral/stats: {response.text}"
        
        data = response.json()
        assert "referral_code" in data
        print(f"✓ /api/referral/stats works with Bearer token")
    
    def test_bearer_auth_withdrawals(self, user_token):
        """GET /api/wallet/withdrawals works with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/wallet/withdrawals",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"GET /api/wallet/withdrawals with Bearer: {response.status_code}")
        assert response.status_code == 200, f"Bearer auth failed for /api/wallet/withdrawals: {response.text}"
        
        data = response.json()
        assert "withdrawals" in data
        print(f"✓ /api/wallet/withdrawals works with Bearer token")


# ============ COOKIE AUTH FALLBACK TESTS ============

class TestCookieAuthFallback:
    """Verify cookie-based auth still works (backward compatibility)"""
    
    def test_cookie_auth_me_endpoint(self):
        """GET /api/auth/me works with cookie auth (no Bearer header)"""
        session = requests.Session()
        
        # Login to get cookies
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        assert "access_token" in session.cookies
        
        # Use session (cookies) without explicit Authorization header
        response = session.get(f"{BASE_URL}/api/auth/me")
        print(f"GET /api/auth/me with cookies: {response.status_code}")
        assert response.status_code == 200, f"Cookie auth failed for /api/auth/me: {response.text}"
        
        data = response.json()
        assert data.get("role") == "admin"
        print(f"✓ /api/auth/me works with cookie auth")
    
    def test_cookie_auth_dashboard_stats(self):
        """GET /api/dashboard/stats works with cookie auth"""
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        
        response = session.get(f"{BASE_URL}/api/dashboard/stats")
        print(f"GET /api/dashboard/stats with cookies: {response.status_code}")
        assert response.status_code == 200
        print(f"✓ /api/dashboard/stats works with cookie auth")
    
    def test_cookie_auth_packages(self):
        """GET /api/packages works with cookie auth"""
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        
        response = session.get(f"{BASE_URL}/api/packages")
        print(f"GET /api/packages with cookies: {response.status_code}")
        assert response.status_code == 200
        print(f"✓ /api/packages works with cookie auth")


# ============ LOGOUT TESTS ============

class TestLogout:
    """Verify logout still clears cookies"""
    
    def test_logout_clears_cookies(self):
        """POST /api/auth/logout returns 200 and clears cookies"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        assert "access_token" in session.cookies
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        print(f"Logout status: {logout_response.status_code}")
        assert logout_response.status_code == 200
        
        data = logout_response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower()
        print(f"✓ Logout returns 200: {data['message']}")
    
    def test_after_logout_auth_fails(self):
        """After logout, /api/auth/me should fail with 401"""
        session = requests.Session()
        
        # Login
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        
        # Verify auth works
        me_before = session.get(f"{BASE_URL}/api/auth/me")
        assert me_before.status_code == 200
        
        # Logout
        session.post(f"{BASE_URL}/api/auth/logout")
        
        # Auth should fail now (cookies cleared)
        me_after = session.get(f"{BASE_URL}/api/auth/me")
        print(f"GET /api/auth/me after logout: {me_after.status_code}")
        assert me_after.status_code == 401, f"Expected 401 after logout, got {me_after.status_code}"
        print(f"✓ Auth correctly fails after logout")


# ============ POST ENDPOINTS WITH BEARER TOKEN ============

class TestBearerTokenPostEndpoints:
    """Verify POST endpoints work with Bearer token auth"""
    
    @pytest.fixture
    def user_with_token_and_pin(self):
        """Create test user with PIN and return token"""
        test_mobile = generate_test_mobile()
        test_name = generate_test_name()
        
        # Register
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": test_name,
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        assert response.status_code == 200
        token = response.json().get("access_token")
        
        # Setup PIN using Bearer token
        pin_response = requests.post(
            f"{BASE_URL}/api/auth/setup-pin",
            json={"pin": "1234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pin_response.status_code == 200
        
        return {"token": token, "mobile": test_mobile, "name": test_name}
    
    def test_bearer_auth_setup_pin(self):
        """POST /api/auth/setup-pin works with Bearer token"""
        test_mobile = generate_test_mobile()
        
        # Register and get token
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        token = response.json().get("access_token")
        
        # Setup PIN with Bearer token
        pin_response = requests.post(
            f"{BASE_URL}/api/auth/setup-pin",
            json={"pin": "1234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"POST /api/auth/setup-pin with Bearer: {pin_response.status_code}")
        assert pin_response.status_code == 200
        print(f"✓ /api/auth/setup-pin works with Bearer token")
    
    def test_bearer_auth_verify_pin(self, user_with_token_and_pin):
        """POST /api/auth/verify-pin works with Bearer token"""
        token = user_with_token_and_pin["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-pin",
            json={"pin": "1234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"POST /api/auth/verify-pin with Bearer: {response.status_code}")
        assert response.status_code == 200
        print(f"✓ /api/auth/verify-pin works with Bearer token")
    
    def test_bearer_auth_add_fund_request(self, user_with_token_and_pin):
        """POST /api/wallet/add-fund-request works with Bearer token"""
        token = user_with_token_and_pin["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/wallet/add-fund-request",
            json={"amount": 500.0, "payment_method": "UPI"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"POST /api/wallet/add-fund-request with Bearer: {response.status_code}")
        assert response.status_code == 200
        assert "request_id" in response.json()
        print(f"✓ /api/wallet/add-fund-request works with Bearer token")
    
    def test_bearer_auth_notifications_read_all(self, user_with_token_and_pin):
        """POST /api/notifications/read-all works with Bearer token"""
        token = user_with_token_and_pin["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/notifications/read-all",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"POST /api/notifications/read-all with Bearer: {response.status_code}")
        assert response.status_code == 200
        print(f"✓ /api/notifications/read-all works with Bearer token")
    
    def test_bearer_auth_update_profile(self, user_with_token_and_pin):
        """PUT /api/profile works with Bearer token"""
        token = user_with_token_and_pin["token"]
        
        response = requests.put(
            f"{BASE_URL}/api/profile",
            json={"name": "Updated Name"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"PUT /api/profile with Bearer: {response.status_code}")
        assert response.status_code == 200
        print(f"✓ PUT /api/profile works with Bearer token")


# ============ ADMIN POST ENDPOINTS WITH BEARER TOKEN ============

class TestAdminBearerTokenEndpoints:
    """Verify admin POST endpoints work with Bearer token"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin access_token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        return response.json().get("access_token")
    
    def test_bearer_auth_admin_approve_fund(self, admin_token):
        """POST /api/admin/approve-fund works with Bearer token"""
        # First create a fund request
        test_mobile = generate_test_mobile()
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        user_token = reg_response.json().get("access_token")
        
        fund_response = requests.post(
            f"{BASE_URL}/api/wallet/add-fund-request",
            json={"amount": 100.0},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        request_id = fund_response.json().get("request_id")
        
        # Admin approves with Bearer token
        approve_response = requests.post(
            f"{BASE_URL}/api/admin/approve-fund",
            json={"request_id": request_id, "status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"POST /api/admin/approve-fund with Bearer: {approve_response.status_code}")
        assert approve_response.status_code == 200
        print(f"✓ /api/admin/approve-fund works with Bearer token")
    
    def test_bearer_auth_admin_kyc_decision(self, admin_token):
        """POST /api/admin/kyc/decision works with Bearer token"""
        # Create a test user
        test_mobile = generate_test_mobile()
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        user_id = reg_response.json().get("id")
        
        # Admin makes KYC decision with Bearer token
        decision_response = requests.post(
            f"{BASE_URL}/api/admin/kyc/decision",
            json={"user_id": user_id, "decision": "approved", "note": "Test approval"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"POST /api/admin/kyc/decision with Bearer: {decision_response.status_code}")
        assert decision_response.status_code == 200
        print(f"✓ /api/admin/kyc/decision works with Bearer token")
    
    def test_bearer_auth_admin_create_package(self, admin_token):
        """POST /api/admin/packages works with Bearer token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/packages",
            json={
                "name": f"TEST_Package_{random.randint(1000, 9999)}",
                "price": 100.0,
                "daily_income": 5.0,
                "duration_days": 10,
                "total_return": 150.0
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"POST /api/admin/packages with Bearer: {response.status_code}")
        assert response.status_code == 200
        print(f"✓ POST /api/admin/packages works with Bearer token")


# ============ EXISTING FLOWS STILL WORK ============

class TestExistingFlowsWithBearerToken:
    """Verify existing flows work with Bearer token auth"""
    
    def test_full_package_buy_flow_with_bearer(self):
        """Complete package buy flow using only Bearer token auth"""
        # 1. Register and get token
        test_mobile = generate_test_mobile()
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        assert reg_response.status_code == 200
        user_token = reg_response.json().get("access_token")
        assert user_token, "No access_token in register response"
        
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # 2. Setup PIN
        pin_response = requests.post(
            f"{BASE_URL}/api/auth/setup-pin",
            json={"pin": "1234"},
            headers=headers
        )
        assert pin_response.status_code == 200
        
        # 3. Create fund request
        fund_response = requests.post(
            f"{BASE_URL}/api/wallet/add-fund-request",
            json={"amount": 600.0},
            headers=headers
        )
        assert fund_response.status_code == 200
        request_id = fund_response.json().get("request_id")
        
        # 4. Admin approves (using Bearer token)
        admin_login = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        admin_token = admin_login.json().get("access_token")
        
        approve_response = requests.post(
            f"{BASE_URL}/api/admin/approve-fund",
            json={"request_id": request_id, "status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert approve_response.status_code == 200
        
        # 5. Check balance
        balance_response = requests.get(
            f"{BASE_URL}/api/wallet/balance",
            headers=headers
        )
        assert balance_response.status_code == 200
        assert balance_response.json()["e_wallet"] >= 600.0
        
        # 6. Get packages
        pkg_response = requests.get(
            f"{BASE_URL}/api/packages",
            headers=headers
        )
        assert pkg_response.status_code == 200
        packages = pkg_response.json()["packages"]
        starter = next((p for p in packages if p["name"] == "Starter"), None)
        assert starter
        
        # 7. Buy package
        buy_response = requests.post(
            f"{BASE_URL}/api/packages/buy",
            json={"package_id": starter["_id"], "pin": "1234"},
            headers=headers
        )
        print(f"Package buy with Bearer: {buy_response.status_code}")
        assert buy_response.status_code == 200
        
        # 8. Verify my packages
        my_pkg_response = requests.get(
            f"{BASE_URL}/api/packages/my",
            headers=headers
        )
        assert my_pkg_response.status_code == 200
        my_packages = my_pkg_response.json()["packages"]
        assert len(my_packages) >= 1
        assert my_packages[0]["package_name"] == "Starter"
        
        print(f"✓ Full package buy flow works with Bearer token auth")
    
    def test_user_transfer_flow_with_bearer(self):
        """User transfer flow using only Bearer token auth"""
        # Create sender
        sender_mobile = generate_test_mobile()
        sender_reg = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": sender_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        sender_token = sender_reg.json().get("access_token")
        sender_headers = {"Authorization": f"Bearer {sender_token}"}
        
        # Setup sender PIN
        requests.post(
            f"{BASE_URL}/api/auth/setup-pin",
            json={"pin": "1234"},
            headers=sender_headers
        )
        
        # Create receiver
        receiver_mobile = generate_test_mobile()
        receiver_reg = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": receiver_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        receiver_token = receiver_reg.json().get("access_token")
        receiver_headers = {"Authorization": f"Bearer {receiver_token}"}
        
        # Fund sender
        fund_response = requests.post(
            f"{BASE_URL}/api/wallet/add-fund-request",
            json={"amount": 200.0},
            headers=sender_headers
        )
        request_id = fund_response.json().get("request_id")
        
        # Admin approves
        admin_login = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        admin_token = admin_login.json().get("access_token")
        requests.post(
            f"{BASE_URL}/api/admin/approve-fund",
            json={"request_id": request_id, "status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Transfer
        transfer_response = requests.post(
            f"{BASE_URL}/api/wallet/user-transfer",
            json={
                "receiver_mobile": receiver_mobile,
                "amount": 50.0,
                "pin": "1234"
            },
            headers=sender_headers
        )
        print(f"User transfer with Bearer: {transfer_response.status_code}")
        assert transfer_response.status_code == 200
        
        # Verify balances
        sender_balance = requests.get(
            f"{BASE_URL}/api/wallet/balance",
            headers=sender_headers
        ).json()
        assert sender_balance["e_wallet"] == 150.0
        
        receiver_balance = requests.get(
            f"{BASE_URL}/api/wallet/balance",
            headers=receiver_headers
        ).json()
        assert receiver_balance["e_wallet"] == 50.0
        
        print(f"✓ User transfer flow works with Bearer token auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
