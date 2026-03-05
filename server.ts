import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "legallens_secret_key_2025";
const PORT = 3000;

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

async function sendOTPEmail(email: string, otp: string) {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.log("------------------------------------------");
    console.log(`REAL-TIME SIMULATION: OTP for ${email} is ${otp}`);
    console.log("To send real emails, configure SMTP_USER and SMTP_PASS in .env");
    console.log("------------------------------------------");
    return;
  }

  const mailOptions = {
    from: `"LegalLens Security" <${user}>`,
    to: email,
    subject: "Your LegalLens Access Code",
    text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #4f46e5;">LegalLens Security</h2>
        <p>Your 6-digit access code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0;">${otp}</div>
        <p style="color: #6b7280; font-size: 14px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Database setup
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  // For development: Ensure schema is up to date by dropping and recreating the OTPs table
  // In production, you would use migrations.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      password TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    DROP TABLE IF EXISTS otps;
    CREATE TABLE IF NOT EXISTS otps (
      email TEXT PRIMARY KEY,
      otp_hash TEXT,
      expires_at DATETIME,
      attempts INTEGER DEFAULT 0
    );
  `);

  // API Routes
  app.post("/api/register", async (req, res) => {
    const { email, password, role, name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ detail: "Missing required fields" });
    }

    try {
      const existingUser = await db.get("SELECT * FROM users WHERE email = ?", [email]);
      if (existingUser) {
        return res.status(400).json({ detail: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = Math.random().toString(36).substring(2, 11);
      
      await db.run(
        "INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)",
        [userId, email, name || email.split('@')[0], hashedPassword, role]
      );

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHashed = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins as requested

      await db.run(
        "INSERT OR REPLACE INTO otps (email, otp_hash, expires_at, attempts) VALUES (?, ?, ?, 0)",
        [email, otpHashed, expiresAt.toISOString()]
      );

      await sendOTPEmail(email, otp);
      res.json({ message: "OTP sent to email" });
    } catch (err) {
      console.error("Registration Error:", err);
      res.status(500).json({ detail: "Internal server error during registration" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ detail: "Missing email" });
    }

    try {
      let user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
      
      // Optional: Create new user if doesn't exist (Phase 2 Step 4)
      if (!user) {
        const userId = Math.random().toString(36).substring(2, 11);
        await db.run(
          "INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)",
          [userId, email, email.split('@')[0], 'citizen']
        );
        user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHashed = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      await db.run(
        "INSERT OR REPLACE INTO otps (email, otp_hash, expires_at, attempts) VALUES (?, ?, ?, 0)",
        [email, otpHashed, expiresAt.toISOString()]
      );

      await sendOTPEmail(email, otp);
      res.json({ message: "OTP sent to email" });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ detail: "Internal server error during login" });
    }
  });

  app.post("/api/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ detail: "Missing email or OTP" });
    }

    try {
      const otpRecord = await db.get("SELECT * FROM otps WHERE email = ?", [email]);
      
      if (!otpRecord) {
        return res.status(401).json({ detail: "No OTP record found. Please request a new one." });
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        return res.status(401).json({ detail: "OTP expired. Please resend." });
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        return res.status(401).json({ detail: "Maximum attempts exceeded. Please request a new OTP." });
      }

      // Verify OTP
      const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
      
      if (!isMatch) {
        await db.run("UPDATE otps SET attempts = attempts + 1 WHERE email = ?", [email]);
        return res.status(401).json({ detail: "Incorrect OTP. Please try again." });
      }

      const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
      if (!user) {
        return res.status(404).json({ detail: "User not found" });
      }

      // Clear OTP from database (Phase 5 Step 14)
      await db.run("DELETE FROM otps WHERE email = ?", [email]);

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        token,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (err) {
      console.error("OTP Verification Error:", err);
      res.status(500).json({ detail: "Internal server error during verification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    console.log(`SMTP_USER: ${user ? "SET" : "NOT SET"}`);
    console.log(`SMTP_PASS: ${pass ? "SET" : "NOT SET"}`);
    console.log(`GEMINI_API_KEY: ${process.env.API_KEY ? "SET" : "NOT SET"}`);
  });
}

startServer();
