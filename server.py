
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, DateTime, ForeignKey, select, delete, update, func, Float, Enum as SQLEnum
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional, List
import random
import jwt
import os
import logging
import sys
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("LEGALLENS-BACKEND")

app = FastAPI(title="LEGALLENS Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
# Note: @ in password must be encoded as %40 for the connection string
SUPABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:Abiston%402005@db.jtdpfphlseitoinlovoo.supabase.co:5432/postgres")
SECRET_KEY = os.getenv("JWT_SECRET", "DEV_FALLBACK_SECRET_KEY_FOR_LOCAL_USE")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

# Database Setup
engine = create_async_engine(SUPABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# --- SQL Models (Supabase Schema) ---

class User(Base):
    __tablename__ = "users"
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Optional for OTP flow
    role: Mapped[str] = mapped_column(String(20)) # user, admin, lawyer
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class LegalQuery(Base):
    __tablename__ = "legal_queries"
    query_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"))
    query_text: Mapped[str] = mapped_column(Text)
    query_type: Mapped[Optional[str]] = mapped_column(String(100)) # Civil, Criminal, etc
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class AIResponse(Base):
    __tablename__ = "ai_responses"
    response_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    query_id: Mapped[str] = mapped_column(ForeignKey("legal_queries.query_id"))
    response_text: Mapped[str] = mapped_column(Text)
    confidence_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class Document(Base):
    __tablename__ = "documents"
    doc_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"))
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[Optional[str]] = mapped_column(Text)
    doc_type: Mapped[Optional[str]] = mapped_column(String(100)) # Contract, Notice, etc
    analysis_text: Mapped[Optional[str]] = mapped_column(Text) # Result of AI analysis
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ExtractedClause(Base):
    __tablename__ = "extracted_clauses"
    clause_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id: Mapped[str] = mapped_column(ForeignKey("documents.doc_id"))
    section: Mapped[str] = mapped_column(String(255)) # IPC/CPC section
    description: Mapped[str] = mapped_column(Text)

class EmbeddingMetadata(Base):
    __tablename__ = "embeddings_metadata"
    embed_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id: Mapped[str] = mapped_column(ForeignKey("documents.doc_id"))
    vector_ref: Mapped[str] = mapped_column(Text) # FAISS/Chroma ID
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

# Temporary tables for Auth flow (OTP)
class Registration(Base):
    __tablename__ = "_temp_registrations"
    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50))
    bar_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    otp: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class OtpSession(Base):
    __tablename__ = "_temp_otp_sessions"
    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    otp: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- Dependency ---

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# --- Auth & Security ---

security = HTTPBearer(auto_error=False)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authorization header.")
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if "uid" not in payload:
            raise HTTPException(status_code=401, detail="Invalid token session.")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed.")

# --- Pydantic Models ---

class UserType(str, Enum):
    ADVOCATE = "advocate"
    CITIZEN = "citizen"

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    user_type: UserType
    bar_id: Optional[str] = None

class LoginRequest(BaseModel):
    identifier: str

class OtpVerifyRequest(BaseModel):
    identifier: str
    otp: str

class LogDocumentRequest(BaseModel):
    name: str
    analysis: str

# --- App Logic ---

@app.on_event("startup")
async def startup_db_client():
    logger.info("Initializing Supabase Schema...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Supabase tables verified successfully.")
    except Exception as e:
        logger.error(f"CRITICAL: Supabase connection failed: {e}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "db": "supabase", "timestamp": datetime.now(timezone.utc)}

@app.post("/auth/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This email is already registered.")

    otp = str(random.randint(100000, 999999))
    
    # Map frontend userType to DB role
    db_role = "lawyer" if request.user_type == UserType.ADVOCATE else "user"

    reg = Registration(
        email=request.email,
        name=request.name,
        role=db_role,
        bar_id=request.bar_id,
        otp=otp
    )
    await db.merge(reg)
    await db.commit()
    
    logger.info(f"REGISTRATION OTP [{db_role}] -> {request.email}: {otp}")
    return {"status": "success", "message": "OTP sent."}

@app.post("/auth/send-otp")
async def send_otp(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.identifier))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="No account found. Please register first.")
    
    otp = str(random.randint(100000, 999999))
    session = OtpSession(email=request.identifier, otp=otp)
    await db.merge(session)
    await db.commit()
    
    logger.info(f"LOGIN OTP -> {request.identifier}: {otp}")
    return {"status": "success", "message": "OTP sent."}

@app.post("/auth/verify-otp")
async def verify_otp(request: OtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    reg_res = await db.execute(select(Registration).where(Registration.email == request.identifier, Registration.otp == request.otp))
    reg_data = reg_res.scalar_one_or_none()
    
    login_res = await db.execute(select(OtpSession).where(OtpSession.email == request.identifier, OtpSession.otp == request.otp))
    login_data = login_res.scalar_one_or_none()
    
    if not reg_data and not login_data:
        raise HTTPException(status_code=401, detail="Invalid OTP.")
    
    if reg_data:
        new_user = User(
            email=reg_data.email,
            name=reg_data.name,
            role=reg_data.role
        )
        await db.merge(new_user)
        await db.delete(reg_data)
    else:
        await db.delete(login_data)
        
    await db.commit()

    user_res = await db.execute(select(User).where(User.email == request.identifier))
    user = user_res.scalar_one()
    
    # Map DB role back to frontend userType
    fe_user_type = "advocate" if user.role == "lawyer" else "citizen"

    token = create_access_token({
        "sub": user.email, 
        "user_type": fe_user_type, 
        "uid": user.user_id,
        "name": user.name
    })
    
    return {
        "access_token": token,
        "user_id": user.user_id,
        "name": user.name,
        "user_type": fe_user_type
    }

@app.post("/legal/log-document")
async def log_document(request: LogDocumentRequest, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        new_doc = Document(
            user_id=current_user["uid"],
            file_name=request.name,
            analysis_text=request.analysis,
            doc_type="Automated Analysis"
        )
        db.add(new_doc)
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Supabase Doc Log Error: {e}")
        raise HTTPException(status_code=500, detail="DB Error")

@app.get("/legal/my-documents")
async def get_my_documents(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.user_id == current_user["uid"]).order_by(Document.uploaded_at.desc()))
    docs = result.scalars().all()
    return [{
        "id": str(d.doc_id),
        "name": d.file_name,
        "analysis": d.analysis_text,
        "uploadDate": d.uploaded_at.isoformat()
    } for d in docs]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
