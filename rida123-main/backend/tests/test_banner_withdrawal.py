"""
Backend API Tests for Banner and Withdrawal Features
Tests: Banner API, Text Banner, Image Banner, Withdrawal with PIN
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_MOBILE = "9999999999"
ADMIN_PASSWORD = "Admin@123"
ADMIN_PIN = "1234"


class TestBannerAPI:
    """Banner endpoint tests - GET /api/banner should return {text, color, images}"""
    
    def test_banner_get_returns_200(self):
        """GET /api/banner should return 200 - NO 404"""
        response = requests.get(f"{BASE_URL}/api/banner")
        print(f"Banner GET status: {response.status_code}")
        print(f"Banner response: {response.json()}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_banner_response_structure(self):
        """Banner response should have text, color, images fields"""
        response = requests.get(f"{BASE_URL}/api/banner")
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "text" in data, "Missing 'text' field in banner response"
        assert "color" in data, "Missing 'color' field in banner response"
        assert "images" in data, "Missing 'images' field in banner response"
        
        # Validate types
        assert isinstance(data["text"], str), "text should be string"
        assert isinstance(data["color"], str), "color should be string"
        assert isinstance(data["images"], list), "images should be list"
        
        print(f"Banner data: text='{data['text'][:50]}...', color='{data['color']}', images_count={len(data['images'])}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        print(f"Admin login status: {response.status_code}")
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert data.get("role") == "admin", f"Expected admin role, got {data.get('role')}"
        assert "name" in data
        print(f"Admin logged in: {data['name']}, role: {data['role']}")
        
        # Return cookies for subsequent tests
        return response.cookies
    
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": "WrongPassword"}
        )
        assert response.status_code == 401


class TestAdminBannerEndpoints:
    """Admin banner management endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_admin_update_text_banner(self, admin_session):
        """POST /api/admin/banner/text should update text banner"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/banner/text",
            json={
                "text": "TEST_Banner Text Updated",
                "color": "from-blue-600 via-indigo-600 to-purple-600"
            }
        )
        print(f"Update text banner status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify the update via GET
        get_response = requests.get(f"{BASE_URL}/api/banner")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["text"] == "TEST_Banner Text Updated"
        assert data["color"] == "from-blue-600 via-indigo-600 to-purple-600"
    
    def test_admin_update_image_banner(self, admin_session):
        """POST /api/admin/banner/image should update image banners"""
        test_images = [
            "https://example.com/banner1.jpg",
            "https://example.com/banner2.jpg"
        ]
        response = admin_session.post(
            f"{BASE_URL}/api/admin/banner/image",
            json={"images": test_images}
        )
        print(f"Update image banner status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify the update via GET
        get_response = requests.get(f"{BASE_URL}/api/banner")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["images"] == test_images
    
    def test_admin_update_combined_banner(self, admin_session):
        """POST /api/admin/banner (combined) should work for backward compat"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/banner",
            json={
                "text": "Combined Banner Update",
                "color": "from-emerald-600 via-teal-600 to-cyan-600",
                "images": ["https://example.com/combined.jpg"]
            }
        )
        print(f"Combined banner update status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_unauthenticated_banner_update_fails(self):
        """Banner update without auth should fail"""
        response = requests.post(
            f"{BASE_URL}/api/admin/banner/text",
            json={"text": "Unauthorized", "color": "red"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestWithdrawalAPI:
    """Withdrawal endpoint tests with PIN verification"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_withdrawal_requires_auth(self):
        """Withdrawal without auth should fail"""
        response = requests.post(
            f"{BASE_URL}/api/wallet/withdraw",
            json={"amount": 100, "pin": "1234"}
        )
        assert response.status_code == 401
    
    def test_withdrawal_requires_pin(self, admin_session):
        """Withdrawal without PIN should fail"""
        response = admin_session.post(
            f"{BASE_URL}/api/wallet/withdraw",
            json={"amount": 100}
        )
        # Should fail due to missing pin (validation error)
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
    
    def test_withdrawal_wrong_pin(self, admin_session):
        """Withdrawal with wrong PIN should fail"""
        response = admin_session.post(
            f"{BASE_URL}/api/wallet/withdraw",
            json={"amount": 100, "pin": "9999"}
        )
        print(f"Wrong PIN withdrawal status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 401, f"Expected 401 for wrong PIN, got {response.status_code}"
    
    def test_withdrawal_minimum_amount(self, admin_session):
        """Withdrawal below minimum should fail"""
        response = admin_session.post(
            f"{BASE_URL}/api/wallet/withdraw",
            json={"amount": 50, "pin": ADMIN_PIN}  # Below 100 minimum
        )
        print(f"Below minimum withdrawal status: {response.status_code}")
        assert response.status_code == 400
        data = response.json()
        assert "minimum" in data.get("detail", "").lower() or "100" in data.get("detail", "")
    
    def test_withdrawal_insufficient_balance(self, admin_session):
        """Withdrawal with insufficient balance should fail"""
        response = admin_session.post(
            f"{BASE_URL}/api/wallet/withdraw",
            json={
                "amount": 1000000,  # Very high amount
                "pin": ADMIN_PIN,
                "bank_name": "Test Bank",
                "account_number": "1234567890",
                "ifsc_code": "TEST0001234"
            }
        )
        print(f"Insufficient balance withdrawal status: {response.status_code}")
        assert response.status_code == 400
        data = response.json()
        assert "insufficient" in data.get("detail", "").lower()


class TestAdminWithdrawalsEndpoint:
    """Admin withdrawals management endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_get_withdrawals_list(self, admin_session):
        """GET /api/admin/withdrawals should list withdrawal requests"""
        response = admin_session.get(f"{BASE_URL}/api/admin/withdrawals")
        print(f"Get withdrawals status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "withdrawals" in data
        assert isinstance(data["withdrawals"], list)
        print(f"Found {len(data['withdrawals'])} withdrawal requests")
    
    def test_get_withdrawals_with_status_filter(self, admin_session):
        """GET /api/admin/withdrawals?status=pending should filter"""
        response = admin_session.get(f"{BASE_URL}/api/admin/withdrawals?status=pending")
        assert response.status_code == 200
        
        data = response.json()
        assert "withdrawals" in data
        # All returned should be pending
        for w in data["withdrawals"]:
            assert w.get("status") == "pending"
    
    def test_withdrawals_requires_admin(self):
        """Non-admin should not access withdrawals list"""
        response = requests.get(f"{BASE_URL}/api/admin/withdrawals")
        assert response.status_code == 401


class TestAdminDashboard:
    """Admin dashboard endpoint tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_admin_dashboard_access(self, admin_session):
        """Admin dashboard should be accessible"""
        response = admin_session.get(f"{BASE_URL}/api/admin/dashboard")
        print(f"Admin dashboard status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_users" in data
        assert "pending_funds" in data
        assert "total_recharges" in data
        print(f"Dashboard: users={data['total_users']}, pending_funds={data['pending_funds']}")


class TestDashboardStats:
    """User dashboard stats endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_dashboard_stats(self, admin_session):
        """GET /api/dashboard/stats should return user stats"""
        response = admin_session.get(f"{BASE_URL}/api/dashboard/stats")
        print(f"Dashboard stats status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["main_wallet", "e_wallet", "coins", "total_income", "today_income"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"Stats: main_wallet={data['main_wallet']}, e_wallet={data['e_wallet']}")


# Cleanup test data
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_banners():
    """Reset banner to default after tests"""
    yield
    # Cleanup: Reset banner text
    session = requests.Session()
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        session.post(
            f"{BASE_URL}/api/admin/banner/text",
            json={
                "text": "Earn Smart - Grow Fast - Achieve More",
                "color": "from-purple-600 via-pink-600 to-rose-600"
            }
        )
        session.post(
            f"{BASE_URL}/api/admin/banner/image",
            json={"images": []}
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
