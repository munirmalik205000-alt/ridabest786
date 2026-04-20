"""
Test suite for Recharge Features (Iteration 4)
Tests: operators, circles, plans, preview, cashback rules, coin settings,
       admin user management (adjust-coins, block), recharge flow, admin stats
"""
import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_MOBILE = "9999999999"
ADMIN_PASSWORD = "Admin@123"


def random_mobile():
    return f"TEST_{random.randint(1000000, 9999999)}"


def random_string(length=4):
    return ''.join(random.choices(string.ascii_uppercase, k=length))


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "mobile": ADMIN_MOBILE,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def test_user(admin_token):
    """Create a test user with coins and e_wallet balance"""
    mobile = random_mobile()
    # Register user
    reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": f"TEST_User_{random_string()}",
        "mobile": mobile,
        "password": "Test@123",
        "referral_code": "ADMIN001"
    })
    assert reg_resp.status_code == 200, f"User registration failed: {reg_resp.text}"
    user_data = reg_resp.json()
    user_id = user_data["id"]
    user_token = user_data["access_token"]
    
    # Setup PIN
    pin_resp = requests.post(f"{BASE_URL}/api/auth/setup-pin", 
        headers={"Authorization": f"Bearer {user_token}"},
        json={"pin": "1234"})
    assert pin_resp.status_code == 200
    
    # Add coins via admin
    coins_resp = requests.post(f"{BASE_URL}/api/admin/users/adjust-coins",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"user_id": user_id, "delta": 500, "reason": "Test setup"})
    assert coins_resp.status_code == 200
    
    # Add e_wallet via fund request
    fund_resp = requests.post(f"{BASE_URL}/api/wallet/add-fund-request",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"amount": 1000})
    assert fund_resp.status_code == 200
    fund_req_id = fund_resp.json()["request_id"]
    
    # Approve fund request
    approve_resp = requests.post(f"{BASE_URL}/api/admin/approve-fund",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"request_id": fund_req_id, "status": "approved"})
    assert approve_resp.status_code == 200
    
    return {
        "id": user_id,
        "token": user_token,
        "mobile": mobile
    }


