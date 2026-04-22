from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import secrets
import random
import uuid
import base64
from collections import deque
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Backend running"}
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Setup uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, mobile: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "mobile": mobile,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user["has_pin"] = user.get("pin_hash") is not None
        user.pop("password_hash", None)
        user.pop("pin_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_referral_code() -> str:
    return secrets.token_urlsafe(6).upper()[:8]

def generate_otp() -> str:
    otp = str(random.randint(100000, 999999))
    print(f"\n🔐 OTP Generated: {otp}\n")
    return otp

class RegisterRequest(BaseModel):
    name: str
    mobile: str
    password: str
    referral_code: Optional[str] = None

class LoginRequest(BaseModel):
    mobile: str
    password: str

class SetupPINRequest(BaseModel):
    pin: str

class VerifyPINRequest(BaseModel):
    pin: str

class SendOTPRequest(BaseModel):
    mobile: str

class VerifyOTPRequest(BaseModel):
    mobile: str
    otp: str

class ResetPasswordRequest(BaseModel):
    mobile: str
    otp: str
    new_password: str

class ResetPINRequest(BaseModel):
    mobile: str
    otp: str
    new_pin: str

class SelfTransferRequest(BaseModel):
    amount: float
    pin: str

class UserTransferRequest(BaseModel):
    receiver_mobile: str
    amount: float
    pin: str

class AddFundRequest(BaseModel):
    amount: float

class RechargeRequest(BaseModel):
    recharge_type: str
    number: str
    operator: str
    amount: float
    payment_mode: str
    circle: Optional[str] = None
    plan_id: Optional[str] = None
    coins_used: Optional[int] = 0
    pin: Optional[str] = None

class BillPaymentRequest(BaseModel):
    biller_category: str  # 'electricity' | 'water' | 'gas' | 'broadband' | 'landline' | 'dth' | 'insurance' | 'lpg' | 'credit_card'
    biller_code: str
    biller_name: str
    consumer_number: str   # account number / customer id / etc.
    consumer_name: Optional[str] = None
    amount: float
    payment_mode: str       # 'e_wallet' | 'main_wallet'
    pin: str
    coins_used: Optional[int] = 0

class RechargePreviewRequest(BaseModel):
    operator: str
    amount: float
    coins_used: Optional[int] = 0
    plan_id: Optional[str] = None

class RechargePlanRequest(BaseModel):
    operator: str
    category: str  # 'unlimited' | 'data' | 'vouchers'
    price: float
    validity: str  # e.g. "28 Days"
    data: Optional[str] = None  # e.g. "1.5GB/day"
    calls: Optional[str] = None
    sms: Optional[str] = None
    description: Optional[str] = None
    circle: Optional[str] = None  # null = all-India
    active: bool = True

class CashbackRuleRequest(BaseModel):
    operator: Optional[str] = None  # null = all operators
    type: str  # 'fixed' | 'percent'
    value: float
    min_amount: float = 0
    max_amount: Optional[float] = None  # null = no cap
    enabled: bool = True
    priority: int = 0

class CoinSettingsRequest(BaseModel):
    coins_per_rupee: float  # e.g. 10 means 100 coins = ₹10
    max_coins_per_recharge: int  # e.g. 50
    enabled: bool = True

class UserAdjustCoinsRequest(BaseModel):
    user_id: str
    delta: int  # +/-
    reason: Optional[str] = None

class UserBlockRequest(BaseModel):
    user_id: str
    blocked: bool

class CoinPackageRequest(BaseModel):
    amount: float
    coins: int

class ApproveFundRequest(BaseModel):
    request_id: str
    status: str

class UpdateCommissionRequest(BaseModel):
    level: int
    percentage: float

class UserResponse(BaseModel):
    id: str
    name: str
    mobile: str
    email: Optional[str] = None
    role: str
    referral_code: str
    main_wallet: float
    e_wallet: float
    coins: int
    has_pin: bool
    total_income: float
    today_income: float
    direct_referrals: int
    auto_placements: int
    completed_cycles: int
    created_at: str

@api_router.get("/check-referral/{code}")
async def check_referral(code: str):
    user = await db.users.find_one({"referral_code": code})
    if user:
        return {"exists": True, "name": user.get("name", "Unknown")}
    return {"exists": False, "name": None}

@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    existing = await db.users.find_one({"mobile": req.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")
    
    referred_by_id = None
    if req.referral_code:
        referrer = await db.users.find_one({"referral_code": req.referral_code})
        if not referrer:
            raise HTTPException(status_code=400, detail="Invalid referral code")
        referred_by_id = str(referrer["_id"])
    
    user_doc = {
        "name": req.name,
        "mobile": req.mobile,
        "email": None,
        "password_hash": hash_password(req.password),
        "pin_hash": None,
        "referral_code": generate_referral_code(),
        "referred_by": referred_by_id,
        "role": "user",
        "main_wallet": 0.0,
        "e_wallet": 0.0,
        "coins": 0,
        "total_income": 0.0,
        "today_income": 0.0,
        "direct_referrals": 0,
        "auto_placements": 0,
        "completed_cycles": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    if referred_by_id:
        await db.users.update_one(
            {"_id": ObjectId(referred_by_id)},
            {"$inc": {"direct_referrals": 1}}
        )
        await handle_mlm_logic(user_id, referred_by_id)
    
    access_token = create_access_token(user_id, req.mobile, "user")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": req.name,
        "mobile": req.mobile,
        "role": "user",
        "referral_code": user_doc["referral_code"],
        "has_pin": False,
        "access_token": access_token
    }

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    user = await db.users.find_one({"mobile": req.mobile})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["mobile"], user["role"])
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": user["name"],
        "mobile": user["mobile"],
        "role": user["role"],
        "referral_code": user.get("referral_code", ""),
        "has_pin": user.get("pin_hash") is not None,
        "access_token": access_token
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "id": user["_id"],
        "name": user["name"],
        "mobile": user["mobile"],
        "role": user["role"],
        "referral_code": user.get("referral_code", ""),
        "has_pin": user.get("has_pin", False),
        "main_wallet": user.get("main_wallet", 0.0),
        "e_wallet": user.get("e_wallet", 0.0),
        "coins": user.get("coins", 0),
        "total_income": user.get("total_income", 0.0),
        "today_income": user.get("today_income", 0.0)
    }

@api_router.post("/auth/setup-pin")
async def setup_pin(req: SetupPINRequest, request: Request):
    user = await get_current_user(request)
    if len(req.pin) != 4 or not req.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    pin_hash = hash_password(req.pin)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"pin_hash": pin_hash}}
    )
    return {"message": "PIN setup successful"}

