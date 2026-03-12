import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pg from "pg";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const router = Router();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

function createMailTransport() {
  const user = process.env.GMAIL_USER || "47dapunjab@gmail.com";
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function validateEmailDomain(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

async function sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  const transport = createMailTransport();
  if (!transport) {
    console.warn("GMAIL_APP_PASSWORD not set — cannot send verification email");
    return false;
  }
  try {
    await transport.sendMail({
      from: '"47daPunjab" <47dapunjab@gmail.com>',
      to: toEmail,
      subject: "Verify Your 47daPunjab Account",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden;">
          <div style="background:#0D7C3D;padding:24px 32px;">
            <h2 style="color:#fff;margin:0;font-size:22px;">47daPunjab</h2>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Email Verification</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#333;font-size:15px;margin:0 0 16px;">Welcome! Please verify your email using the code below. It expires in <strong>15 minutes</strong>.</p>
            <div style="background:#fff;border:2px solid #0D7C3D;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0D7C3D;">${code}</span>
            </div>
            <p style="color:#666;font-size:13px;margin:0;">If you didn't create this account, ignore this email.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("Failed to send verification email:", e);
    return false;
  }
}

async function sendResetCodeEmail(toEmail: string, code: string): Promise<boolean> {
  const transport = createMailTransport();
  if (!transport) {
    console.warn("GMAIL_APP_PASSWORD not set — cannot send reset email");
    return false;
  }
  try {
    await transport.sendMail({
      from: '"47daPunjab" <47dapunjab@gmail.com>',
      to: toEmail,
      subject: "Your 47daPunjab Password Reset Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden;">
          <div style="background:#0D7C3D;padding:24px 32px;">
            <h2 style="color:#fff;margin:0;font-size:22px;">47daPunjab</h2>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Password Reset Request</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#333;font-size:15px;margin:0 0 16px;">You requested a password reset. Use the code below to set a new password. It expires in <strong>15 minutes</strong>.</p>
            <div style="background:#fff;border:2px solid #0D7C3D;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0D7C3D;">${code}</span>
            </div>
            <p style="color:#666;font-size:13px;margin:0;">If you didn't request this, ignore this email — your password won't change.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("Failed to send reset email:", e);
    return false;
  }
}

const ADMIN_EMAILS = ["47dapunjab@gmail.com"];

const pendingNativeTokens = new Map<string, { token: string; userId: number; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingNativeTokens) {
    if (now > val.expiresAt) pendingNativeTokens.delete(key);
  }
}, 60 * 1000);

function generateAuthToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function createAuthToken(userId: number): Promise<string> {
  const token = generateAuthToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO auth_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = $2, expires_at = $3`,
    [token, userId, expiresAt]
  );
  return token;
}

async function getUserFromToken(token: string): Promise<any | null> {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.phone, u.city, u.country, u.purpose, u.role, u.avatar_url, u.provider
     FROM auth_tokens t JOIN auth_users u ON t.user_id = u.id
     WHERE t.token = $1 AND t.expires_at > NOW()`,
    [token]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

function getBearerToken(req: Request): string | null {
  const auth = req.header("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

async function getUserId(req: Request): Promise<number | null> {
  const sessionUserId = (req.session as any)?.userId;
  if (sessionUserId) return sessionUserId;

  const token = getBearerToken(req);
  if (token) {
    const user = await getUserFromToken(token);
    if (user) return user.id;
  }
  return null;
}

function getBaseUrl(req: Request): string {
  const forwardedProto = (req.header("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
  const forwardedHost = (req.header("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return `${forwardedProto}://${forwardedHost}`;
}

function getOAuthRedirectBase(): string {
  if (process.env.OAUTH_BASE_URL) {
    return process.env.OAUTH_BASE_URL.replace(/\/+$/, "");
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  return "https://47dapunjab.com";
}

const oauthCallbackHtml = (success: boolean, message: string, token?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${success ? "Login Successful" : "Login Failed"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: linear-gradient(135deg, #053B2F 0%, #0A6847 100%);
      color: #fff; text-align: center; padding: 20px;
    }
    .card {
      background: rgba(255,255,255,0.12); backdrop-filter: blur(10px);
      border-radius: 20px; padding: 40px 30px; max-width: 380px; width: 100%;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; opacity: 0.85; line-height: 1.5; margin-bottom: 20px; }
    .btn {
      display: inline-block; background: #D4A843; color: #053B2F;
      padding: 14px 32px; border-radius: 12px; font-weight: 600;
      text-decoration: none; font-size: 15px; cursor: pointer; border: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "&#10003;" : "&#10007;"}</div>
    <h1>${success ? "Welcome to 47daPunjab!" : "Login Failed"}</h1>
    <p>${message}</p>
    <p style="font-size:12px;opacity:0.7;">${success ? "Redirecting you back..." : "You can close this window and try again."}</p>
    <script>
      ${success ? `
      try {
        var origins = ['*'];
        var payload = { type: '47da-oauth-success'${token ? `, token: '${token}'` : ''} };
        if (window.opener) {
          window.opener.postMessage(payload, '*');
          setTimeout(function(){ window.close(); }, 1500);
        } else {
          window.location.href = '/';
        }
      } catch(e) {
        window.location.href = '/';
      }
      ` : ""}
    </script>
  </div>
</body>
</html>`;

router.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (!checkRateLimit(`register:${email.toLowerCase()}`, 3, 10 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many registration attempts. Please try again in 10 minutes." });
    }
    const validDomain = await validateEmailDomain(email);
    if (!validDomain) {
      return res.status(400).json({ error: "This email domain does not appear to be valid. Please use a real email address." });
    }
    const existing = await pool.query("SELECT id, provider, email_verified FROM auth_users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      const ex = existing.rows[0];
      if (ex.provider !== "email") {
        return res.status(409).json({ error: `An account with this email already exists via ${ex.provider}. Please use ${ex.provider} login.` });
      }
      if (!ex.email_verified) {
        const vCode = crypto.randomInt(100000, 999999).toString();
        const vExpires = new Date(Date.now() + 15 * 60 * 1000);
        await pool.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [ex.id, vCode, vExpires]);
        await sendVerificationEmail(email.toLowerCase(), vCode);
        return res.status(409).json({ error: "An account with this email exists but is not verified. A new verification code has been sent.", needsVerification: true, email: email.toLowerCase() });
      }
      return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      `INSERT INTO auth_users (email, password_hash, name, phone, role, provider, email_verified, verification_code, verification_code_expires) 
       VALUES ($1, $2, $3, $4, $5, 'email', false, $6, $7)`,
      [email.toLowerCase(), passwordHash, name, phone || "", assignedRole, verificationCode, verificationExpires]
    );
    const sent = await sendVerificationEmail(email.toLowerCase(), verificationCode);
    if (!sent) {
      console.error("Email service unavailable during registration for:", email);
      return res.status(503).json({ error: "Email service is temporarily unavailable. Please try again later or contact 47dapunjab@gmail.com." });
    }
    res.json({ success: true, needsVerification: true, email: email.toLowerCase(), message: "Account created! Please check your email for a 6-digit verification code." });
  } catch (e: any) {
    console.error("Register error:", e);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/api/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }
    if (!checkRateLimit(`verify:${email.toLowerCase()}`, 5, 5 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many verification attempts. Please wait 5 minutes and try again." });
    }
    const result = await pool.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider, email_verified, verification_code, verification_code_expires FROM auth_users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email" });
    }
    const user = result.rows[0];
    if (user.email_verified) {
      return res.json({ success: true, message: "Email is already verified. You can sign in." });
    }
    if (!user.verification_code || user.verification_code !== code) {
      return res.status(400).json({ error: "Invalid verification code. Please check and try again." });
    }
    if (new Date() > new Date(user.verification_code_expires)) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }
    await pool.query(
      "UPDATE auth_users SET email_verified = true, verification_code = NULL, verification_code_expires = NULL, updated_at = NOW() WHERE id = $1",
      [user.id]
    );
    (req.session as any).userId = user.id;
    const token = await createAuthToken(user.id);
    const { verification_code, verification_code_expires, email_verified, password_hash, ...safeUser } = user;
    res.json({ success: true, user: { ...safeUser, email_verified: true }, token, message: "Email verified successfully! Welcome to 47daPunjab." });
  } catch (e: any) {
    console.error("Verify email error:", e);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

router.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!checkRateLimit(`resend:${email.toLowerCase()}`, 3, 5 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many requests. Please wait 5 minutes before trying again." });
    }
    const result = await pool.query("SELECT id, email_verified FROM auth_users WHERE email = $1", [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email" });
    }
    if (result.rows[0].email_verified) {
      return res.json({ success: true, message: "Email is already verified. You can sign in." });
    }
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [result.rows[0].id, code, expires]);
    const sent = await sendVerificationEmail(email.toLowerCase(), code);
    if (!sent) {
      return res.status(503).json({ error: "Email service is not available. Please contact 47dapunjab@gmail.com." });
    }
    res.json({ success: true, message: "Verification code sent! Check your email." });
  } catch (e: any) {
    console.error("Resend verification error:", e);
    res.status(500).json({ error: "Failed to resend verification code." });
  }
});

router.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!checkRateLimit(`login:${email.toLowerCase()}`, 5, 5 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many login attempts. Please try again in 5 minutes." });
    }
    const result = await pool.query(
      "SELECT id, email, password_hash, name, phone, city, country, purpose, role, avatar_url, provider, email_verified FROM auth_users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "No account found with this email. Please sign up first." });
    }
    const user = result.rows[0];
    if (user.provider !== "email" && !user.password_hash) {
      return res.status(401).json({ error: `This account was created with ${user.provider}. Please use the ${user.provider} button to sign in.` });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect password. Please try again." });
    }
    if (user.email_verified === false) {
      const vCode = crypto.randomInt(100000, 999999).toString();
      const vExpires = new Date(Date.now() + 15 * 60 * 1000);
      await pool.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [user.id, vCode, vExpires]);
      await sendVerificationEmail(email.toLowerCase(), vCode);
      return res.status(403).json({ error: "Please verify your email before logging in. A new verification code has been sent.", needsVerification: true, email: email.toLowerCase() });
    }
    (req.session as any).userId = user.id;
    const { password_hash, email_verified, ...safeUser } = user;
    const token = await createAuthToken(user.id);
    res.json({ user: safeUser, token, message: "Welcome back!" });
  } catch (e: any) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/api/auth/smart-login", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!checkRateLimit(`smartlogin:${email.toLowerCase()}`, 5, 5 * 60 * 1000)) {
      return res.status(429).json({ error: "Too many login attempts. Please try again in 5 minutes." });
    }
    const existing = await pool.query(
      "SELECT id, email, password_hash, name, phone, city, country, purpose, role, avatar_url, provider, email_verified FROM auth_users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (user.provider !== "email" && !user.password_hash) {
        return res.status(401).json({ error: `This account uses ${user.provider} login. Please use the ${user.provider} button instead.` });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      }
      if (user.email_verified === false) {
        const vCode = crypto.randomInt(100000, 999999).toString();
        const vExpires = new Date(Date.now() + 15 * 60 * 1000);
        await pool.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [user.id, vCode, vExpires]);
        await sendVerificationEmail(email.toLowerCase(), vCode);
        return res.status(403).json({ error: "Please verify your email before logging in. A new verification code has been sent.", needsVerification: true, email: email.toLowerCase() });
      }
      (req.session as any).userId = user.id;
      const { password_hash, email_verified, ...safeUser } = user;
      const smartToken = await createAuthToken(user.id);
      return res.json({ user: safeUser, token: smartToken, message: "Welcome back!", isNewUser: false });
    }
    if (!name) {
      return res.status(404).json({ error: "No account found. Please provide your name to create one.", needsSignup: true });
    }
    const validDomain = await validateEmailDomain(email);
    if (!validDomain) {
      return res.status(400).json({ error: "This email domain does not appear to be valid. Please use a real email address." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const loginRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      `INSERT INTO auth_users (email, password_hash, name, phone, role, provider, email_verified, verification_code, verification_code_expires) 
       VALUES ($1, $2, $3, $4, $5, 'email', false, $6, $7)`,
      [email.toLowerCase(), passwordHash, name, phone || "", loginRole, verificationCode, verificationExpires]
    );
    const sent = await sendVerificationEmail(email.toLowerCase(), verificationCode);
    if (!sent) {
      console.error("Email service unavailable during smart-login registration for:", email);
      return res.status(503).json({ error: "Email service is temporarily unavailable. Please try again later or contact 47dapunjab@gmail.com." });
    }
    res.json({ success: true, needsVerification: true, email: email.toLowerCase(), message: "Account created! Please check your email for a 6-digit verification code.", isNewUser: true });
  } catch (e: any) {
    console.error("Smart login error:", e);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
});

router.post("/api/auth/social", async (req: Request, res: Response) => {
  try {
    const { email, name, provider, providerId, avatarUrl } = req.body;
    if (!email || !provider) {
      return res.status(400).json({ error: "Email and provider are required" });
    }
    const existing = await pool.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
      [email.toLowerCase()]
    );
    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      await pool.query(
        "UPDATE auth_users SET provider = $2, provider_id = $3, avatar_url = COALESCE($4, avatar_url), email_verified = true, updated_at = NOW() WHERE id = $1",
        [user.id, provider, providerId || null, avatarUrl || null]
      );
      user.provider = provider;
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
      const result = await pool.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [email.toLowerCase(), name || "", provider, providerId || null, avatarUrl || null, assignedRole]
      );
      user = result.rows[0];
    }
    (req.session as any).userId = user.id;
    const socialToken = await createAuthToken(user.id);
    res.json({ user, token: socialToken });
  } catch (e: any) {
    console.error("Social login error:", e);
    res.status(500).json({ error: "Social login failed" });
  }
});

router.get("/api/auth/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: "Google login is not configured yet. Please use email login." });
  }
  const oauthBase = getOAuthRedirectBase();
  const redirectUri = `${oauthBase}/api/auth/google/callback`;
  const nonce = crypto.randomBytes(16).toString("hex");
  const platform = req.query.platform === "native" ? "native" : "web";
  const nativeSessionId = (req.query.nativeSessionId as string) || "";
  const state = nativeSessionId ? `${nonce}:${platform}:${nativeSessionId}` : `${nonce}:${platform}`;
  (req.session as any).oauthState = nonce;
  (req.session as any).save?.();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
    prompt: "select_account",
  });
  console.log(`Google OAuth: redirect_uri=${redirectUri}, platform=${platform}`);
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/api/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    const stateStr = (state as string) || "";
    const stateParts = stateStr.split(":");
    const nonce = stateParts[0] || stateStr;
    const platform = stateParts[1] || "web";
    const nativeSessionId = stateParts.length >= 3 ? stateParts.slice(2).join(":") : "";
    const isNative = platform === "native";

    const nativeSuccessPage = (message: string) => {
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login Successful</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#053B2F 0%,#0A6847 100%);color:#fff;text-align:center;padding:20px}.card{background:rgba(255,255,255,0.12);backdrop-filter:blur(10px);border-radius:20px;padding:40px 30px;max-width:380px;width:100%;border:1px solid rgba(255,255,255,0.15)}.icon{font-size:56px;margin-bottom:16px}h1{font-size:22px;font-weight:700;margin-bottom:8px}p{font-size:14px;opacity:0.85;line-height:1.5;margin-bottom:20px}</style></head>
<body><div class="card"><div class="icon">&#10003;</div><h1>Login Successful!</h1><p>${message}</p><p style="font-size:16px;font-weight:600;opacity:1;">Please close this window and return to the app.</p></div></body></html>`);
    };

    const nativeErrorPage = (message: string) => {
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login Failed</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#053B2F 0%,#0A6847 100%);color:#fff;text-align:center;padding:20px}.card{background:rgba(255,255,255,0.12);backdrop-filter:blur(10px);border-radius:20px;padding:40px 30px;max-width:380px;width:100%;border:1px solid rgba(255,255,255,0.15)}.icon{font-size:56px;margin-bottom:16px}h1{font-size:22px;font-weight:700;margin-bottom:8px}p{font-size:14px;opacity:0.85;line-height:1.5;margin-bottom:20px}</style></head>
<body><div class="card"><div class="icon">&#10007;</div><h1>Login Failed</h1><p>${message}</p><p>Please close this window and try again.</p></div></body></html>`);
    };

    if (error) {
      console.error(`Google OAuth error: ${error}, platform: ${platform}`);
      if (isNative) return nativeErrorPage(`Google login was cancelled: ${error}`);
      return res.send(oauthCallbackHtml(false, `Google login was cancelled or failed: ${error}`));
    }
    if (!code) {
      if (isNative) return nativeErrorPage("No authorization code received.");
      return res.send(oauthCallbackHtml(false, "No authorization code received from Google."));
    }
    if (!isNative) {
      const savedNonce = (req.session as any)?.oauthState;
      if (nonce && savedNonce && nonce !== savedNonce) {
        return res.send(oauthCallbackHtml(false, "Security check failed. Please try again."));
      }
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      if (isNative) return nativeErrorPage("Google OAuth is not configured.");
      return res.send(oauthCallbackHtml(false, "Google OAuth is not fully configured."));
    }
    const oauthBase = getOAuthRedirectBase();
    const redirectUri = `${oauthBase}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token error:", tokenData);
      if (isNative) return nativeErrorPage("Failed to get access token from Google.");
      return res.send(oauthCallbackHtml(false, "Failed to get access token from Google."));
    }
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json() as any;
    if (!googleUser.email) {
      if (isNative) return nativeErrorPage("Could not get your email from Google.");
      return res.send(oauthCallbackHtml(false, "Could not get your email from Google."));
    }
    const existing = await pool.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
      [googleUser.email.toLowerCase()]
    );
    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      await pool.query(
        "UPDATE auth_users SET provider = 'google', provider_id = $2, avatar_url = COALESCE($3, avatar_url), name = COALESCE(NULLIF(name, ''), $4), email_verified = true, verification_code = NULL, verification_code_expires = NULL, updated_at = NOW() WHERE id = $1",
        [user.id, googleUser.id, googleUser.picture, googleUser.name]
      );
      user.avatar_url = googleUser.picture || user.avatar_url;
      console.log("Google OAuth: linked existing account for", googleUser.email);
    } else {
      const gRole = ADMIN_EMAILS.includes(googleUser.email.toLowerCase()) ? "admin" : "user";
      const result = await pool.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role, email_verified)
         VALUES ($1, $2, 'google', $3, $4, $5, true) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [googleUser.email.toLowerCase(), googleUser.name || "", googleUser.id, googleUser.picture || null, gRole]
      );
      user = result.rows[0];
      console.log("Google OAuth: created new account for", googleUser.email);
    }
    (req.session as any).userId = user.id;
    delete (req.session as any).oauthState;

    if (isNative) {
      const token = await createAuthToken(user.id);
      if (nativeSessionId) {
        pendingNativeTokens.set(nativeSessionId, {
          token,
          userId: user.id,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
        console.log(`Google OAuth native: stored token for session ${nativeSessionId}, user ${user.email}`);
      }
      return nativeSuccessPage(`Signed in as ${user.name || user.email}.`);
    }

    const webToken = await createAuthToken(user.id);
    res.send(oauthCallbackHtml(true, `Signed in as ${user.name || user.email}. You can return to the app now.`, webToken));
  } catch (e: any) {
    console.error("Google callback error:", e);
    res.send(oauthCallbackHtml(false, "An error occurred during Google login. Please try again."));
  }
});

router.get("/api/auth/facebook", (req: Request, res: Response) => {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return res.status(503).json({ error: "Facebook login is not configured yet. Please use email login." });
  }
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
  const state = crypto.randomBytes(16).toString("hex");
  (req.session as any).oauthState = state;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email,public_profile",
    state,
  });
  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
});

router.get("/api/auth/facebook/callback", async (req: Request, res: Response) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      return res.send(oauthCallbackHtml(false, `Facebook login failed: ${error_description || error}`));
    }
    if (!code) {
      return res.send(oauthCallbackHtml(false, "No authorization code received from Facebook."));
    }
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) {
      return res.send(oauthCallbackHtml(false, "Facebook OAuth is not fully configured."));
    }
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      client_secret: appSecret,
      code: code as string,
    })}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Facebook token error:", tokenData);
      return res.send(oauthCallbackHtml(false, "Failed to get access token from Facebook."));
    }
    const userInfoRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`
    );
    const fbUser = await userInfoRes.json() as any;
    if (!fbUser.email) {
      return res.send(oauthCallbackHtml(false, "Could not get your email from Facebook. Please ensure your Facebook account has an email."));
    }
    const avatarUrl = fbUser.picture?.data?.url || null;
    const existing = await pool.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
      [fbUser.email.toLowerCase()]
    );
    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      await pool.query(
        "UPDATE auth_users SET provider = 'facebook', provider_id = $2, avatar_url = COALESCE($3, avatar_url), name = COALESCE(NULLIF(name, ''), $4), email_verified = true, updated_at = NOW() WHERE id = $1",
        [user.id, fbUser.id, avatarUrl, fbUser.name]
      );
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const fbRole = ADMIN_EMAILS.includes(fbUser.email.toLowerCase()) ? "admin" : "user";
      const result = await pool.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role, email_verified)
         VALUES ($1, $2, 'facebook', $3, $4, $5, true) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [fbUser.email.toLowerCase(), fbUser.name || "", fbUser.id, avatarUrl, fbRole]
      );
      user = result.rows[0];
    }
    (req.session as any).userId = user.id;
    delete (req.session as any).oauthState;
    res.send(oauthCallbackHtml(true, `Signed in as ${user.name || user.email}. You can return to the app now.`));
  } catch (e: any) {
    console.error("Facebook callback error:", e);
    res.send(oauthCallbackHtml(false, "An error occurred during Facebook login. Please try again."));
  }
});

router.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Please enter your email address" });
    }
    const result = await pool.query(
      "SELECT id, provider FROM auth_users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email. Please sign up first." });
    }
    const user = result.rows[0];
    if (user.provider !== "email") {
      return res.status(400).json({ error: `You signed up using ${user.provider === "google" ? "Google" : user.provider}. Please go back and log in using the "${user.provider === "google" ? "Sign in with Google" : user.provider}" button instead of resetting your password.`, socialProvider: user.provider });
    }
    const code = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      "UPDATE auth_users SET reset_code = $2, reset_code_expires = $3 WHERE id = $1",
      [user.id, code, expires]
    );
    const sent = await sendResetCodeEmail(email.toLowerCase(), code);
    if (!sent) {
      return res.status(503).json({ error: "Email service is not configured yet. Please contact 47dapunjab@gmail.com for your reset code." });
    }
    res.json({ success: true, message: "A 6-digit reset code has been sent to your email. It expires in 15 minutes." });
  } catch (e: any) {
    console.error("Forgot password error:", e);
    res.status(500).json({ error: "Failed to process reset request. Please try again." });
  }
});