class TestRechargeOperators:
    """Tests for GET /api/recharge/operators"""
    
    def test_operators_returns_4_operators(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/operators",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "operators" in data
        assert len(data["operators"]) == 4
        
    def test_operators_have_required_fields(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/operators",
            headers={"Authorization": f"Bearer {admin_token}"})
        data = response.json()
        for op in data["operators"]:
            assert "code" in op
            assert "name" in op
            assert "color" in op
            assert "icon" in op
            
    def test_operators_include_expected_codes(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/operators",
            headers={"Authorization": f"Bearer {admin_token}"})
        data = response.json()
        codes = [op["code"] for op in data["operators"]]
        assert "AIRTEL" in codes
        assert "JIO" in codes
        assert "VI" in codes
        assert "BSNL" in codes


class TestRechargeCircles:
    """Tests for GET /api/recharge/circles"""
    
    def test_circles_returns_20_plus_circles(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/circles",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "circles" in data
        assert len(data["circles"]) >= 20
        
    def test_circles_include_major_cities(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/circles",
            headers={"Authorization": f"Bearer {admin_token}"})
        data = response.json()
        circles = data["circles"]
        assert "Mumbai" in circles
        assert "Delhi" in circles
        assert "Bengaluru" in circles


class TestRechargePlans:
    """Tests for GET /api/recharge/plans"""
    
    def test_plans_filter_by_operator(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/plans?operator=AIRTEL",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        for plan in data["plans"]:
            assert plan["operator"] == "AIRTEL"
            
    def test_plans_filter_by_category(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/plans?operator=AIRTEL&category=unlimited",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        for plan in data["plans"]:
            assert plan["category"] == "unlimited"
            
    def test_plans_have_required_fields(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/recharge/plans?operator=JIO",
            headers={"Authorization": f"Bearer {admin_token}"})
        data = response.json()
        for plan in data["plans"]:
            assert "_id" in plan
            assert "operator" in plan
            assert "category" in plan
            assert "price" in plan
            assert "validity" in plan


class TestRechargePreview:
    """Tests for POST /api/recharge/preview"""
    
    def test_preview_calculates_correctly(self, admin_token):
        response = requests.post(f"{BASE_URL}/api/recharge/preview",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"operator": "AIRTEL", "amount": 299, "coins_used": 50})
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 299.0
        assert "cashback" in data
        assert "coin_discount" in data
        assert "final_amount" in data
        assert "max_coins" in data
        # Verify calculation: final = amount - cashback - coin_discount
        expected_final = data["amount"] - data["cashback"] - data["coin_discount"]
        assert abs(data["final_amount"] - expected_final) < 0.01
        
    def test_preview_caps_coins_at_max(self, admin_token):
        response = requests.post(f"{BASE_URL}/api/recharge/preview",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"operator": "AIRTEL", "amount": 299, "coins_used": 100})
        assert response.status_code == 200
        data = response.json()
        assert data["coins_used"] <= data["max_coins"]


class TestCoinSettings:
    """Tests for /api/admin/coin-settings"""
    
    def test_set_coin_settings(self, admin_token):
        response = requests.post(f"{BASE_URL}/api/admin/coin-settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"coins_per_rupee": 10, "max_coins_per_recharge": 50, "enabled": True})
        assert response.status_code == 200
        assert response.json()["message"] == "Saved"
        
    def test_get_coin_settings(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/admin/coin-settings",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "coins_per_rupee" in data
        assert "max_coins_per_recharge" in data
        assert "enabled" in data


class TestCashbackRules:
    """Tests for /api/admin/cashback-rules"""
    
    def test_create_cashback_rule(self, admin_token):
        response = requests.post(f"{BASE_URL}/api/admin/cashback-rules",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "operator": "JIO",
                "type": "fixed",
                "value": 3,
                "min_amount": 50,
                "priority": 5
            })
        assert response.status_code == 200
        assert "id" in response.json()
        return response.json()["id"]
        
    def test_list_cashback_rules(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/admin/cashback-rules",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "rules" in data
        
    def test_delete_cashback_rule(self, admin_token):
        # Create a rule first
        create_resp = requests.post(f"{BASE_URL}/api/admin/cashback-rules",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "operator": "VI",
                "type": "percent",
                "value": 2,
                "min_amount": 100,
                "priority": 1
            })
        rule_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/cashback-rules/{rule_id}",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert delete_resp.status_code == 200
        assert delete_resp.json()["message"] == "Deleted"


class TestAdminRechargePlans:
    """Tests for /api/admin/recharge-plans CRUD"""
    
    def test_create_recharge_plan(self, admin_token):
        response = requests.post(f"{BASE_URL}/api/admin/recharge-plans",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "operator": "BSNL",
                "category": "data",
                "price": 77,
                "validity": "14 Days",
                "data": "10GB",
                "description": "TEST_Plan_Data"
            })
        assert response.status_code == 200
        assert "id" in response.json()
        return response.json()["id"]
        
    def test_list_admin_recharge_plans(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/admin/recharge-plans",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        
    def test_delete_recharge_plan(self, admin_token):
        # Create a plan first
        create_resp = requests.post(f"{BASE_URL}/api/admin/recharge-plans",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "operator": "BSNL",
                "category": "vouchers",
                "price": 33,
                "validity": "7 Days",
                "description": "TEST_Plan_Delete"
            })
        plan_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/recharge-plans/{plan_id}",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert delete_resp.status_code == 200
        assert delete_resp.json()["message"] == "Deleted"


class TestAdminUserManagement:
    """Tests for admin user management endpoints"""
    
    def test_adjust_coins_positive(self, admin_token, test_user):
        # Get current coins
        me_resp = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user['token']}"})
        initial_coins = me_resp.json()["coins"]
        
        # Add coins
        response = requests.post(f"{BASE_URL}/api/admin/users/adjust-coins",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "delta": 100, "reason": "Test bonus"})
        assert response.status_code == 200
        assert response.json()["coins"] == initial_coins + 100
        
    def test_adjust_coins_negative(self, admin_token, test_user):
        # Get current coins
        me_resp = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user['token']}"})
        initial_coins = me_resp.json()["coins"]
        
        # Deduct coins
        response = requests.post(f"{BASE_URL}/api/admin/users/adjust-coins",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "delta": -50, "reason": "Test debit"})
        assert response.status_code == 200
        assert response.json()["coins"] == initial_coins - 50
        
    def test_adjust_coins_caps_at_zero(self, admin_token, test_user):
        response = requests.post(f"{BASE_URL}/api/admin/users/adjust-coins",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "delta": -99999, "reason": "Test large debit"})
        assert response.status_code == 200
        assert response.json()["coins"] == 0
        
        # Restore coins for other tests
        requests.post(f"{BASE_URL}/api/admin/users/adjust-coins",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "delta": 500, "reason": "Restore"})
        
    def test_block_user(self, admin_token, test_user):
        response = requests.post(f"{BASE_URL}/api/admin/users/block",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "blocked": True})
        assert response.status_code == 200
        assert response.json()["message"] == "Updated"
        
    def test_blocked_user_cannot_recharge(self, admin_token, test_user):
        # Block user first
        requests.post(f"{BASE_URL}/api/admin/users/block",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "blocked": True})
        
        # Try to recharge
        response = requests.post(f"{BASE_URL}/api/recharge",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "recharge_type": "prepaid",
                "number": "9876543210",
                "operator": "AIRTEL",
                "amount": 199,
                "payment_mode": "e_wallet",
                "coins_used": 0
            })
        assert response.status_code == 403
        assert "blocked" in response.json()["detail"].lower()
        
        # Unblock user for other tests
        requests.post(f"{BASE_URL}/api/admin/users/block",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "blocked": False})
        
    def test_unblock_user(self, admin_token, test_user):
        response = requests.post(f"{BASE_URL}/api/admin/users/block",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "blocked": False})
        assert response.status_code == 200


