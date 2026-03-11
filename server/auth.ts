import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pg from "pg";
import crypto from "crypto";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const router = Router();

const ADMIN_EMAILS = ["47dapunjab@gmail.com"];

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
  const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host") || req.get("host");
  return `${forwardedProto}://${forwardedHost}`;
}

const oauthCallbackHtml = (success: boolean, message: string) => `
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
        if (window.opener) {
          window.opener.postMessage({ type: '47da-oauth-success' }, '*');
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
    const existing = await pool.query("SELECT id, provider FROM auth_users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      const existingProvider = existing.rows[0].provider;
      if (existingProvider !== "email") {
        return res.status(409).json({ error: `An account with this email already exists via ${existingProvider}. Please use ${existingProvider} login.` });
      }
      return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
    const result = await pool.query(
      `INSERT INTO auth_users (email, password_hash, name, phone, role, provider) 
       VALUES ($1, $2, $3, $4, $5, 'email') RETURNING id, email, name, phone, role, avatar_url, provider, created_at`,
      [email.toLowerCase(), passwordHash, name, phone || "", assignedRole]
    );
    const user = result.rows[0];
    (req.session as any).userId = user.id;
    const token = await createAuthToken(user.id);
    res.json({ user, token, message: "Account created successfully! Welcome to 47daPunjab." });
  } catch (e: any) {
    console.error("Register error:", e);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const result = await pool.query(
      "SELECT id, email, password_hash, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
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
    (req.session as any).userId = user.id;
    const { password_hash, ...safeUser } = user;
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
    const existing = await pool.query(
      "SELECT id, email, password_hash, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
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
      (req.session as any).userId = user.id;
      const { password_hash, ...safeUser } = user;
      const smartToken = await createAuthToken(user.id);
      return res.json({ user: safeUser, token: smartToken, message: "Welcome back!", isNewUser: false });
    }
    if (!name) {
      return res.status(404).json({ error: "No account found. Please provide your name to create one.", needsSignup: true });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const loginRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
    const result = await pool.query(
      `INSERT INTO auth_users (email, password_hash, name, phone, role, provider) 
       VALUES ($1, $2, $3, $4, $5, 'email') RETURNING id, email, name, phone, role, avatar_url, provider, created_at`,
      [email.toLowerCase(), passwordHash, name, phone || "", loginRole]
    );
    const newUser = result.rows[0];
    (req.session as any).userId = newUser.id;
    const newToken = await createAuthToken(newUser.id);
    res.json({ user: newUser, token: newToken, message: "Account created! Welcome to 47daPunjab.", isNewUser: true });
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
        "UPDATE auth_users SET provider = $2, provider_id = $3, avatar_url = COALESCE($4, avatar_url), updated_at = NOW() WHERE id = $1",
        [user.id, provider, providerId || null, avatarUrl || null]
      );
      user.provider = provider;
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
      const result = await pool.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
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
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const nonce = crypto.randomBytes(16).toString("hex");
  const platform = req.query.platform === "native" ? "native" : "web";
  const state = `${nonce}:${platform}`;
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
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/api/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    const stateStr = (state as string) || "";
    const colonIdx = stateStr.lastIndexOf(":");
    const nonce = colonIdx > -1 ? stateStr.slice(0, colonIdx) : stateStr;
    const platform = colonIdx > -1 ? stateStr.slice(colonIdx + 1) : "web";
    const isNative = platform === "native";

    const nativeError = (msg: string) => {
      const params = new URLSearchParams({ error: msg });
      return res.redirect(`47dapunjab://auth?${params.toString()}`);
    };

    if (error) {
      if (isNative) return nativeError(`Google login was cancelled: ${error}`);
      return res.send(oauthCallbackHtml(false, `Google login was cancelled or failed: ${error}`));
    }
    if (!code) {
      if (isNative) return nativeError("No authorization code received.");
      return res.send(oauthCallbackHtml(false, "No authorization code received from Google."));
    }
    const savedNonce = (req.session as any)?.oauthState;
    if (nonce && savedNonce && nonce !== savedNonce) {
      if (isNative) return nativeError("Security check failed. Please try again.");
      return res.send(oauthCallbackHtml(false, "Security check failed. Please try again."));
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      if (isNative) return nativeError("Google OAuth is not configured.");
      return res.send(oauthCallbackHtml(false, "Google OAuth is not fully configured."));
    }
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
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
      if (isNative) return nativeError("Failed to get access token from Google.");
      return res.send(oauthCallbackHtml(false, "Failed to get access token from Google."));
    }
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json() as any;
    if (!googleUser.email) {
      if (isNative) return nativeError("Could not get your email from Google.");
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
        "UPDATE auth_users SET provider = 'google', provider_id = $2, avatar_url = COALESCE($3, avatar_url), name = COALESCE(NULLIF(name, ''), $4), updated_at = NOW() WHERE id = $1",
        [user.id, googleUser.id, googleUser.picture, googleUser.name]
      );
      user.avatar_url = googleUser.picture || user.avatar_url;
    } else {
      const gRole = ADMIN_EMAILS.includes(googleUser.email.toLowerCase()) ? "admin" : "user";
      const result = await pool.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role)
         VALUES ($1, $2, 'google', $3, $4, $5) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [googleUser.email.toLowerCase(), googleUser.name || "", googleUser.id, googleUser.picture || null, gRole]
      );
      user = result.rows[0];
    }
    (req.session as any).userId = user.id;
    delete (req.session as any).oauthState;

    if (isNative) {
      const token = await createAuthToken(user.id);
      const params = new URLSearchParams({ token, userId: String(user.id) });
      return res.redirect(`47dapunjab://auth?${params.toString()}`);
    }

    res.send(oauthCallbackHtml(true, `Signed in as ${user.name || user.email}. You can return to the app now.`));
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
        "UPDATE auth_users SET provider = 'facebook', provider_id = $2, avatar_url = COALESCE($3, avatar_url), name = COALESCE(NULLIF(name, ''), $4), updated_at = NOW() WHERE id = $1",
        [user.id, fbUser.id, avatarUrl, fbUser.name]
      );
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const fbRole = ADMIN_EMAILS.includes(fbUser.email.toLowerCase()) ? "admin" : "user";
      const result = await pool.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role)
         VALUES ($1, $2, 'facebook', $3, $4, $5) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
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
      return res.status(400).json({ error: `This account uses ${user.provider} login. Password reset is not available for social accounts.` });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      "UPDATE auth_users SET reset_code = $2, reset_code_expires = $3 WHERE id = $1",
      [user.id, code, expires]
    );
    res.json({ success: true, message: "If an account exists with this email, a reset code has been sent. For now, please contact support at 47dapunjab@gmail.com for your reset code." });
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
}

export default router;
