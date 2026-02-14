import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const router = Router();

router.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    const existing = await pool.query("SELECT id FROM auth_users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO auth_users (email, password_hash, name, phone, role, provider) 
       VALUES ($1, $2, $3, $4, 'user', 'email') RETURNING id, email, name, phone, role, avatar_url, created_at`,
      [email.toLowerCase(), passwordHash, name, phone || ""]
    );
    const user = result.rows[0];
    (req.session as any).userId = user.id;
    res.json({ user });
  } catch (e: any) {
    console.error("Register error:", e);
    res.status(500).json({ error: "Registration failed" });
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
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = result.rows[0];
    if (user.provider !== "email" || !user.password_hash) {
      return res.status(401).json({ error: `This account uses ${user.provider} login` });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    (req.session as any).userId = user.id;
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (e: any) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
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
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const result = await pool.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role)
         VALUES ($1, $2, $3, $4, $5, 'user') RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [email.toLowerCase(), name || "", provider, providerId || null, avatarUrl || null]
      );
      user = result.rows[0];
    }
    (req.session as any).userId = user.id;
    res.json({ user });
  } catch (e: any) {
    console.error("Social login error:", e);
    res.status(500).json({ error: "Social login failed" });
  }
});

router.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
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

router.post("/api/auth/logout", (req: Request, res: Response) => {
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
    const userId = (req.session as any)?.userId;
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

export default router;