class TestRechargeFlow:
    """Tests for POST /api/recharge"""
    
    def test_recharge_with_coins(self, admin_token, test_user):
        # Ensure user has coins and e_wallet
        requests.post(f"{BASE_URL}/api/admin/users/adjust-coins",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": test_user["id"], "delta": 500, "reason": "Test setup"})
        
        # Get initial balance
        me_resp = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user['token']}"})
        initial = me_resp.json()
        
        # Do recharge
        response = requests.post(f"{BASE_URL}/api/recharge",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "recharge_type": "prepaid",
                "number": "9876543210",
                "operator": "AIRTEL",
                "amount": 199,
                "payment_mode": "e_wallet",
                "coins_used": 20
            })
        assert response.status_code == 200
        data = response.json()
        assert "recharge_id" in data
        assert data["coins_used"] == 20
        assert "cashback" in data
        assert "coin_discount" in data
        assert "coins_earned" in data
        assert "final_amount" in data
        
    def test_recharge_exceeding_coin_balance_fails(self, test_user):
        response = requests.post(f"{BASE_URL}/api/recharge",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "recharge_type": "prepaid",
                "number": "9876543210",
                "operator": "AIRTEL",
                "amount": 199,
                "payment_mode": "e_wallet",
                "coins_used": 99999
            })
        assert response.status_code == 400
        
    def test_recharge_exceeding_max_coins_fails(self, test_user):
        response = requests.post(f"{BASE_URL}/api/recharge",
            headers={"Authorization": f"Bearer {test_user['token']}"},
            json={
                "recharge_type": "prepaid",
                "number": "9876543210",
                "operator": "AIRTEL",
                "amount": 199,
                "payment_mode": "e_wallet",
                "coins_used": 100  # max is 50
            })
        assert response.status_code == 400
        assert "50" in response.json()["detail"]


class TestAdminRechargeStats:
    """Tests for /api/admin/recharge-stats"""
    
    def test_recharge_stats_returns_expected_fields(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/admin/recharge-stats",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_recharge_amount" in data
        assert "total_cashback_given" in data
        assert "total_coins_used" in data
        assert "total_recharges" in data


class TestAdminRecharges:
    """Tests for /api/admin/recharges"""
    
    def test_admin_recharges_list(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/admin/recharges",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "recharges" in data
        
    def test_admin_recharges_have_user_info(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/admin/recharges",
            headers={"Authorization": f"Bearer {admin_token}"})
        data = response.json()
        if data["recharges"]:
            recharge = data["recharges"][0]
            assert "user_name" in recharge
            assert "user_mobile" in recharge


class TestExistingFlowsIntact:
    """Verify existing flows still work"""
    
    def test_login_still_works(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "mobile": ADMIN_MOBILE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
        
    def test_auth_me_still_works(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "mobile" in data
        assert "coins" in data
        
    def test_packages_still_work(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/packages",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
    def test_notifications_still_work(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
    def test_admin_users_still_work(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
