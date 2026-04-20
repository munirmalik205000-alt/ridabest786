"""
Admin Packages & KYC Management API Tests - Iteration 2
Tests: Admin Packages CRUD (list all, toggle active, delete), Admin KYC (list, decision)
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


# ============ ADMIN PACKAGES TESTS ============

class TestAdminPackagesList:
    """GET /api/admin/packages - returns ALL packages including inactive"""
    
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
    
    def test_admin_packages_requires_admin(self):
        """GET /api/admin/packages without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/packages")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_packages_non_admin_returns_403(self):
        """GET /api/admin/packages with non-admin user returns 403"""
        # Create a regular user
        test_mobile = generate_test_mobile()
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        
        response = session.get(f"{BASE_URL}/api/admin/packages")
        print(f"Non-admin access status: {response.status_code}")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_admin_packages_returns_all_with_correct_fields(self, admin_session):
        """GET /api/admin/packages returns all packages with _id, name, price, daily_income, duration_days, total_return, badge, color, active"""
        response = admin_session.get(f"{BASE_URL}/api/admin/packages")
        print(f"Admin packages list status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "packages" in data, "Missing 'packages' field"
        packages = data["packages"]
        
        # Should have at least 6 default packages
        assert len(packages) >= 6, f"Expected at least 6 packages, got {len(packages)}"
        
        # Validate each package has ALL required fields including 'active'
        required_fields = ["_id", "name", "price", "daily_income", "duration_days", "total_return", "color", "active"]
        for pkg in packages:
            for field in required_fields:
                assert field in pkg, f"Package missing field '{field}': {pkg}"
            
            # Validate types
            assert isinstance(pkg["_id"], str), f"_id should be string"
            assert isinstance(pkg["name"], str), f"name should be string"
            assert isinstance(pkg["price"], (int, float)), f"price should be number"
            assert isinstance(pkg["daily_income"], (int, float)), f"daily_income should be number"
            assert isinstance(pkg["duration_days"], int), f"duration_days should be int"
            assert isinstance(pkg["total_return"], (int, float)), f"total_return should be number"
            assert isinstance(pkg["active"], bool), f"active should be boolean"
            # badge can be None
        
        print(f"Found {len(packages)} packages with all required fields")
        for pkg in packages:
            print(f"  - {pkg['name']}: price={pkg['price']}, active={pkg['active']}")


class TestAdminPackagesToggle:
    """POST /api/admin/packages/toggle - activate/deactivate packages"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_toggle_requires_admin(self):
        """POST /api/admin/packages/toggle without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/packages/toggle",
            json={"package_id": "test", "active": False}
        )
        assert response.status_code == 401
    
    def test_toggle_deactivate_package(self, admin_session):
        """POST /api/admin/packages/toggle with active=false deactivates package"""
        # Get a package to toggle
        packages_response = admin_session.get(f"{BASE_URL}/api/admin/packages")
        packages = packages_response.json()["packages"]
        
        # Find an active package (preferably not Starter to avoid breaking other tests)
        target_pkg = next((p for p in packages if p["active"] and p["name"] != "Starter"), None)
        if not target_pkg:
            target_pkg = packages[0]  # Fallback to first package
        
        package_id = target_pkg["_id"]
        package_name = target_pkg["name"]
        print(f"Deactivating package: {package_name} (id={package_id})")
        
        # Deactivate
        toggle_response = admin_session.post(
            f"{BASE_URL}/api/admin/packages/toggle",
            json={"package_id": package_id, "active": False}
        )
        print(f"Toggle deactivate status: {toggle_response.status_code}")
        assert toggle_response.status_code == 200, f"Expected 200, got {toggle_response.status_code}: {toggle_response.text}"
        
        # Verify via admin endpoint (should still show but with active=false)
        verify_admin = admin_session.get(f"{BASE_URL}/api/admin/packages")
        admin_packages = verify_admin.json()["packages"]
        deactivated = next((p for p in admin_packages if p["_id"] == package_id), None)
        assert deactivated is not None, "Package should still exist in admin list"
        assert deactivated["active"] == False, f"Package should be inactive, got active={deactivated['active']}"
        print(f"Verified: {package_name} is now inactive in admin list")
        
        # Verify via user endpoint (should NOT show inactive packages)
        user_packages_response = admin_session.get(f"{BASE_URL}/api/packages")
        user_packages = user_packages_response.json()["packages"]
        user_pkg = next((p for p in user_packages if p["_id"] == package_id), None)
        assert user_pkg is None, f"Inactive package should NOT appear in user packages list"
        print(f"Verified: {package_name} does NOT appear in user packages list")
        
        # Re-activate for cleanup
        admin_session.post(
            f"{BASE_URL}/api/admin/packages/toggle",
            json={"package_id": package_id, "active": True}
        )
        print(f"Cleanup: Re-activated {package_name}")
    
    def test_toggle_reactivate_package(self, admin_session):
        """POST /api/admin/packages/toggle with active=true re-activates package"""
        # Get a package and deactivate it first
        packages_response = admin_session.get(f"{BASE_URL}/api/admin/packages")
        packages = packages_response.json()["packages"]
        target_pkg = next((p for p in packages if p["name"] == "Silver"), packages[1])
        package_id = target_pkg["_id"]
        package_name = target_pkg["name"]
        
        # Deactivate first
        admin_session.post(
            f"{BASE_URL}/api/admin/packages/toggle",
            json={"package_id": package_id, "active": False}
        )
        
        # Verify deactivated
        verify1 = admin_session.get(f"{BASE_URL}/api/admin/packages")
        pkg1 = next((p for p in verify1.json()["packages"] if p["_id"] == package_id), None)
        assert pkg1["active"] == False, "Package should be inactive"
        print(f"Confirmed {package_name} is inactive")
        
        # Re-activate
        toggle_response = admin_session.post(
            f"{BASE_URL}/api/admin/packages/toggle",
            json={"package_id": package_id, "active": True}
        )
        print(f"Toggle reactivate status: {toggle_response.status_code}")
        assert toggle_response.status_code == 200
        
        # Verify re-activated
        verify2 = admin_session.get(f"{BASE_URL}/api/admin/packages")
        pkg2 = next((p for p in verify2.json()["packages"] if p["_id"] == package_id), None)
        assert pkg2["active"] == True, f"Package should be active, got active={pkg2['active']}"
        print(f"Verified: {package_name} is now active again")
        
        # Verify appears in user list
        user_packages = admin_session.get(f"{BASE_URL}/api/packages").json()["packages"]
        user_pkg = next((p for p in user_packages if p["_id"] == package_id), None)
        assert user_pkg is not None, f"Re-activated package should appear in user packages list"
        print(f"Verified: {package_name} appears in user packages list")
    
    def test_toggle_invalid_package_id(self, admin_session):
        """POST /api/admin/packages/toggle with invalid package_id returns 404"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/packages/toggle",
            json={"package_id": "000000000000000000000000", "active": False}
        )
        print(f"Toggle invalid ID status: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestAdminPackagesDelete:
    """DELETE /api/admin/packages/{id} - delete a package"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_delete_requires_admin(self):
        """DELETE /api/admin/packages/{id} without auth returns 401"""
        response = requests.delete(f"{BASE_URL}/api/admin/packages/test123")
        assert response.status_code == 401
    
    def test_delete_package_flow(self, admin_session):
        """Create a test package, delete it, verify 404 on second delete"""
        # 1. Create a test package
        create_response = admin_session.post(
            f"{BASE_URL}/api/admin/packages",
            json={
                "name": "TEST_DeleteMe",
                "price": 999.0,
                "daily_income": 50.0,
                "duration_days": 10,
                "total_return": 500.0,
                "badge": "Test",
                "color": "from-red-500 to-red-700"
            }
        )
        print(f"Create test package status: {create_response.status_code}")
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        create_data = create_response.json()
        assert "id" in create_data, "Missing 'id' in create response"
        package_id = create_data["id"]
        print(f"Created test package with id: {package_id}")
        
        # 2. Verify it exists in admin list
        verify1 = admin_session.get(f"{BASE_URL}/api/admin/packages")
        packages1 = verify1.json()["packages"]
        test_pkg = next((p for p in packages1 if p["_id"] == package_id), None)
        assert test_pkg is not None, "Test package should exist"
        assert test_pkg["name"] == "TEST_DeleteMe"
        print(f"Verified test package exists: {test_pkg['name']}")
        
        # 3. Delete the package
        delete_response = admin_session.delete(f"{BASE_URL}/api/admin/packages/{package_id}")
        print(f"Delete package status: {delete_response.status_code}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # 4. Verify it no longer exists
        verify2 = admin_session.get(f"{BASE_URL}/api/admin/packages")
        packages2 = verify2.json()["packages"]
        deleted_pkg = next((p for p in packages2 if p["_id"] == package_id), None)
        assert deleted_pkg is None, "Deleted package should not exist"
        print(f"Verified: Package deleted successfully")
        
        # 5. Second delete should return 404
        delete2_response = admin_session.delete(f"{BASE_URL}/api/admin/packages/{package_id}")
        print(f"Second delete status: {delete2_response.status_code}")
        assert delete2_response.status_code == 404, f"Expected 404 on second delete, got {delete2_response.status_code}"
        print(f"Verified: Second delete returns 404")
    
    def test_delete_invalid_id(self, admin_session):
        """DELETE /api/admin/packages/{invalid_id} returns 404"""
        response = admin_session.delete(f"{BASE_URL}/api/admin/packages/000000000000000000000000")
        print(f"Delete invalid ID status: {response.status_code}")
        assert response.status_code == 404


class TestAdminPackagesCreate:
    """POST /api/admin/packages - create new package (admin-only)"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_create_requires_admin(self):
        """POST /api/admin/packages without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/packages",
            json={
                "name": "Test",
                "price": 100.0,
                "daily_income": 10.0,
                "duration_days": 10,
                "total_return": 100.0
            }
        )
        assert response.status_code == 401
    
    def test_create_non_admin_returns_403(self):
        """POST /api/admin/packages with non-admin user returns 403"""
        # Create a regular user
        test_mobile = generate_test_mobile()
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        
        response = session.post(
            f"{BASE_URL}/api/admin/packages",
            json={
                "name": "Test",
                "price": 100.0,
                "daily_income": 10.0,
                "duration_days": 10,
                "total_return": 100.0
            }
        )
        print(f"Non-admin create status: {response.status_code}")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_create_package_success(self, admin_session):
        """POST /api/admin/packages creates package successfully"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/packages",
            json={
                "name": "TEST_NewPackage",
                "price": 777.0,
                "daily_income": 35.0,
                "duration_days": 15,
                "total_return": 525.0,
                "badge": "New",
                "color": "from-green-500 to-green-700"
            }
        )
        print(f"Create package status: {response.status_code}")
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing 'id' in response"
        assert data.get("message") == "Package created"
        package_id = data["id"]
        print(f"Created package with id: {package_id}")
        
        # Verify in admin list
        verify = admin_session.get(f"{BASE_URL}/api/admin/packages")
        packages = verify.json()["packages"]
        new_pkg = next((p for p in packages if p["_id"] == package_id), None)
        assert new_pkg is not None, "New package should exist"
        assert new_pkg["name"] == "TEST_NewPackage"
        assert new_pkg["price"] == 777.0
        assert new_pkg["active"] == True  # Should be active by default
        print(f"Verified new package: {new_pkg['name']}, active={new_pkg['active']}")
        
        # Cleanup: delete the test package
        admin_session.delete(f"{BASE_URL}/api/admin/packages/{package_id}")
        print(f"Cleanup: Deleted test package")


# ============ ADMIN KYC TESTS ============

class TestAdminKYCList:
    """GET /api/admin/kyc - list users with KYC fields"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_kyc_list_requires_admin(self):
        """GET /api/admin/kyc without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/admin/kyc")
        assert response.status_code == 401
    
    def test_kyc_list_non_admin_returns_403(self):
        """GET /api/admin/kyc with non-admin user returns 403"""
        test_mobile = generate_test_mobile()
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        
        response = session.get(f"{BASE_URL}/api/admin/kyc")
        print(f"Non-admin KYC list status: {response.status_code}")
        assert response.status_code == 403
    
    def test_kyc_list_returns_users(self, admin_session):
        """GET /api/admin/kyc returns users list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/kyc")
        print(f"KYC list status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data, "Missing 'users' field"
        assert isinstance(data["users"], list)
        
        # Validate user structure (should have KYC-related fields)
        for user in data["users"]:
            assert "_id" in user, "User missing _id"
            assert "name" in user, "User missing name"
            assert "mobile" in user, "User missing mobile"
            # KYC fields may or may not be present
            # kyc_aadhaar, kyc_pan, kyc_status, kyc_note, kyc_updated_at
        
        print(f"Found {len(data['users'])} users in KYC list")
    
    def test_kyc_list_pending_filter(self, admin_session):
        """GET /api/admin/kyc?status=pending filters correctly"""
        # First create a user with KYC data
        test_mobile = generate_test_mobile()
        user_session = requests.Session()
        user_session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        
        # Upload KYC (this sets kyc_aadhaar or kyc_pan)
        # Using the profile/upload-kyc endpoint
        user_session.post(
            f"{BASE_URL}/api/profile/upload-kyc",
            data={"type": "aadhaar"},
            files={"file": ("test.jpg", b"fake image data", "image/jpeg")}
        )
        
        # Now check pending filter
        response = admin_session.get(f"{BASE_URL}/api/admin/kyc?status=pending")
        print(f"KYC pending filter status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data
        
        # All returned users should have pending KYC (or no kyc_status)
        for user in data["users"]:
            kyc_status = user.get("kyc_status")
            # Should be None or "pending"
            assert kyc_status in [None, "pending"], f"User {user['mobile']} has kyc_status={kyc_status}, expected pending/None"
        
        print(f"Found {len(data['users'])} users with pending KYC")


class TestAdminKYCDecision:
    """POST /api/admin/kyc/decision - approve/reject KYC"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def test_user_with_kyc(self, admin_session):
        """Create a test user with KYC data"""
        test_mobile = generate_test_mobile()
        test_name = generate_test_name()
        
        user_session = requests.Session()
        register_response = user_session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": test_name,
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        user_id = register_response.json()["id"]
        
        # Upload KYC
        user_session.post(
            f"{BASE_URL}/api/profile/upload-kyc",
            data={"type": "aadhaar"},
            files={"file": ("test.jpg", b"fake image data", "image/jpeg")}
        )
        
        return {"user_id": user_id, "mobile": test_mobile, "name": test_name, "session": user_session}
    
    def test_kyc_decision_requires_admin(self):
        """POST /api/admin/kyc/decision without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/kyc/decision",
            json={"user_id": "test", "decision": "approved"}
        )
        assert response.status_code == 401
    
    def test_kyc_decision_approve(self, admin_session, test_user_with_kyc):
        """POST /api/admin/kyc/decision with decision='approved' sets kyc_status and creates notification"""
        user_id = test_user_with_kyc["user_id"]
        user_session = test_user_with_kyc["session"]
        
        # Approve KYC
        response = admin_session.post(
            f"{BASE_URL}/api/admin/kyc/decision",
            json={"user_id": user_id, "decision": "approved", "note": "Documents verified"}
        )
        print(f"KYC approve status: {response.status_code}")
        assert response.status_code == 200, f"KYC approve failed: {response.text}"
        
        data = response.json()
        assert data.get("message") == "KYC approved"
        print(f"KYC approved for user {user_id}")
        
        # Verify user's kyc_status is updated
        kyc_list = admin_session.get(f"{BASE_URL}/api/admin/kyc").json()["users"]
        user = next((u for u in kyc_list if u["_id"] == user_id), None)
        assert user is not None, "User should exist in KYC list"
        assert user.get("kyc_status") == "approved", f"Expected kyc_status='approved', got {user.get('kyc_status')}"
        print(f"Verified: User kyc_status is 'approved'")
        
        # Verify notification was created for the user
        notif_response = user_session.get(f"{BASE_URL}/api/notifications")
        notifications = notif_response.json()["notifications"]
        kyc_notif = next((n for n in notifications if n["type"] == "kyc"), None)
        assert kyc_notif is not None, "KYC notification should be created"
        assert "Approved" in kyc_notif["title"], f"Notification title should contain 'Approved': {kyc_notif['title']}"
        print(f"Verified: KYC notification created: {kyc_notif['title']}")
    
    def test_kyc_decision_reject(self, admin_session, test_user_with_kyc):
        """POST /api/admin/kyc/decision with decision='rejected' sets kyc_status and creates notification"""
        user_id = test_user_with_kyc["user_id"]
        user_session = test_user_with_kyc["session"]
        
        # Reject KYC
        response = admin_session.post(
            f"{BASE_URL}/api/admin/kyc/decision",
            json={"user_id": user_id, "decision": "rejected", "note": "Documents unclear"}
        )
        print(f"KYC reject status: {response.status_code}")
        assert response.status_code == 200, f"KYC reject failed: {response.text}"
        
        data = response.json()
        assert data.get("message") == "KYC rejected"
        print(f"KYC rejected for user {user_id}")
        
        # Verify user's kyc_status is updated
        kyc_list = admin_session.get(f"{BASE_URL}/api/admin/kyc").json()["users"]
        user = next((u for u in kyc_list if u["_id"] == user_id), None)
        assert user is not None, "User should exist in KYC list"
        assert user.get("kyc_status") == "rejected", f"Expected kyc_status='rejected', got {user.get('kyc_status')}"
        print(f"Verified: User kyc_status is 'rejected'")
        
        # Verify notification was created
        notif_response = user_session.get(f"{BASE_URL}/api/notifications")
        notifications = notif_response.json()["notifications"]
        kyc_notif = next((n for n in notifications if n["type"] == "kyc"), None)
        assert kyc_notif is not None, "KYC notification should be created"
        assert "Rejected" in kyc_notif["title"], f"Notification title should contain 'Rejected': {kyc_notif['title']}"
        print(f"Verified: KYC notification created: {kyc_notif['title']}")
    
    def test_kyc_decision_invalid_decision(self, admin_session, test_user_with_kyc):
        """POST /api/admin/kyc/decision with invalid decision returns 400"""
        user_id = test_user_with_kyc["user_id"]
        
        response = admin_session.post(
            f"{BASE_URL}/api/admin/kyc/decision",
            json={"user_id": user_id, "decision": "invalid_decision"}
        )
        print(f"Invalid decision status: {response.status_code}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_kyc_decision_invalid_user_id(self, admin_session):
        """POST /api/admin/kyc/decision with invalid user_id returns 404"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/kyc/decision",
            json={"user_id": "000000000000000000000000", "decision": "approved"}
        )
        print(f"Invalid user_id status: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ============ EXISTING FLOWS VERIFICATION ============

class TestExistingFlowsStillWork:
    """Verify existing flows still work after new admin endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_auth_login_still_works(self):
        """POST /api/auth/login still works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"mobile": ADMIN_MOBILE, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("role") == "admin"
        print("Auth login: OK")
    
    def test_auth_register_still_works(self):
        """POST /api/auth/register still works"""
        test_mobile = generate_test_mobile()
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": generate_test_name(),
                "mobile": test_mobile,
                "password": "TestPass123",
                "referral_code": ADMIN_REFERRAL_CODE
            }
        )
        assert response.status_code == 200
        assert "id" in response.json()
        print("Auth register: OK")
    
    def test_user_packages_endpoint_still_works(self, admin_session):
        """GET /api/packages (user endpoint) still works"""
        response = admin_session.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        # Should only return active packages
        for pkg in data["packages"]:
            # User endpoint doesn't return 'active' field, but all returned should be active
            assert "_id" in pkg
            assert "name" in pkg
        print(f"User packages endpoint: OK ({len(data['packages'])} packages)")
    
    def test_wallet_withdraw_still_works(self, admin_session):
        """POST /api/wallet/withdraw validation still works"""
        # Test that validation works (insufficient balance)
        response = admin_session.post(
            f"{BASE_URL}/api/wallet/withdraw",
            json={
                "amount": 100,
                "pin": ADMIN_PIN,
                "method": "upi",
                "upi_id": "test@upi"
            }
        )
        # Should fail with insufficient balance (admin has 0 main_wallet)
        assert response.status_code == 400
        assert "insufficient" in response.json().get("detail", "").lower()
        print("Wallet withdraw validation: OK")
    
    def test_wallet_withdrawals_still_works(self, admin_session):
        """GET /api/wallet/withdrawals still works"""
        response = admin_session.get(f"{BASE_URL}/api/wallet/withdrawals")
        assert response.status_code == 200
        assert "withdrawals" in response.json()
        print("Wallet withdrawals: OK")
    
    def test_packages_buy_still_works(self, admin_session):
        """POST /api/packages/buy validation still works"""
        # Get a package
        pkg_response = admin_session.get(f"{BASE_URL}/api/packages")
        packages = pkg_response.json()["packages"]
        package_id = packages[0]["_id"]
        
        # Try to buy (should fail with insufficient e_wallet)
        response = admin_session.post(
            f"{BASE_URL}/api/packages/buy",
            json={"package_id": package_id, "pin": ADMIN_PIN}
        )
        assert response.status_code == 400
        assert "insufficient" in response.json().get("detail", "").lower()
        print("Packages buy validation: OK")
    
    def test_notifications_still_works(self, admin_session):
        """GET /api/notifications still works"""
        response = admin_session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread" in data
        print(f"Notifications: OK ({len(data['notifications'])} notifications)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