@api_router.post("/auth/verify-pin")
async def verify_pin(req: VerifyPINRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    return {"message": "PIN verified"}

@api_router.post("/auth/send-otp")
async def send_otp(req: SendOTPRequest):
    user = await db.users.find_one({"mobile": req.mobile})
    if not user:
        raise HTTPException(status_code=404, detail="Mobile not registered")
    
    otp = generate_otp()
    await db.otp_store.update_one(
        {"mobile": req.mobile},
        {"$set": {"otp": otp, "created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"message": "OTP sent successfully"}

@api_router.post("/auth/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    otp_doc = await db.otp_store.find_one({"mobile": req.mobile})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="OTP not found")
    
    if otp_doc["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    time_diff = datetime.now(timezone.utc) - otp_doc["created_at"]
    if time_diff.total_seconds() > 600:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    return {"message": "OTP verified"}

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    otp_doc = await db.otp_store.find_one({"mobile": req.mobile})
    if not otp_doc or otp_doc["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.users.update_one(
        {"mobile": req.mobile},
        {"$set": {"password_hash": hash_password(req.new_password)}}
    )
    await db.otp_store.delete_one({"mobile": req.mobile})
    return {"message": "Password reset successful"}

@api_router.post("/auth/reset-pin")
async def reset_pin(req: ResetPINRequest):
    if len(req.new_pin) != 4 or not req.new_pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    otp_doc = await db.otp_store.find_one({"mobile": req.mobile})
    if not otp_doc or otp_doc["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.users.update_one(
        {"mobile": req.mobile},
        {"$set": {"pin_hash": hash_password(req.new_pin)}}
    )
    await db.otp_store.delete_one({"mobile": req.mobile})
    return {"message": "PIN reset successful"}

@api_router.get("/wallet/balance")
async def get_balance(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {
        "main_wallet": user_doc.get("main_wallet", 0.0),
        "e_wallet": user_doc.get("e_wallet", 0.0),
        "coins": user_doc.get("coins", 0),
        "total_income": user_doc.get("total_income", 0.0),
        "today_income": user_doc.get("today_income", 0.0)
    }

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    today_joining = await db.users.count_documents({
        "referred_by": user["_id"],
        "created_at": {"$gte": today_start}
    })
    
    total_active_users = await db.users.count_documents({
        "referred_by": user["_id"],
        "status": {"$ne": "inactive"}
    })
    
    total_free_users = await db.users.count_documents({
        "referred_by": user["_id"],
        "subscription_type": "free"
    })
    
    return {
        "main_wallet": user_doc.get("main_wallet", 0.0),
        "e_wallet": user_doc.get("e_wallet", 0.0),
        "coins": user_doc.get("coins", 0),
        "total_income": user_doc.get("total_income", 0.0),
        "today_income": user_doc.get("today_income", 0.0),
        "today_repurchase_income": user_doc.get("today_repurchase_income", 0.0),
        "total_repurchase_income": user_doc.get("total_repurchase_income", 0.0),
        "today_joining": today_joining,
        "total_active_users": total_active_users,
        "total_free_users": total_free_users
    }

@api_router.post("/wallet/self-transfer")
async def self_transfer(req: SelfTransferRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    if user_doc.get("main_wallet", 0.0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient main wallet balance")
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {
            "$inc": {
                "main_wallet": -req.amount,
                "e_wallet": req.amount
            }
        }
    )
    
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "self_transfer",
        "amount": req.amount,
        "status": "success",
        "description": "Main Wallet to E-Wallet",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Transfer successful"}

@api_router.post("/wallet/user-transfer")
async def user_transfer(req: UserTransferRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    receiver = await db.users.find_one({"mobile": req.receiver_mobile})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    if str(receiver["_id"]) == user["_id"]:
        raise HTTPException(status_code=400, detail="Cannot transfer to self")
    
    if user_doc.get("e_wallet", 0.0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient E-Wallet balance")
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"e_wallet": -req.amount}}
    )
    
    await db.users.update_one(
        {"_id": receiver["_id"]},
        {"$inc": {"e_wallet": req.amount}}
    )
    
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "user_transfer",
        "amount": -req.amount,
        "receiver_id": str(receiver["_id"]),
        "receiver_mobile": req.receiver_mobile,
        "status": "success",
        "description": f"Transferred to {req.receiver_mobile}",
        "created_at": datetime.now(timezone.utc)
    })
    
    await db.transactions.insert_one({
        "user_id": str(receiver["_id"]),
        "type": "user_transfer",
        "amount": req.amount,
        "sender_id": user["_id"],
        "sender_mobile": user["mobile"],
        "status": "success",
        "description": f"Received from {user['mobile']}",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Transfer successful"}

class AddFundRequest(BaseModel):
    amount: float
    utr_number: Optional[str] = None
    screenshot_url: Optional[str] = None
    payment_method: Optional[str] = None
    remarks: Optional[str] = None

@api_router.post("/wallet/add-fund-request")
async def add_fund_request(req: AddFundRequest, request: Request):
    user = await get_current_user(request)
    
    fund_req = {
        "user_id": user["_id"],
        "mobile": user["mobile"],
        "name": user["name"],
        "amount": req.amount,
        "utr_number": req.utr_number,
        "screenshot_url": req.screenshot_url,
        "payment_method": req.payment_method,
        "remarks": req.remarks,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.fund_requests.insert_one(fund_req)
    return {"message": "Fund request submitted", "request_id": str(result.inserted_id)}

# --- Recharge: Plans, Cashback, Coin discount helpers ---

DEFAULT_OPERATORS = [
    {"code": "AIRTEL", "name": "Airtel", "color": "from-red-500 to-rose-600", "icon": "📶"},
    {"code": "JIO", "name": "Jio", "color": "from-blue-500 to-indigo-600", "icon": "🔵"},
    {"code": "VI", "name": "Vi", "color": "from-pink-500 to-fuchsia-600", "icon": "🩷"},
    {"code": "BSNL", "name": "BSNL", "color": "from-emerald-500 to-teal-600", "icon": "🟢"},
]

DEFAULT_CIRCLES = [
    "Mumbai", "Delhi", "Kolkata", "Chennai", "Bengaluru", "Hyderabad",
    "Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "West Bengal",
    "Uttar Pradesh East", "Uttar Pradesh West", "Bihar & Jharkhand",
    "Kerala", "Punjab", "Haryana", "Rajasthan", "Madhya Pradesh",
    "Andhra Pradesh", "Odisha", "Assam", "North East", "Himachal Pradesh", "Jammu & Kashmir"
]

DEFAULT_RECHARGE_PLANS = [
    # Airtel
    {"operator": "AIRTEL", "category": "unlimited", "price": 199, "validity": "28 Days", "data": "2GB", "calls": "Unlimited local/STD/Roaming", "sms": "100 SMS/day", "description": "Truly Unlimited 199", "active": True},
    {"operator": "AIRTEL", "category": "unlimited", "price": 299, "validity": "28 Days", "data": "1.5GB/day", "calls": "Unlimited local & STD", "sms": "100 SMS/day", "description": "Most popular pack", "active": True},
    {"operator": "AIRTEL", "category": "unlimited", "price": 479, "validity": "56 Days", "data": "1.5GB/day", "calls": "Unlimited local & STD", "sms": "100 SMS/day", "description": "Best value 56-day plan", "active": True},
    {"operator": "AIRTEL", "category": "data", "price": 58, "validity": "Existing", "data": "3GB add-on", "calls": None, "sms": None, "description": "Data top-up", "active": True},
    {"operator": "AIRTEL", "category": "vouchers", "price": 35, "validity": "28 Days", "data": "200MB", "calls": "38 paise/min", "sms": "Standard", "description": "Talktime voucher", "active": True},
    # Jio
    {"operator": "JIO", "category": "unlimited", "price": 209, "validity": "22 Days", "data": "1GB/day", "calls": "Unlimited", "sms": "100 SMS/day", "description": "Jio Prepaid", "active": True},
    {"operator": "JIO", "category": "unlimited", "price": 299, "validity": "28 Days", "data": "2GB/day", "calls": "Unlimited", "sms": "100 SMS/day", "description": "High-speed 2GB/day", "active": True},
    {"operator": "JIO", "category": "unlimited", "price": 349, "validity": "28 Days", "data": "2.5GB/day", "calls": "Unlimited", "sms": "100 SMS/day", "description": "Jio + 5G Unlimited", "active": True},
    {"operator": "JIO", "category": "data", "price": 61, "validity": "Existing", "data": "6GB add-on", "calls": None, "sms": None, "description": "Data pack 6GB", "active": True},
    # Vi
    {"operator": "VI", "category": "unlimited", "price": 249, "validity": "28 Days", "data": "1.5GB/day", "calls": "Unlimited", "sms": "100 SMS/day", "description": "Vi smart recharge", "active": True},
    {"operator": "VI", "category": "unlimited", "price": 319, "validity": "28 Days", "data": "2GB/day", "calls": "Unlimited", "sms": "100 SMS/day", "description": "Vi non-stop", "active": True},
    # BSNL
    {"operator": "BSNL", "category": "unlimited", "price": 187, "validity": "28 Days", "data": "2GB/day", "calls": "Unlimited", "sms": "100 SMS/day", "description": "BSNL Plus", "active": True},
    {"operator": "BSNL", "category": "vouchers", "price": 47, "validity": "14 Days", "data": "3GB", "calls": "Standard", "sms": "Standard", "description": "Talktime STV", "active": True},
]

async def ensure_default_recharge_plans():
    if await db.recharge_plans.count_documents({}) == 0:
        for p in DEFAULT_RECHARGE_PLANS:
            await db.recharge_plans.insert_one({**p, "circle": None, "created_at": datetime.now(timezone.utc)})

async def get_coin_settings():
    s = await db.coin_settings.find_one({"_id": "default"})
    if not s:
        s = {"_id": "default", "coins_per_rupee": 10.0, "max_coins_per_recharge": 50, "enabled": True}
        await db.coin_settings.insert_one(s)
    return {"coins_per_rupee": s.get("coins_per_rupee", 10.0), "max_coins_per_recharge": s.get("max_coins_per_recharge", 50), "enabled": s.get("enabled", True)}

async def compute_cashback(operator: str, amount: float) -> float:
    rules = await db.cashback_rules.find({"enabled": True}).sort("priority", -1).to_list(500)
    for r in rules:
        if r.get("operator") and r["operator"] != operator:
            continue
        if amount < float(r.get("min_amount", 0)):
            continue
        max_a = r.get("max_amount")
        if max_a is not None and amount > float(max_a):
            continue
        if r["type"] == "fixed":
            return round(float(r["value"]), 2)
        if r["type"] == "percent":
            return round(amount * float(r["value"]) / 100.0, 2)
    return 0.0

@api_router.get("/recharge/operators")
async def list_operators(request: Request):
    await get_current_user(request)
    return {"operators": DEFAULT_OPERATORS}

@api_router.get("/recharge/circles")
async def list_circles(request: Request):
    await get_current_user(request)
    return {"circles": DEFAULT_CIRCLES}

@api_router.get("/recharge/plans")
async def list_recharge_plans(request: Request, operator: Optional[str] = None, category: Optional[str] = None, circle: Optional[str] = None):
    await get_current_user(request)
    await ensure_default_recharge_plans()
    q = {"active": True}
    if operator:
        q["operator"] = operator.upper()
    if category:
        q["category"] = category
    if circle:
        q["$or"] = [{"circle": None}, {"circle": circle}]
    plans = await db.recharge_plans.find(q).sort("price", 1).to_list(500)
    for p in plans:
        p["_id"] = str(p["_id"])
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
    return {"plans": plans}

@api_router.post("/recharge/preview")
async def preview_recharge(req: RechargePreviewRequest, request: Request):
    await get_current_user(request)
    settings = await get_coin_settings()
    coins_used = max(0, int(req.coins_used or 0))
    if not settings["enabled"]:
        coins_used = 0
    if coins_used > settings["max_coins_per_recharge"]:
        coins_used = settings["max_coins_per_recharge"]
    coin_discount = round(coins_used / settings["coins_per_rupee"], 2) if settings["coins_per_rupee"] > 0 else 0.0
    cashback = await compute_cashback(req.operator.upper(), float(req.amount))
    final_amount = max(0.0, round(float(req.amount) - cashback - coin_discount, 2))
    return {
        "amount": float(req.amount),
        "cashback": cashback,
        "coin_discount": coin_discount,
        "coins_used": coins_used,
        "final_amount": final_amount,
        "max_coins": settings["max_coins_per_recharge"],
        "coin_rate": settings["coins_per_rupee"],
        "coins_enabled": settings["enabled"]
    }

# --- Admin: Recharge Plans / Cashback / Coin settings ---

@api_router.get("/admin/recharge-plans")
async def admin_list_plans(request: Request):
    await get_admin_user(request)
    await ensure_default_recharge_plans()
    plans = await db.recharge_plans.find({}).sort("price", 1).to_list(1000)
    for p in plans:
        p["_id"] = str(p["_id"])
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
    return {"plans": plans}

@api_router.post("/admin/recharge-plans")
async def admin_create_plan(req: RechargePlanRequest, request: Request):
    await get_admin_user(request)
    doc = req.model_dump()
    doc["operator"] = doc["operator"].upper()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.recharge_plans.insert_one(doc)
    return {"id": str(result.inserted_id)}

@api_router.put("/admin/recharge-plans/{plan_id}")
async def admin_update_plan(plan_id: str, req: RechargePlanRequest, request: Request):
    await get_admin_user(request)
    doc = req.model_dump()
    doc["operator"] = doc["operator"].upper()
    try:
        res = await db.recharge_plans.update_one({"_id": ObjectId(plan_id)}, {"$set": doc})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Updated"}

@api_router.delete("/admin/recharge-plans/{plan_id}")
async def admin_delete_plan(plan_id: str, request: Request):
    await get_admin_user(request)
    try:
        res = await db.recharge_plans.delete_one({"_id": ObjectId(plan_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Deleted"}

@api_router.get("/admin/cashback-rules")
async def admin_list_cashback(request: Request):
    await get_admin_user(request)
    rules = await db.cashback_rules.find({}).sort("priority", -1).to_list(500)
    for r in rules:
        r["_id"] = str(r["_id"])
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return {"rules": rules}

@api_router.post("/admin/cashback-rules")
async def admin_create_cashback(req: CashbackRuleRequest, request: Request):
    await get_admin_user(request)
    if req.type not in ("fixed", "percent"):
        raise HTTPException(status_code=400, detail="type must be fixed or percent")
    doc = req.model_dump()
    if doc.get("operator"):
        doc["operator"] = doc["operator"].upper()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.cashback_rules.insert_one(doc)
    return {"id": str(result.inserted_id)}

@api_router.delete("/admin/cashback-rules/{rule_id}")
async def admin_delete_cashback(rule_id: str, request: Request):
    await get_admin_user(request)
    try:
        res = await db.cashback_rules.delete_one({"_id": ObjectId(rule_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Deleted"}

@api_router.get("/admin/coin-settings")
async def admin_get_coin_settings(request: Request):
    await get_admin_user(request)
    return await get_coin_settings()

@api_router.post("/admin/coin-settings")
async def admin_set_coin_settings(req: CoinSettingsRequest, request: Request):
    await get_admin_user(request)
    await db.coin_settings.update_one(
        {"_id": "default"},
        {"$set": {
            "coins_per_rupee": float(req.coins_per_rupee),
            "max_coins_per_recharge": int(req.max_coins_per_recharge),
            "enabled": bool(req.enabled)
        }},
        upsert=True
    )
    return {"message": "Saved"}

@api_router.post("/admin/users/adjust-coins")
async def admin_adjust_coins(req: UserAdjustCoinsRequest, request: Request):
    await get_admin_user(request)
    try:
        user = await db.users.find_one({"_id": ObjectId(req.user_id)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_coins = max(0, int(user.get("coins", 0) + req.delta))
    await db.users.update_one({"_id": ObjectId(req.user_id)}, {"$set": {"coins": new_coins}})
    await db.notifications.insert_one({
        "user_id": req.user_id,
        "title": "Coins Updated",
        "message": f"{'+' if req.delta >= 0 else ''}{req.delta} coins by admin. {req.reason or ''}",
        "type": "coins",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    return {"coins": new_coins}

@api_router.post("/admin/users/block")
async def admin_block_user(req: UserBlockRequest, request: Request):
    await get_admin_user(request)
    try:
        res = await db.users.update_one({"_id": ObjectId(req.user_id)}, {"$set": {"blocked": bool(req.blocked)}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Updated"}

@api_router.get("/admin/recharge-stats")
async def admin_recharge_stats(request: Request):
    await get_admin_user(request)
    recharge_sum = await db.recharges.aggregate([
        {"$match": {"status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "cashback": {"$sum": "$cashback"}, "coins": {"$sum": "$coins_used"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    data = recharge_sum[0] if recharge_sum else {"total": 0, "cashback": 0, "coins": 0, "count": 0}
    total_users = await db.users.count_documents({"role": "user"})
    return {
        "total_users": total_users,
        "total_recharge_amount": round(data.get("total", 0), 2),
        "total_cashback_given": round(data.get("cashback", 0), 2),
        "total_coins_used": int(data.get("coins", 0)),
        "total_recharges": int(data.get("count", 0))
    }

@api_router.get("/admin/transactions")
async def admin_transactions(request: Request, type: Optional[str] = None, status: Optional[str] = None, limit: int = 200):
    await get_admin_user(request)
    q = {}
    if type:
        q["type"] = type
    if status:
        q["status"] = status
    txs = await db.transactions.find(q).sort("created_at", -1).limit(min(limit, 500)).to_list(None)
    for t in txs:
        t["_id"] = str(t["_id"])
        if isinstance(t.get("created_at"), datetime):
            t["created_at"] = t["created_at"].isoformat()
        # attach user name
        try:
            u = await db.users.find_one({"_id": ObjectId(t["user_id"])}, {"name": 1, "mobile": 1})
            if u:
                t["user_name"] = u.get("name")
                t["user_mobile"] = u.get("mobile")
        except Exception:
            pass
    # also include recharges collection metadata
    return {"transactions": txs}

@api_router.get("/admin/recharges")
async def admin_recharges(request: Request, status: Optional[str] = None, limit: int = 200):
    await get_admin_user(request)
    q = {}
    if status:
        q["status"] = status
    rs = await db.recharges.find(q).sort("created_at", -1).limit(min(limit, 500)).to_list(None)
    for r in rs:
        r["_id"] = str(r["_id"])
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
        try:
            u = await db.users.find_one({"_id": ObjectId(r["user_id"])}, {"name": 1, "mobile": 1})
            if u:
                r["user_name"] = u.get("name")
                r["user_mobile"] = u.get("mobile")
        except Exception:
            pass
    return {"recharges": rs}

@api_router.post("/recharge")
async def recharge(req: RechargeRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if user_doc.get("blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked. Contact support.")

    # PIN verification required for recharges
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set. Please setup PIN from Profile.")
    if not req.pin or not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    operator = (req.operator or "").upper()
    coin_settings = await get_coin_settings()
    coins_used = max(0, int(req.coins_used or 0))
    if not coin_settings["enabled"]:
        coins_used = 0
    if coins_used > coin_settings["max_coins_per_recharge"]:
        raise HTTPException(status_code=400, detail=f"Max {coin_settings['max_coins_per_recharge']} coins allowed")
    if coins_used > int(user_doc.get("coins", 0)):
        raise HTTPException(status_code=400, detail="Insufficient coins balance")

    coin_discount = round(coins_used / coin_settings["coins_per_rupee"], 2) if coin_settings["coins_per_rupee"] > 0 else 0.0
    cashback = await compute_cashback(operator, float(req.amount))
    final_amount = max(0.0, round(float(req.amount) - cashback - coin_discount, 2))

    if req.payment_mode == "e_wallet":
        if float(user_doc.get("e_wallet", 0.0)) < final_amount:
            raise HTTPException(status_code=400, detail="Insufficient E-Wallet balance")
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"e_wallet": -final_amount}})
    elif req.payment_mode == "main_wallet":
        if float(user_doc.get("main_wallet", 0.0)) < final_amount:
            raise HTTPException(status_code=400, detail="Insufficient Main Wallet balance")
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"main_wallet": -final_amount}})
    else:
        raise HTTPException(status_code=400, detail="Invalid payment mode")

    # Debit coins used
    if coins_used > 0:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"coins": -coins_used}})

    # Credit cashback as coins: 1 rupee cashback => coins_per_rupee coins
    coins_earned = int(round(cashback * coin_settings["coins_per_rupee"])) if cashback > 0 else 0
    if coins_earned > 0:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"coins": coins_earned}})

    status = random.choice(["success", "success", "success", "pending"])

    recharge_doc = {
        "user_id": user["_id"],
        "type": req.recharge_type,
        "number": req.number,
        "operator": operator,
        "circle": req.circle,
        "plan_id": req.plan_id,
        "amount": float(req.amount),
        "cashback": cashback,
        "coins_used": coins_used,
        "coin_discount": coin_discount,
        "coins_earned": coins_earned,
        "final_amount": final_amount,
        "payment_mode": req.payment_mode,
        "status": status,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.recharges.insert_one(recharge_doc)

    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "recharge",
        "amount": -final_amount,
        "cashback": cashback,
        "coins_used": coins_used,
        "status": status,
        "description": f"{operator} {req.number} · ₹{req.amount}",
        "created_at": datetime.now(timezone.utc)
    })

    await db.notifications.insert_one({
        "user_id": user["_id"],
        "title": f"Recharge {status.title()}",
        "message": f"₹{req.amount} for {req.number} ({operator}). Paid ₹{final_amount}. Cashback ₹{cashback}. {coins_earned} coins credited." if status == "success" else f"₹{req.amount} recharge pending for {req.number}.",
        "type": "recharge",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })

    if status == "success":
        await distribute_commission(user["_id"], float(req.amount))

    return {
        "message": "Recharge initiated",
        "status": status,
        "recharge_id": str(result.inserted_id),
        "amount": float(req.amount),
        "cashback": cashback,
        "coin_discount": coin_discount,
        "coins_used": coins_used,
        "coins_earned": coins_earned,
        "final_amount": final_amount
    }

@api_router.get("/transactions")
async def get_transactions(request: Request, type: Optional[str] = None, from_date: Optional[str] = None, to_date: Optional[str] = None, skip: int = 0, limit: int = 100):
    user = await get_current_user(request)
    
    query = {"user_id": user["_id"]}
    if type:
        query["type"] = type
    if from_date:
        query["created_at"] = {"$gte": datetime.fromisoformat(from_date)}
    if to_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = datetime.fromisoformat(to_date)
        else:
            query["created_at"] = {"$lte": datetime.fromisoformat(to_date)}
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(min(limit, 500)).to_list(None)
    
    for txn in transactions:
        if isinstance(txn.get("created_at"), datetime):
            txn["created_at"] = txn["created_at"].isoformat()
    
    return {"transactions": transactions}

@api_router.get("/referral/tree")
async def get_referral_tree(request: Request):
    user = await get_current_user(request)
    
    referrals = await db.users.find(
        {"referred_by": user["_id"]},
        {"_id": 0, "name": 1, "mobile": 1, "direct_referrals": 1, "created_at": 1}
    ).to_list(1000)
    
    for ref in referrals:
        if isinstance(ref.get("created_at"), datetime):
            ref["created_at"] = ref["created_at"].isoformat()
    
    return {"referrals": referrals}

@api_router.get("/referral/stats")
async def get_referral_stats(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    total_referrals = await db.users.count_documents({"referred_by": user["_id"]})
    
    return {
        "direct_referrals": user_doc.get("direct_referrals", 0),
        "auto_placements": user_doc.get("auto_placements", 0),
        "completed_cycles": user_doc.get("completed_cycles", 0),
        "total_referrals": total_referrals,
        "referral_code": user_doc.get("referral_code", "")
    }

@api_router.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    
    return {
        "name": user_doc.get("name", ""),
        "mobile": user_doc.get("mobile", ""),
        "email": user_doc.get("email"),
        "address": user_doc.get("address"),
        "nominee_name": user_doc.get("nominee_name"),
        "nominee_relation": user_doc.get("nominee_relation"),
        "nominee_mobile": user_doc.get("nominee_mobile"),
        "kyc_aadhaar": user_doc.get("kyc_aadhaar"),
        "kyc_pan": user_doc.get("kyc_pan")
    }

@api_router.put("/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    update_fields = {}
    if "name" in body:
        update_fields["name"] = body["name"]
    if "email" in body:
        update_fields["email"] = body["email"]
    if "address" in body:
        update_fields["address"] = body["address"]
    if "nominee_name" in body:
        update_fields["nominee_name"] = body["nominee_name"]
    if "nominee_relation" in body:
        update_fields["nominee_relation"] = body["nominee_relation"]
    if "nominee_mobile" in body:
        update_fields["nominee_mobile"] = body["nominee_mobile"]
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": update_fields}
    )
    
    return {"message": "Profile updated successfully"}

@api_router.post("/profile/upload-kyc")
async def upload_kyc(request: Request):
    user = await get_current_user(request)
    form = await request.form()
    file_type = form.get("type")
    
    field_name = f"kyc_{file_type}"
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {field_name: f"uploaded_{file_type}_{datetime.now(timezone.utc).isoformat()}"}}
    )
    
    return {"message": f"{file_type} uploaded successfully"}

@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    admin = await get_admin_user(request)
    
    total_users = await db.users.count_documents({"role": "user"})
    pending_funds = await db.fund_requests.count_documents({"status": "pending"})
    total_recharges = await db.recharges.count_documents({})
    
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    recharge_sum = await db.recharges.aggregate(pipeline).to_list(1)
    total_recharge_amount = recharge_sum[0]["total"] if recharge_sum else 0
    
    return {
        "total_users": total_users,
        "pending_funds": pending_funds,
        "total_recharges": total_recharges,
        "total_recharge_amount": total_recharge_amount
    }

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    admin = await get_admin_user(request)
    
    users = await db.users.find(
        {"role": "user"},
        {"password_hash": 0, "pin_hash": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for user in users:
        user["_id"] = str(user["_id"])
        if isinstance(user.get("created_at"), datetime):
            user["created_at"] = user["created_at"].isoformat()
    
    return {"users": users}

@api_router.get("/admin/fund-requests")
async def get_fund_requests(request: Request, status: Optional[str] = None):
    admin = await get_admin_user(request)
    
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.fund_requests.find(query).sort("created_at", -1).to_list(1000)
    
    for req in requests:
        req["_id"] = str(req["_id"])
        if isinstance(req.get("created_at"), datetime):
            req["created_at"] = req["created_at"].isoformat()
    
    return {"requests": requests}

@api_router.post("/admin/approve-fund")
async def approve_fund(req: ApproveFundRequest, request: Request):
    admin = await get_admin_user(request)
    
    fund_req = await db.fund_requests.find_one({"_id": ObjectId(req.request_id)})
    if not fund_req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if fund_req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    await db.fund_requests.update_one(
        {"_id": ObjectId(req.request_id)},
        {"$set": {"status": req.status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if req.status == "approved":
        await db.users.update_one(
            {"_id": ObjectId(fund_req["user_id"])},
            {"$inc": {"e_wallet": fund_req["amount"]}}
        )
        
        await db.transactions.insert_one({
            "user_id": fund_req["user_id"],
            "type": "fund_added",
            "amount": fund_req["amount"],
            "status": "success",
            "description": "Fund added by admin",
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"message": f"Request {req.status}"}

@api_router.get("/admin/coin-packages")
async def get_coin_packages(request: Request):
    admin = await get_admin_user(request)
    
    packages = await db.coin_packages.find({}, {"_id": 0}).to_list(100)
    return {"packages": packages}

@api_router.post("/admin/coin-packages")
async def create_coin_package(req: CoinPackageRequest, request: Request):
    admin = await get_admin_user(request)
    
    package = {
        "amount": req.amount,
        "coins": req.coins,
        "active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.coin_packages.insert_one(package)
    return {"message": "Package created"}

@api_router.get("/admin/commission-settings")
async def get_commission_settings(request: Request):
    admin = await get_admin_user(request)
    
    settings = await db.commission_settings.find_one({"type": "mlm"})
    if not settings:
        default_settings = {
            "type": "mlm",
            "levels": {str(i): 2.0 for i in range(1, 21)}
        }
        await db.commission_settings.insert_one(default_settings)
        settings = default_settings
    
    settings.pop("_id", None)
    return settings

@api_router.post("/admin/commission-settings")
async def update_commission_settings(req: UpdateCommissionRequest, request: Request):
    admin = await get_admin_user(request)
    
    if req.level < 1 or req.level > 20:
        raise HTTPException(status_code=400, detail="Level must be between 1 and 20")
    
    await db.commission_settings.update_one(
        {"type": "mlm"},
        {"$set": {f"levels.{req.level}": req.percentage}},
        upsert=True
    )
    
    return {"message": "Commission updated"}

async def handle_mlm_logic(new_user_id: str, referrer_id: str):
    referrer = await db.users.find_one({"_id": ObjectId(referrer_id)})
    if not referrer:
        return
    
    direct_refs = referrer.get("direct_referrals", 0)
    completed_cycles = referrer.get("completed_cycles", 0)
    
    if completed_cycles >= 10:
        return
    
    if completed_cycles == 0 and direct_refs == 1:
        await db.users.update_one(
            {"_id": ObjectId(referrer_id)},
            {"$inc": {"completed_cycles": 1, "auto_placements": 1}}
        )
    elif completed_cycles > 0 and (direct_refs - 1) % 4 == 0:
        await db.users.update_one(
            {"_id": ObjectId(referrer_id)},
            {"$inc": {"completed_cycles": 1, "auto_placements": 1}}
        )

async def distribute_commission(user_id: str, amount: float):
    settings = await db.commission_settings.find_one({"type": "mlm"})
    if not settings:
        return
    
    current_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not current_user:
        return
    
    level = 1
    current_referrer_id = current_user.get("referred_by")
    
    while current_referrer_id and level <= 20:
        commission_percentage = settings["levels"].get(str(level), 0)
        commission_amount = (amount * commission_percentage) / 100
        
        if commission_amount > 0:
            await db.users.update_one(
                {"_id": ObjectId(current_referrer_id)},
                {
                    "$inc": {
                        "main_wallet": commission_amount,
                        "total_income": commission_amount,
                        "today_income": commission_amount
                    }
                }
            )
            
            await db.transactions.insert_one({
                "user_id": current_referrer_id,
                "type": "commission",
                "amount": commission_amount,
                "status": "success",
                "description": f"Level {level} commission",
                "created_at": datetime.now(timezone.utc)
            })
        
        referrer = await db.users.find_one({"_id": ObjectId(current_referrer_id)})
        if not referrer:
            break
        current_referrer_id = referrer.get("referred_by")
        level += 1

@app.on_event("startup")
async def startup_event():
    admin_mobile = os.environ.get("ADMIN_MOBILE", "9999999999")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@recharge.com")
    
    existing = await db.users.find_one({"mobile": admin_mobile})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "name": "Admin",
            "mobile": admin_mobile,
            "email": admin_email,
            "password_hash": hashed,
            "pin_hash": hash_password("1234"),
            "referral_code": "ADMIN001",
            "referred_by": None,
            "role": "admin",
            "main_wallet": 0.0,
            "e_wallet": 0.0,
            "coins": 0,
            "total_income": 0.0,
            "today_income": 0.0,
            "direct_referrals": 0,
            "auto_placements": 0,
            "completed_cycles": 0,
            "created_at": datetime.now(timezone.utc)
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"mobile": admin_mobile},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
    
    await db.users.create_index("mobile", unique=True)
    await db.users.create_index("referral_code", unique=True)
    
    credentials_content = f"""# Test Credentials

## Admin Account
- Mobile: {admin_mobile}
- Password: {admin_password}
- PIN: 1234
- Role: admin

## Test User
Create via signup with referral code: ADMIN001

## Endpoints
- Register: POST /api/auth/register
- Login: POST /api/auth/login
- Dashboard: GET /api/auth/me
"""
    
    Path("/app/memory").mkdir(exist_ok=True)
    Path("/app/memory/test_credentials.md").write_text(credentials_content)

# --- Shopping / Vendor Routes ---

class ProductRequest(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int
    image_url: Optional[str] = None

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int

@api_router.get("/vendor/status")
async def get_vendor_status(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {"is_vendor": user_doc.get("is_vendor", False)}

@api_router.post("/vendor/register")
async def register_vendor(request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"is_vendor": True}}
    )
    return {"message": "You are now a vendor"}

@api_router.get("/products")
async def get_products(request: Request, skip: int = 0, limit: int = 50, category: Optional[str] = None):
    try:
        await get_current_user(request)
    except:
        pass
    query = {}
    if category:
        query["category"] = category
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(min(limit, 100)).to_list(None)
    return {"products": products}

@api_router.post("/products")
async def add_product(req: ProductRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc.get("is_vendor"):
        raise HTTPException(status_code=403, detail="Only vendors can add products")
    product = {
        "name": req.name,
        "description": req.description,
        "price": req.price,
        "category": req.category,
        "stock": req.stock,
        "image_url": req.image_url,
        "vendor_id": user["_id"],
        "vendor_name": user_doc.get("name", "Unknown"),
        "created_at": datetime.now(timezone.utc)
    }
    await db.products.insert_one(product)
    return {"message": "Product added successfully"}

@api_router.post("/cart/add")
async def add_to_cart(req: AddToCartRequest, request: Request):
    user = await get_current_user(request)
    cart_item = {
        "user_id": user["_id"],
        "product_id": req.product_id,
        "quantity": req.quantity,
        "added_at": datetime.now(timezone.utc)
    }
    existing = await db.cart.find_one({"user_id": user["_id"], "product_id": req.product_id})
    if existing:
        await db.cart.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"quantity": req.quantity}}
        )
    else:
        await db.cart.insert_one(cart_item)
    return {"message": "Added to cart"}

# --- Banner Routes (Text Banner + Image Banner) ---

class TextBannerRequest(BaseModel):
    text: str
    color: str

class ImageBannerRequest(BaseModel):
    images: List[str]

class FullBannerRequest(BaseModel):
    text: Optional[str] = None
    color: Optional[str] = None
    images: Optional[List[str]] = None

@api_router.get("/banner")
async def get_banner():
    text_banner = await db.settings.find_one({"type": "text_banner"})
    image_banner = await db.settings.find_one({"type": "image_banner"})
    if not text_banner:
        text_banner = {
            "type": "text_banner",
            "text": "Earn Smart - Grow Fast - Achieve More",
            "color": "from-purple-600 via-pink-600 to-rose-600"
        }
        await db.settings.insert_one(text_banner)
    if not image_banner:
        image_banner = {
            "type": "image_banner",
            "images": []
        }
        await db.settings.insert_one(image_banner)
    text_banner.pop("_id", None)
    image_banner.pop("_id", None)
    return {
        "text": text_banner.get("text", ""),
        "color": text_banner.get("color", "from-purple-600 via-pink-600 to-rose-600"),
        "images": image_banner.get("images", [])
    }

@api_router.post("/admin/banner/text")
async def update_text_banner(req: TextBannerRequest, request: Request):
    await get_admin_user(request)
    await db.settings.update_one(
        {"type": "text_banner"},
        {"$set": {"text": req.text, "color": req.color}},
        upsert=True
    )
    return {"message": "Text banner updated"}

@api_router.post("/admin/banner/image")
async def update_image_banner(req: ImageBannerRequest, request: Request):
    await get_admin_user(request)
    await db.settings.update_one(
        {"type": "image_banner"},
        {"$set": {"images": req.images}},
        upsert=True
    )
    return {"message": "Image banner updated"}

@api_router.post("/admin/banner")
async def update_banner(req: FullBannerRequest, request: Request):
    await get_admin_user(request)
    if req.text is not None or req.color is not None:
        text_update = {}
        if req.text is not None:
            text_update["text"] = req.text
        if req.color is not None:
            text_update["color"] = req.color
        await db.settings.update_one(
            {"type": "text_banner"},
            {"$set": text_update},
            upsert=True
        )
    if req.images is not None:
        await db.settings.update_one(
            {"type": "image_banner"},
            {"$set": {"images": req.images}},
            upsert=True
        )
    return {"message": "Banner updated"}

@api_router.post("/admin/banner/upload")
async def upload_banner_image(request: Request, file: UploadFile = File(...)):
    await get_admin_user(request)
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "gif", "webp"):
        raise HTTPException(status_code=400, detail="Only image files allowed (jpg, png, gif, webp)")
    filename = f"banner_{uuid.uuid4().hex[:12]}.{ext}"
    filepath = UPLOAD_DIR / filename
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    with open(filepath, "wb") as f:
        f.write(content)
    image_url = f"/api/uploads/{filename}"
    return {"url": image_url, "message": "Image uploaded"}

# --- Bank Withdrawal Route ---

class WithdrawRequest(BaseModel):
    amount: float
    pin: str
    method: Optional[str] = "bank"  # 'bank' | 'upi'
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder: Optional[str] = None
    upi_id: Optional[str] = None

@api_router.post("/wallet/withdraw")
async def withdraw_to_bank(req: WithdrawRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is 100")
    if user_doc.get("main_wallet", 0.0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient main wallet balance")

    method = (req.method or "bank").lower()
    if method == "upi":
        if not req.upi_id or "@" not in req.upi_id:
            raise HTTPException(status_code=400, detail="Valid UPI ID required")
    else:
        if not req.bank_name or not req.account_number or not req.ifsc_code:
            raise HTTPException(status_code=400, detail="Bank details required")

    charge = round(req.amount * 0.02, 2)  # 2% platform fee
    net_amount = round(req.amount - charge, 2)

    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"main_wallet": -req.amount}}
    )
    withdrawal_doc = {
        "user_id": user["_id"],
        "amount": req.amount,
        "charge": charge,
        "net_amount": net_amount,
        "method": method,
        "bank_name": req.bank_name,
        "account_number": req.account_number,
        "ifsc_code": req.ifsc_code,
        "account_holder": req.account_holder,
        "upi_id": req.upi_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.withdrawals.insert_one(withdrawal_doc)
    dest = req.upi_id if method == "upi" else (req.bank_name or "Bank")
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "withdrawal",
        "amount": -req.amount,
        "status": "pending",
        "description": f"Withdrawal ({method.upper()}) - {dest}",
        "created_at": datetime.now(timezone.utc)
    })
    await db.notifications.insert_one({
        "user_id": user["_id"],
        "title": "Withdrawal Requested",
        "message": f"Rs.{req.amount} withdrawal submitted. You will receive Rs.{net_amount} after 2% charge.",
        "type": "withdrawal",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    return {"message": "Withdrawal request submitted", "request_id": str(result.inserted_id), "charge": charge, "net_amount": net_amount}

# --- User Withdrawal History ---
@api_router.get("/wallet/withdrawals")
async def my_withdrawals(request: Request):
    user = await get_current_user(request)
    items = await db.withdrawals.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(500)
    for w in items:
        w["_id"] = str(w["_id"])
        if isinstance(w.get("created_at"), datetime):
            w["created_at"] = w["created_at"].isoformat()
        if isinstance(w.get("updated_at"), datetime):
            w["updated_at"] = w["updated_at"].isoformat()
    return {"withdrawals": items}

@api_router.get("/admin/withdrawals")
async def get_withdrawals(request: Request, status: Optional[str] = None):
    await get_admin_user(request)
    query = {}
    if status:
        query["status"] = status
    withdrawals = await db.withdrawals.find(query).sort("created_at", -1).to_list(1000)
    for w in withdrawals:
        w["_id"] = str(w["_id"])
        if isinstance(w.get("created_at"), datetime):
            w["created_at"] = w["created_at"].isoformat()
    return {"withdrawals": withdrawals}

class ApproveWithdrawalRequest(BaseModel):
    request_id: str
    status: str

@api_router.post("/admin/approve-withdrawal")
async def approve_withdrawal(req: ApproveWithdrawalRequest, request: Request):
    await get_admin_user(request)
    wd = await db.withdrawals.find_one({"_id": ObjectId(req.request_id)})
    if not wd:
        raise HTTPException(status_code=404, detail="Request not found")
    if wd["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    await db.withdrawals.update_one(
        {"_id": ObjectId(req.request_id)},
        {"$set": {"status": req.status, "updated_at": datetime.now(timezone.utc)}}
    )
    if req.status == "rejected":
        await db.users.update_one(
            {"_id": ObjectId(wd["user_id"])},
            {"$inc": {"main_wallet": wd["amount"]}}
        )
    await db.transactions.update_one(
        {"user_id": wd["user_id"], "type": "withdrawal", "amount": -wd["amount"], "status": "pending"},
        {"$set": {"status": req.status}}
    )
    return {"message": f"Withdrawal {req.status}"}

# --- Investment Packages ---

class PackageBuyRequest(BaseModel):
    package_id: str
    pin: str

class PackageCreateRequest(BaseModel):
    name: str
    price: float
    daily_income: float
    duration_days: int
    total_return: float
    badge: Optional[str] = None
    color: Optional[str] = None

DEFAULT_PACKAGES = [
    {"code": "STARTER", "name": "Starter", "price": 500.0, "daily_income": 20.0, "duration_days": 35, "total_return": 700.0, "badge": "Popular", "color": "from-emerald-500 to-teal-500"},
    {"code": "SILVER", "name": "Silver", "price": 1500.0, "daily_income": 70.0, "duration_days": 30, "total_return": 2100.0, "badge": None, "color": "from-slate-500 to-slate-700"},
    {"code": "GOLD", "name": "Gold", "price": 3000.0, "daily_income": 150.0, "duration_days": 28, "total_return": 4200.0, "badge": "Best Value", "color": "from-amber-500 to-orange-500"},
    {"code": "PLATINUM", "name": "Platinum", "price": 5000.0, "daily_income": 270.0, "duration_days": 25, "total_return": 6750.0, "badge": None, "color": "from-indigo-500 to-purple-600"},
    {"code": "DIAMOND", "name": "Diamond", "price": 10000.0, "daily_income": 600.0, "duration_days": 22, "total_return": 13200.0, "badge": "Premium", "color": "from-cyan-500 to-blue-600"},
    {"code": "ELITE", "name": "Elite", "price": 25000.0, "daily_income": 1700.0, "duration_days": 20, "total_return": 34000.0, "badge": "VIP", "color": "from-rose-500 to-pink-600"},
]

async def ensure_default_packages():
    count = await db.packages.count_documents({})
    if count == 0:
        for p in DEFAULT_PACKAGES:
            await db.packages.insert_one({**p, "active": True, "created_at": datetime.now(timezone.utc)})

@api_router.get("/packages")
async def list_packages(request: Request):
    await get_current_user(request)
    await ensure_default_packages()
    items = await db.packages.find({"active": True}, {"_id": 1, "code": 1, "name": 1, "price": 1, "daily_income": 1, "duration_days": 1, "total_return": 1, "badge": 1, "color": 1}).sort("price", 1).to_list(100)
    for p in items:
        p["_id"] = str(p["_id"])
    return {"packages": items}

@api_router.post("/packages/buy")
async def buy_package(req: PackageBuyRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set")
    if not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    try:
        pkg = await db.packages.find_one({"_id": ObjectId(req.package_id)})
    except Exception:
        pkg = None
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    price = float(pkg["price"])
    if user_doc.get("e_wallet", 0.0) < price:
        raise HTTPException(status_code=400, detail="Insufficient E-Wallet balance. Add funds first.")

    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$inc": {"e_wallet": -price}}
    )

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=int(pkg["duration_days"]))
    purchase = {
        "user_id": user["_id"],
        "package_id": str(pkg["_id"]),
        "package_name": pkg["name"],
        "price": price,
        "daily_income": float(pkg["daily_income"]),
        "duration_days": int(pkg["duration_days"]),
        "total_return": float(pkg["total_return"]),
        "earned": 0.0,
        "days_credited": 0,
        "status": "active",
        "last_credit_at": None,
        "started_at": now,
        "ends_at": end,
        "created_at": now
    }
    result = await db.user_packages.insert_one(purchase)

    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "package_buy",
        "amount": -price,
        "status": "success",
        "description": f"Purchased {pkg['name']} Package",
        "created_at": now
    })
    await db.notifications.insert_one({
        "user_id": user["_id"],
        "title": "Package Activated",
        "message": f"{pkg['name']} package active! Daily Rs.{pkg['daily_income']} for {pkg['duration_days']} days.",
        "type": "package",
        "read": False,
        "created_at": now
    })

    # MLM commission on package purchase (counts as business volume)
    await distribute_commission(user["_id"], price)

    return {"message": "Package activated", "purchase_id": str(result.inserted_id)}

@api_router.get("/packages/my")
async def my_packages(request: Request):
    user = await get_current_user(request)
    # Credit due daily incomes before returning
    await credit_due_package_incomes(user["_id"])
    items = await db.user_packages.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(200)
    for p in items:
        p["_id"] = str(p["_id"])
        for k in ("started_at", "ends_at", "created_at", "last_credit_at"):
            if isinstance(p.get(k), datetime):
                p[k] = p[k].isoformat()
    return {"packages": items}

async def credit_due_package_incomes(user_id: str):
    now = datetime.now(timezone.utc)
    active = await db.user_packages.find({"user_id": user_id, "status": "active"}).to_list(100)
    for up in active:
        started = up.get("started_at") or up.get("created_at")
        if not started:
            continue
        # Ensure started is timezone-aware for comparison
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        elapsed_days = int((now - started).total_seconds() // 86400)
        due_days = min(elapsed_days, up["duration_days"]) - up.get("days_credited", 0)
        if due_days <= 0:
            continue
        credit = round(due_days * up["daily_income"], 2)
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"main_wallet": credit, "total_income": credit, "today_income": credit}}
        )
        new_days = up.get("days_credited", 0) + due_days
        new_earned = round(up.get("earned", 0.0) + credit, 2)
        update_fields = {"days_credited": new_days, "earned": new_earned, "last_credit_at": now}
        if new_days >= up["duration_days"]:
            update_fields["status"] = "completed"
        await db.user_packages.update_one({"_id": up["_id"]}, {"$set": update_fields})
        await db.transactions.insert_one({
            "user_id": user_id,
            "type": "package_income",
            "amount": credit,
            "status": "success",
            "description": f"Daily income from {up.get('package_name', 'Package')} ({due_days} day{'s' if due_days > 1 else ''})",
            "created_at": now
        })

@api_router.post("/admin/packages")
async def admin_create_package(req: PackageCreateRequest, request: Request):
    await get_admin_user(request)
    doc = {
        "name": req.name,
        "price": req.price,
        "daily_income": req.daily_income,
        "duration_days": req.duration_days,
        "total_return": req.total_return,
        "badge": req.badge,
        "color": req.color or "from-emerald-500 to-teal-500",
        "active": True,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.packages.insert_one(doc)
    return {"message": "Package created", "id": str(result.inserted_id)}

@api_router.get("/admin/packages")
async def admin_list_packages(request: Request):
    await get_admin_user(request)
    await ensure_default_packages()
    items = await db.packages.find({}).sort("price", 1).to_list(200)
    for p in items:
        p["_id"] = str(p["_id"])
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
    return {"packages": items}

class PackageToggleRequest(BaseModel):
    package_id: str
    active: bool

@api_router.post("/admin/packages/toggle")
async def admin_toggle_package(req: PackageToggleRequest, request: Request):
    await get_admin_user(request)
    try:
        res = await db.packages.update_one({"_id": ObjectId(req.package_id)}, {"$set": {"active": req.active}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"message": "Updated"}

@api_router.delete("/admin/packages/{package_id}")
async def admin_delete_package(package_id: str, request: Request):
    await get_admin_user(request)
    try:
        res = await db.packages.delete_one({"_id": ObjectId(package_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"message": "Deleted"}

# --- Admin KYC ---

class KycDecisionRequest(BaseModel):
    user_id: str
    decision: str  # 'approved' | 'rejected'
    note: Optional[str] = None

@api_router.get("/admin/kyc")
async def admin_list_kyc(request: Request, status: Optional[str] = None):
    await get_admin_user(request)
    query = {"role": "user"}
    if status == "pending":
        query["$and"] = [
            {"$or": [{"kyc_aadhaar": {"$ne": None}}, {"kyc_pan": {"$ne": None}}]},
            {"kyc_status": {"$in": [None, "pending"]}}
        ]
    elif status:
        query["kyc_status"] = status
    users = await db.users.find(query, {"password_hash": 0, "pin_hash": 0}).sort("created_at", -1).to_list(500)
    for u in users:
        u["_id"] = str(u["_id"])
        if isinstance(u.get("created_at"), datetime):
            u["created_at"] = u["created_at"].isoformat()
        if isinstance(u.get("kyc_updated_at"), datetime):
            u["kyc_updated_at"] = u["kyc_updated_at"].isoformat()
    return {"users": users}

@api_router.post("/admin/kyc/decision")
async def admin_kyc_decision(req: KycDecisionRequest, request: Request):
    await get_admin_user(request)
    if req.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid decision")
    try:
        user = await db.users.find_one({"_id": ObjectId(req.user_id)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one(
        {"_id": ObjectId(req.user_id)},
        {"$set": {"kyc_status": req.decision, "kyc_note": req.note, "kyc_updated_at": datetime.now(timezone.utc)}}
    )
    await db.notifications.insert_one({
        "user_id": req.user_id,
        "title": f"KYC {req.decision.title()}",
        "message": req.note or (f"Your KYC has been {req.decision}."),
        "type": "kyc",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    return {"message": f"KYC {req.decision}"}

# --- Notifications ---

@api_router.get("/notifications")
async def list_notifications(request: Request, limit: int = 30):
    user = await get_current_user(request)
    items = await db.notifications.find({"user_id": user["_id"]}).sort("created_at", -1).limit(min(limit, 100)).to_list(None)
    unread = await db.notifications.count_documents({"user_id": user["_id"], "read": False})
    for n in items:
        n["_id"] = str(n["_id"])
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
    return {"notifications": items, "unread": unread}

@api_router.post("/notifications/read-all")
async def mark_all_read(request: Request):
    user = await get_current_user(request)
    await db.notifications.update_many({"user_id": user["_id"], "read": False}, {"$set": {"read": True}})
    return {"message": "ok"}

# --- Utility Bill Payment ---

BILLER_CATEGORIES = [
    {"code": "electricity", "name": "Electricity", "icon": "⚡", "color": "from-amber-500 to-orange-500"},
    {"code": "water", "name": "Water", "icon": "💧", "color": "from-sky-500 to-blue-600"},
    {"code": "gas", "name": "Piped Gas", "icon": "🔥", "color": "from-rose-500 to-red-600"},
    {"code": "broadband", "name": "Broadband", "icon": "🌐", "color": "from-indigo-500 to-purple-600"},
    {"code": "landline", "name": "Landline", "icon": "📞", "color": "from-emerald-500 to-teal-600"},
    {"code": "dth", "name": "DTH / Cable", "icon": "📺", "color": "from-fuchsia-500 to-pink-600"},
    {"code": "insurance", "name": "Insurance", "icon": "🛡️", "color": "from-green-600 to-emerald-700"},
    {"code": "lpg", "name": "LPG Cylinder", "icon": "🛢️", "color": "from-orange-500 to-red-500"},
    {"code": "credit_card", "name": "Credit Card", "icon": "💳", "color": "from-slate-700 to-slate-900"},
    {"code": "fastag", "name": "FASTag", "icon": "🚗", "color": "from-cyan-500 to-blue-500"},
    {"code": "education", "name": "Education Fee", "icon": "🎓", "color": "from-violet-500 to-purple-600"},
    {"code": "municipal", "name": "Municipal Tax", "icon": "🏛️", "color": "from-teal-500 to-cyan-600"},
]

BILLERS = {
    "electricity": [
        {"code": "TATAPOWER", "name": "Tata Power"}, {"code": "ADANI", "name": "Adani Electricity"},
        {"code": "BSES_RAJDHANI", "name": "BSES Rajdhani"}, {"code": "BSES_YAMUNA", "name": "BSES Yamuna"},
        {"code": "TORRENT", "name": "Torrent Power"}, {"code": "MSEB", "name": "Maharashtra State Electricity"},
        {"code": "WBSEDCL", "name": "WBSEDCL"}, {"code": "TNEB", "name": "Tamil Nadu EB"},
        {"code": "KSEB", "name": "Kerala State Electricity Board"}, {"code": "BESCOM", "name": "BESCOM Bangalore"},
    ],
    "water": [
        {"code": "DJB", "name": "Delhi Jal Board"}, {"code": "BMC", "name": "BMC Mumbai Water"},
        {"code": "BWSSB", "name": "Bangalore Water Supply"}, {"code": "CHENNAI_METROWATER", "name": "Chennai Metrowater"},
        {"code": "HMWSSB", "name": "Hyderabad Water"},
    ],
    "gas": [
        {"code": "IGL", "name": "Indraprastha Gas"}, {"code": "MGL", "name": "Mahanagar Gas"},
        {"code": "ADANI_GAS", "name": "Adani Total Gas"}, {"code": "GGL", "name": "Gujarat Gas"},
    ],
    "broadband": [
        {"code": "JIO_FIBER", "name": "Jio Fiber"}, {"code": "AIRTEL_XSTREAM", "name": "Airtel Xstream"},
        {"code": "ACT", "name": "ACT Fibernet"}, {"code": "HATHWAY", "name": "Hathway"},
        {"code": "EXCITEL", "name": "Excitel"}, {"code": "BSNL_BB", "name": "BSNL Broadband"},
    ],
    "landline": [
        {"code": "BSNL_LL", "name": "BSNL Landline"}, {"code": "AIRTEL_LL", "name": "Airtel Landline"},
        {"code": "MTNL", "name": "MTNL Landline"},
    ],
    "dth": [
        {"code": "TATA_PLAY", "name": "Tata Play"}, {"code": "DISH_TV", "name": "Dish TV"},
        {"code": "D2H", "name": "D2H"}, {"code": "AIRTEL_DTH", "name": "Airtel Digital TV"},
        {"code": "SUN_DIRECT", "name": "Sun Direct"},
    ],
    "insurance": [
        {"code": "LIC", "name": "LIC of India"}, {"code": "HDFC_LIFE", "name": "HDFC Life"},
        {"code": "ICICI_PRU", "name": "ICICI Prudential"}, {"code": "SBI_LIFE", "name": "SBI Life"},
        {"code": "BAJAJ_ALLIANZ", "name": "Bajaj Allianz"},
    ],
    "lpg": [
        {"code": "INDANE", "name": "Indane Gas"}, {"code": "HP_GAS", "name": "HP Gas"}, {"code": "BHARAT_GAS", "name": "Bharat Gas"},
    ],
    "credit_card": [
        {"code": "HDFC_CC", "name": "HDFC Credit Card"}, {"code": "ICICI_CC", "name": "ICICI Credit Card"},
        {"code": "SBI_CC", "name": "SBI Credit Card"}, {"code": "AXIS_CC", "name": "Axis Credit Card"},
        {"code": "KOTAK_CC", "name": "Kotak Credit Card"}, {"code": "AMEX", "name": "American Express"},
    ],
    "fastag": [
        {"code": "PAYTM_FASTAG", "name": "Paytm FASTag"}, {"code": "ICICI_FASTAG", "name": "ICICI FASTag"},
        {"code": "HDFC_FASTAG", "name": "HDFC FASTag"}, {"code": "AXIS_FASTAG", "name": "Axis FASTag"},
    ],
    "education": [
        {"code": "GENERIC_SCHOOL", "name": "School / College Fee"}, {"code": "BYJUS", "name": "Byju's"},
    ],
    "municipal": [
        {"code": "MCD", "name": "MCD Delhi"}, {"code": "BMC_TAX", "name": "BMC Mumbai"}, {"code": "GHMC", "name": "GHMC Hyderabad"},
    ],
}

@api_router.get("/bills/categories")
async def bills_categories(request: Request):
    await get_current_user(request)
    return {"categories": BILLER_CATEGORIES}

@api_router.get("/bills/billers/{category}")
async def bills_billers(category: str, request: Request):
    await get_current_user(request)
    billers = BILLERS.get(category, [])
    return {"category": category, "billers": billers}

@api_router.post("/bills/pay")
async def pay_bill(req: BillPaymentRequest, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if user_doc.get("blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked. Contact support.")

    # PIN mandatory
    if not user_doc.get("pin_hash"):
        raise HTTPException(status_code=400, detail="PIN not set. Please setup PIN from Profile.")
    if not req.pin or not verify_password(req.pin, user_doc["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    coin_settings = await get_coin_settings()
    coins_used = max(0, int(req.coins_used or 0))
    if not coin_settings["enabled"]:
        coins_used = 0
    if coins_used > coin_settings["max_coins_per_recharge"]:
        raise HTTPException(status_code=400, detail=f"Max {coin_settings['max_coins_per_recharge']} coins allowed")
    if coins_used > int(user_doc.get("coins", 0)):
        raise HTTPException(status_code=400, detail="Insufficient coins balance")

    coin_discount = round(coins_used / coin_settings["coins_per_rupee"], 2) if coin_settings["coins_per_rupee"] > 0 else 0.0
    # 1% cashback for bill payments as coins
    cashback = round(float(req.amount) * 0.01, 2)
    final_amount = max(0.0, round(float(req.amount) - coin_discount, 2))

    if req.payment_mode == "e_wallet":
        if float(user_doc.get("e_wallet", 0.0)) < final_amount:
            raise HTTPException(status_code=400, detail="Insufficient E-Wallet balance")
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"e_wallet": -final_amount}})
    elif req.payment_mode == "main_wallet":
        if float(user_doc.get("main_wallet", 0.0)) < final_amount:
            raise HTTPException(status_code=400, detail="Insufficient Main Wallet balance")
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"main_wallet": -final_amount}})
    else:
        raise HTTPException(status_code=400, detail="Invalid payment mode")

    if coins_used > 0:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"coins": -coins_used}})

    coins_earned = int(round(cashback * coin_settings["coins_per_rupee"])) if cashback > 0 else 0
    if coins_earned > 0:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"coins": coins_earned}})

    status = random.choice(["success", "success", "success", "pending"])
    bill_doc = {
        "user_id": user["_id"],
        "biller_category": req.biller_category,
        "biller_code": req.biller_code,
        "biller_name": req.biller_name,
        "consumer_number": req.consumer_number,
        "consumer_name": req.consumer_name,
        "amount": float(req.amount),
        "coins_used": coins_used,
        "coin_discount": coin_discount,
        "cashback": cashback,
        "coins_earned": coins_earned,
        "final_amount": final_amount,
        "payment_mode": req.payment_mode,
        "status": status,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.bill_payments.insert_one(bill_doc)

    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "bill_payment",
        "amount": -final_amount,
        "cashback": cashback,
        "coins_used": coins_used,
        "status": status,
        "description": f"{req.biller_name} · {req.consumer_number} · ₹{req.amount}",
        "created_at": datetime.now(timezone.utc)
    })

    await db.notifications.insert_one({
        "user_id": user["_id"],
        "title": f"Bill Payment {status.title()}",
        "message": f"₹{req.amount} paid to {req.biller_name} ({req.consumer_number}). {coins_earned} coins credited." if status == "success" else f"₹{req.amount} bill payment pending for {req.biller_name}.",
        "type": "bill_payment",
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })

    return {
        "message": "Bill payment initiated",
        "status": status,
        "bill_id": str(result.inserted_id),
        "amount": float(req.amount),
        "cashback": cashback,
        "coin_discount": coin_discount,
        "coins_used": coins_used,
        "coins_earned": coins_earned,
        "final_amount": final_amount
    }

@api_router.get("/bills/history")
async def my_bill_payments(request: Request, limit: int = 50):
    user = await get_current_user(request)
    items = await db.bill_payments.find({"user_id": user["_id"]}).sort("created_at", -1).limit(min(limit, 200)).to_list(None)
    for b in items:
        b["_id"] = str(b["_id"])
        if isinstance(b.get("created_at"), datetime):
            b["created_at"] = b["created_at"].isoformat()
    return {"bills": items}

# --- Firebase public config ---

@api_router.get("/config/firebase")
async def firebase_public_config():
    from firebase_config import FIREBASE_CONFIG
    return FIREBASE_CONFIG

# --- Include Router & Middleware (MUST be after ALL route definitions) ---

app.include_router(api_router)

# Mount uploads AFTER router so /api/uploads serves static files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_origin_regex=r"https://.*\.preview\.emergentagent\.com",
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
