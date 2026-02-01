
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, DateTime, ForeignKey, select, delete, update, func, Float, Boolean
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

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - Permanent Supabase Connection
DB_PASS = urllib.parse.quote_plus("Abiston@2005")
# PostgreSQL connection string for Supabase
SUPABASE_URL = f"postgresql+asyncpg://postgres:{DB_PASS}@db.jtdpfphlseitoinlovoo.supabase.co:5432/postgres"
SECRET_KEY = os.getenv("JWT_SECRET", "sb_publishable_SrWLN-xXmmBUrgarL3fBKg_TA3ynFDO")

# Database Setup
engine = create_async_engine(SUPABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# --- SQL Models (Permanent Cloud Schema) ---

class User(Base):
    __tablename__ = "users"
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20)) # 'lawyer' or 'user'
    bar_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    otp_secret: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class LegalQuery(Base):
    __tablename__ = "legal_queries"
    query_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"))
    query_text: Mapped[Text] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    ai_responses = relationship("AIResponse", back_populates="query", cascade="all, delete-orphan")

class AIResponse(Base):
    __tablename__ = "ai_responses"
    response_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    query_id: Mapped[str] = mapped_column(ForeignKey("legal_queries.query_id"))
    response_text: Mapped[Text] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    query = relationship("LegalQuery", back_populates="ai_responses")

class UserDocument(Base):
    __tablename__ = "user_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36))
    name: Mapped[str] = mapped_column(String(255))
    analysis: Mapped[Text] = mapped_column(Text)
    upload_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ClientDocument(Base):
    __tablename__ = "client_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_name: Mapped[str] = mapped_column(String(255))
    matter: Mapped[str] = mapped_column(String(255))
    file_name: Mapped[str] = mapped_column(String(255))
    content_base64: Mapped[Text] = mapped_column(Text)
    upload_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

# --- Dependency ---

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# --- Startup: Automated Table Creation ---

@app.on_event("startup")
async def startup_db_client():
    try:
        async with engine.begin() as conn:
            # This automatically creates all tables defined above in Supabase
            await conn.run_sync(Base.metadata.create_all)
        logger.info("LEGALLENS: Cloud Database Synchronized and Tables Created Successfully.")
    except Exception as e:
        logger.error(f"LEGALLENS: Cloud DB Initialization Failure: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