router.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    const result = await pool.query(
      "SELECT id, reset_code, reset_code_expires FROM auth_users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email" });
    }
    const user = result.rows[0];
    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ error: "Invalid reset code. Please check and try again." });
    }
    if (new Date() > new Date(user.reset_code_expires)) {
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE auth_users SET password_hash = $2, reset_code = NULL, reset_code_expires = NULL, updated_at = NOW() WHERE id = $1",
      [user.id, passwordHash]
    );
    res.json({ success: true, message: "Password reset successfully! You can now sign in with your new password." });
  } catch (e: any) {
    console.error("Reset password error:", e);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

router.get("/api/auth/oauth/status", (_req: Request, res: Response) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    facebook: false,
  });
});

router.get("/api/auth/google/token-check", (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  const entry = pendingNativeTokens.get(sessionId);
  if (!entry) {
    return res.json({ ready: false });
  }
  if (Date.now() > entry.expiresAt) {
    pendingNativeTokens.delete(sessionId);
    return res.json({ ready: false, expired: true });
  }
  pendingNativeTokens.delete(sessionId);
  res.json({ ready: true, token: entry.token, userId: entry.userId });
});

router.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const result = await pool.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider, created_at FROM auth_users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ user: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ error: "Session check failed" });
  }
});

router.post("/api/auth/logout", async (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    await pool.query("DELETE FROM auth_tokens WHERE token = $1", [token]).catch(() => {});
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.put("/api/auth/profile", async (req: Request, res: Response) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { name, phone, city, country, purpose } = req.body;
    const result = await pool.query(
      `UPDATE auth_users SET name=$2, phone=$3, city=$4, country=$5, purpose=$6, updated_at=NOW() 
       WHERE id=$1 RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
      [userId, name || "", phone || "", city || "", country || "", purpose || ""]
    );
    res.json({ user: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

router.get("/api/auth/users", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const adminCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const result = await pool.query(
      "SELECT id, email, name, phone, role, provider, avatar_url, created_at FROM auth_users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.put("/api/auth/users/:id/role", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const adminCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const targetId = parseInt(req.params.id as string);
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    await pool.query("UPDATE auth_users SET role = $2, updated_at = NOW() WHERE id = $1", [targetId, role]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Role update failed" });
  }
});

router.delete("/api/auth/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const adminCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const targetId = parseInt(req.params.id as string);
    if (targetId === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    await pool.query("DELETE FROM auth_users WHERE id = $1", [targetId]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "User deletion failed" });
  }
});

export function tokenAuthMiddleware() {
  return async (req: Request, _res: Response, next: Function) => {
    if ((req.session as any)?.userId) {
      return next();
    }
    const token = getBearerToken(req);
    if (token) {
      try {
        const user = await getUserFromToken(token);
        if (user) {
          (req.session as any).userId = user.id;
        }
      } catch {}
    }
    next();
  };
}

export async function ensureAuthTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id)`);
  await pool.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6)`);
  await pool.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true`);
  await pool.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6)`);
  await pool.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMPTZ`);
}

export default router;
