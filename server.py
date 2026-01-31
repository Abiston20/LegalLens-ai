
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, DateTime, ForeignKey, select, delete, update, func, Float
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional, List
import random
import jwt
import os
import logging
import sys
import uuid
import urllib.parse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("LEGALLENS-BACKEND")

app = FastAPI(title="LEGALLENS Backend")

# Enable CORS - Broadly permissive for development/demo purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
# Password '@' must be encoded as '%40' if used in connection strings
DB_PASS = urllib.parse.quote_plus("Abiston@2005")
SUPABASE_URL = os.getenv("DATABASE_URL", f"postgresql+asyncpg://postgres:{DB_PASS}@db.jtdpfphlseitoinlovoo.supabase.co:5432/postgres")
SECRET_KEY = os.getenv("JWT_SECRET", "DEV_FALLBACK_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

# Database Setup
engine = create_async_engine(SUPABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# --- SQL Models ---

class User(Base):
    __tablename__ = "users"
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20))
    bar_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class LegalQuery(Base):
    __tablename__ = "legal_queries"
    query_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"))
    query_text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    ai_response = relationship("AIResponse", back_populates="query", cascade="all, delete-orphan")

class AIResponse(Base):
    __tablename__ = "ai_responses"
    response_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    query_id: Mapped[str] = mapped_column(ForeignKey("legal_queries.query_id"))
    response_text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    query = relationship("LegalQuery", back_populates="ai_response")

class Registration(Base):
    __tablename__ = "_temp_registrations"
    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50))
    bar_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    otp: Mapped[str] = mapped_column(String(10))

class OtpSession(Base):
    __tablename__ = "_temp_otp_sessions"
    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    otp: Mapped[str] = mapped_column(String(10))

# --- Pydantic Request Models ---

class RegisterSchema(BaseModel):
    name: str
    email: str
    user_type: str
    bar_id: Optional[str] = None

class LoginSchema(BaseModel):
    identifier: str

class VerifySchema(BaseModel):
    identifier: str
    otp: str

class ChatSchema(BaseModel):
    query_text: str
    response_text: str

# --- Dependency ---

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# --- Auth ---

security = HTTPBearer(auto_error=False)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication Required")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Session Expired")

# --- Routes ---

@app.on_event("startup")
async def startup_db_client():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database synced.")
    except Exception as e:
        logger.error(f"DB Error: {e}")

@app.get("/ping")
async def ping():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}

@app.post("/auth/register")
async def register(req: RegisterSchema, db: AsyncSession = Depends(get_db)):
    otp = str(random.randint(100000, 999999))
    db_role = "lawyer" if req.user_type == "advocate" else "user"
    await db.merge(Registration(email=req.email, name=req.name, role=db_role, bar_id=req.bar_id, otp=otp))
    await db.commit()
    logger.info(f"OTP -> {req.email}: {otp}")
    return {"status": "success"}

@app.post("/auth/send-otp")
async def send_otp(req: LoginSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.identifier))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Account not found. Please register first.")
    otp = str(random.randint(100000, 999999))
    await db.merge(OtpSession(email=req.identifier, otp=otp))
    await db.commit()
    logger.info(f"OTP -> {req.identifier}: {otp}")
    return {"status": "success"}

@app.post("/auth/verify-otp")
async def verify_otp(req: VerifySchema, db: AsyncSession = Depends(get_db)):
    reg = (await db.execute(select(Registration).where(Registration.email == req.identifier, Registration.otp == req.otp))).scalar_one_or_none()
    ses = (await db.execute(select(OtpSession).where(OtpSession.email == req.identifier, OtpSession.otp == req.otp))).scalar_one_or_none()
    
    if not reg and not ses:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    
    if reg:
        new_user = User(email=reg.email, name=reg.name, role=reg.role, bar_id=reg.bar_id)
        await db.merge(new_user)
        await db.delete(reg)
    else:
        await db.delete(ses)
    
    await db.commit()
    user = (await db.execute(select(User).where(User.email == req.identifier))).scalar_one()
    fe_type = "advocate" if user.role == "lawyer" else "citizen"
    token = create_access_token({"sub": user.email, "uid": user.user_id, "user_type": fe_type, "name": user.name})
    return {"access_token": token, "user_id": user.user_id, "name": user.name, "user_type": fe_type}

@app.post("/legal/chat")
async def save_chat(req: ChatSchema, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = LegalQuery(user_id=user["uid"], query_text=req.query_text)
    db.add(q)
    await db.flush()
    db.add(AIResponse(query_id=q.query_id, response_text=req.response_text))
    await db.commit()
    return {"status": "success"}

@app.get("/legal/chat")
async def get_history(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LegalQuery).where(LegalQuery.user_id == user["uid"]).order_by(LegalQuery.created_at.asc()))
    history = []
    for q in res.scalars().all():
        history.append({"role": "user", "content": q.query_text, "timestamp": q.created_at.isoformat()})
        resp = (await db.execute(select(AIResponse).where(AIResponse.query_id == q.query_id))).scalar_one_or_none()
        if resp:
            history.append({"role": "ai", "content": resp.response_text, "timestamp": resp.created_at.isoformat()})
    return history

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
