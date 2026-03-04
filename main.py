import random
import smtplib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from pymongo import MongoClient
import os
from dotenv import load_dotenv


load_dotenv()

app = FastAPI()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Temporary database
users_db = {}

# OTP storage
otp_storage = {}

# -------------------------
# MODELS
# -------------------------
class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class VerifyOTP(BaseModel):
    email: str
    otp: str

# -------------------------
# HELPER FUNCTIONS
# -------------------------
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)

def generate_and_send_otp(email: str, role: str):
    otp = str(random.randint(100000, 999999))

    otp_storage[email] = {
        "otp": otp,
        "expiry": datetime.now() + timedelta(minutes=5),
        "role": role
    }

    msg = MIMEText(f"Your OTP is {otp}. Valid for 5 minutes.")
    msg["Subject"] = "AI Lawyer OTP Verification"
    msg["From"] = EMAIL_USER
    msg["To"] = email

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(EMAIL_USER, EMAIL_PASS)
    server.send_message(msg)
    server.quit()

# -------------------------
# REGISTER
# -------------------------
@app.post("/register")
def register(data: RegisterRequest):
    if data.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(data.password)

    users_db[data.email] = {
        "password": hashed,
        "role": data.role
    }

    generate_and_send_otp(data.email, data.role)

    return {"message": "OTP sent for registration"}

# -------------------------
# LOGIN
# -------------------------
@app.post("/login")
def login(data: LoginRequest):
    if data.email not in users_db:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(data.password, users_db[data.email]["password"]):
        raise HTTPException(status_code=400, detail="Wrong password")

    generate_and_send_otp(data.email, data.role)

    return {"message": "OTP sent for login"}

# -------------------------
# VERIFY OTP
# -------------------------
@app.post("/verify-otp")
def verify_otp(data: VerifyOTP):
    if data.email not in otp_storage:
        raise HTTPException(status_code=400, detail="No OTP found")

    stored = otp_storage[data.email]

    if datetime.now() > stored["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    if stored["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    return {"message": "OTP verified", "role": stored["role"]}


load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(MONGO_URL)
db = client["ai_lawyer"]
users_collection = db["users"]
