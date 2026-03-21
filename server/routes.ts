import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { addDocument, getDocuments, deleteDocument, setDocument, getDocument, pool } from "./firebase";
import translate from "google-translate-api-x";

const translationCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const docRef = await addDocument("bookings", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e: any) {
      console.error("Error adding booking:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bookings", async (_req: Request, res: Response) => {
    try {
      const items = await getDocuments("bookings");
      res.json(items);
    } catch (e: any) {
      console.error("Error getting bookings:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      await deleteDocument("bookings", req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  app.post("/api/cart", async (req: Request, res: Response) => {
    try {
      const docRef = await addDocument("cart", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/cart", async (_req: Request, res: Response) => {
    try {
      const items = await getDocuments("cart");
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      await deleteDocument("cart", req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to delete cart item" });
    }
  });

  app.post("/api/rental-inquiries", async (req: Request, res: Response) => {
    try {
      const docRef = await addDocument("rentalInquiries", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/property-details", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId || null;
      const result = await pool.query(
        `INSERT INTO property_details (data, submitted_by) VALUES ($1, $2) RETURNING id`,
        [JSON.stringify(req.body), userId]
      );
      res.json({ docId: String(result.rows[0].id), ...req.body });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/property-details", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, data, created_at FROM property_details ORDER BY created_at DESC`
      );
      const rows = result.rows.map((row: any) => {
        const data = { ...row.data };
        if (data.images && data.images.length > 0) {
          data.hasImages = true;
          data.imageCount = data.images.length;
          delete data.images;
        }
        return { id: row.id, data, created_at: row.created_at };
      });
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/property-details/:id", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, data, created_at FROM property_details WHERE id = $1`,
        [req.params.id as string]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/property-details/:id/comments", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT * FROM property_comments WHERE property_id = $1 ORDER BY created_at ASC`,
        [parseInt(req.params.id as string)]
      );
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/property-details/:id/comments", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Please sign in to comment" });
      }
      const { comment, parent_id } = req.body;
      if (!comment || !comment.trim()) {
        return res.status(400).json({ error: "Comment is required" });
      }
      const userResult = await pool.query("SELECT name, email, avatar_url FROM auth_users WHERE id = $1", [userId]);
      const userName = userResult.rows[0]?.name || "User";
      const userEmail = userResult.rows[0]?.email || null;
      const userAvatar = userResult.rows[0]?.avatar_url || null;
      const result = await pool.query(
        `INSERT INTO property_comments (property_id, parent_id, user_name, user_email, user_avatar, comment)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [parseInt(req.params.id as string), parent_id || null, userName, userEmail, userAvatar, comment.trim()]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/property-details/:id", async (req: Request, res: Response) => {
    try {
      await deleteDocument("propertyDetails", req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/profile", async (_req: Request, res: Response) => {
    try {
      const data = await getDocument("users", "defaultUser");
      if (data) {
        res.json(data);
      } else {
        res.json({ name: "", phone: "", email: "", city: "", country: "", purpose: "" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/profile", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      await setDocument("users", "defaultUser", req.body);
      res.json(req.body);
    } catch (e: any) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/migration-records", async (req: Request, res: Response) => {
    try {
      const { search, period, district } = req.query;
      let query = `SELECT * FROM migration_records WHERE status = 'approved'`;
      const params: any[] = [];
      let paramIndex = 1;

      if (search && String(search).trim()) {
        const searchTerm = `%${String(search).trim()}%`;
        query += ` AND (full_name ILIKE $${paramIndex} OR village_of_origin ILIKE $${paramIndex} OR district ILIKE $${paramIndex} OR current_location ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`;
        params.push(searchTerm);
        paramIndex++;
      }

      if (period && period !== "all") {
        query += ` AND migration_period = $${paramIndex}`;
        params.push(String(period));
        paramIndex++;
      }

      if (district && String(district).trim()) {
        query += ` AND district ILIKE $${paramIndex}`;
        params.push(`%${String(district).trim()}%`);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(query, params);
      res.json(result.rows);
    } catch (e: any) {
      console.error("Error searching migration records:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/migration-records", async (req: Request, res: Response) => {
    try {
      const { full_name, image_url, village_of_origin, district, year_of_migration, migration_period, current_location, contact_info, notes } = req.body;

      if (!full_name || !village_of_origin || !district || !current_location) {
        return res.status(400).json({ error: "Full name, village of origin, district, and current location are required." });
      }

      const userId = (req.session as any)?.userId || null;
      const result = await pool.query(
        `INSERT INTO migration_records (full_name, image_url, village_of_origin, district, year_of_migration, migration_period, current_location, contact_info, notes, status, submitted_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [full_name, image_url || null, village_of_origin, district, year_of_migration ? parseInt(year_of_migration) : null, migration_period || 'after_1947', current_location, contact_info || null, notes || null, 'approved', userId]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      console.error("Error adding migration record:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/migration-records/:id", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(`DELETE FROM migration_records WHERE id = $1`, [parseInt(req.params.id as string)]);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error deleting migration record:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/migration-records/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        `UPDATE migration_records SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, parseInt(req.params.id as string)]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/migration-records/:id", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(`SELECT * FROM migration_records WHERE id = $1`, [parseInt(req.params.id as string)]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/migration-records/:id/comments", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        `SELECT * FROM migration_comments WHERE record_id = $1 ORDER BY created_at DESC`,
        [parseInt(req.params.id as string)]
      );
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/migration-records/:id/comments", async (req: Request, res: Response) => {
    try {
      const { user_name, user_email, comment } = req.body;
      if (!user_name || !comment) {
        return res.status(400).json({ error: "Name and comment are required." });
      }
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        `INSERT INTO migration_comments (record_id, user_name, user_email, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
        [parseInt(req.params.id as string), user_name, user_email || null, comment]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/blog-posts", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const category = req.query.category as string | undefined;
      let query = "SELECT * FROM blog_posts";
      const params: any[] = [];
      if (category && category !== "All") {
        query += " WHERE category = $1";
        params.push(category);
      }
      query += " ORDER BY created_at DESC";
      const result = await dbPool.query(query, params);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/blog-posts/:id", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query("SELECT * FROM blog_posts WHERE id = $1", [parseInt(req.params.id as string)]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/blog-posts", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const adminCheck = await dbPool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      const isAdmin = adminCheck.rows.length > 0 && adminCheck.rows[0].role === "admin";
      if (!isAdmin) {
        const writerCheck = await dbPool.query(
          "SELECT id FROM blog_write_requests WHERE user_id = $1 AND status = 'approved' LIMIT 1",
          [userId]
        );
        if (writerCheck.rows.length === 0) {
          return res.status(403).json({ error: "You need writing permission. Please submit a request from the blog page." });
        }
      }
      const { title, content, author_name, author_email, image_url, category } = req.body;
      if (!title || !content || !author_name) {
        return res.status(400).json({ error: "title, content, and author_name are required" });
      }
      const result = await dbPool.query(
        `INSERT INTO blog_posts (title, content, author_name, author_email, image_url, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [title, content, author_name, author_email || null, image_url || null, category || "General"]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/blog-posts/:id/like", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        "UPDATE blog_posts SET likes = likes + 1 WHERE id = $1 RETURNING *",
        [parseInt(req.params.id as string)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/blog-posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        "SELECT * FROM blog_comments WHERE post_id = $1 ORDER BY created_at DESC",
        [parseInt(req.params.id as string)]
      );
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/blog-posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { comment } = req.body;
      if (!comment || !comment.trim()) {
        return res.status(400).json({ error: "Comment is required" });
      }
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const userResult = await dbPool.query("SELECT name, email FROM auth_users WHERE id = $1", [userId]);
      const userName = userResult.rows[0]?.name || "User";
      const userEmail = userResult.rows[0]?.email || null;
      const result = await dbPool.query(
        "INSERT INTO blog_comments (post_id, user_name, user_email, comment) VALUES ($1, $2, $3, $4) RETURNING *",
        [parseInt(req.params.id as string), userName, userEmail, comment.trim()]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/blog-write-requests", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { reason, topics, sample_title } = req.body;
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: "Please provide a reason for your request" });
      }
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const userResult = await dbPool.query("SELECT name, email FROM auth_users WHERE id = $1", [userId]);
      const userName = userResult.rows[0]?.name || "User";
      const userEmail = userResult.rows[0]?.email || null;
      const existing = await dbPool.query(
        "SELECT id, status FROM blog_write_requests WHERE user_id = $1 AND status = 'pending' LIMIT 1",
        [userId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "You already have a pending request" });
      }
      const result = await dbPool.query(
        `INSERT INTO blog_write_requests (user_id, user_name, user_email, reason, topics, sample_title) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, userName, userEmail, reason.trim(), topics?.trim() || null, sample_title?.trim() || null]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/blog-write-requests", async (req: Request, res: Response) => {
    try {
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const status = req.query.status as string | undefined;
      let query = "SELECT * FROM blog_write_requests";
      const params: any[] = [];
      if (status) {
        query += " WHERE status = $1";
        params.push(status);
      }
      query += " ORDER BY created_at DESC";
      const result = await dbPool.query(query, params);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/blog-write-requests/my-status", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        "SELECT * FROM blog_write_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      res.json(result.rows[0] || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/blog-write-requests/:id/approve", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const adminCheck = await dbPool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { admin_note } = req.body;
      const result = await dbPool.query(
        "UPDATE blog_write_requests SET status = 'approved', admin_note = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *",
        [admin_note || null, parseInt(req.params.id as string)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/blog-write-requests/:id/reject", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool = (await import("pg")).default;
      const dbPool = new pool.Pool({ connectionString: process.env.DATABASE_URL });
      const adminCheck = await dbPool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { admin_note } = req.body;
      const result = await dbPool.query(
        "UPDATE blog_write_requests SET status = 'rejected', admin_note = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *",
        [admin_note || null, parseInt(req.params.id as string)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId || null;
      const { items, total, customer_name, customer_phone, customer_address, customer_city, customer_country, payment_method } = req.body;
      if (!items || !total || !customer_name || !customer_phone || !customer_address || !customer_city) {
        return res.status(400).json({ error: "All delivery details are required" });
      }
      const result = await pool.query(
        `INSERT INTO orders (user_id, items, total, customer_name, customer_phone, customer_address, customer_city, customer_country, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [userId, JSON.stringify(items), total, customer_name, customer_phone, customer_address, customer_city, customer_country || "Pakistan", payment_method || "cod"]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      console.error("Error creating order:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const result = await pool.query(
        `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/my-submissions", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const properties = await pool.query(
        `SELECT id, data, created_at FROM property_details WHERE submitted_by = $1 ORDER BY created_at DESC`,
        [userId]
      );
      const propertyRows = properties.rows.map((row: any) => {
        const data = { ...row.data };
        if (data.images && data.images.length > 0) {
          data.hasImages = true;
          data.imageCount = data.images.length;
          delete data.images;
        }
        return { id: row.id, type: "property" as const, data, created_at: row.created_at };
      });
      const persons = await pool.query(
        `SELECT * FROM migration_records WHERE submitted_by = $1 ORDER BY created_at DESC`,
        [userId]
      );
      const personRows = persons.rows.map((row: any) => ({
        id: row.id,
        type: "person" as const,
        full_name: row.full_name,
        village_of_origin: row.village_of_origin,
        district: row.district,
        current_location: row.current_location,
        year_of_migration: row.year_of_migration,
        migration_period: row.migration_period,
        contact_info: row.contact_info,
        notes: row.notes,
        status: row.status,
        image_url: row.image_url,
        created_at: row.created_at,
      }));
      res.json({ properties: propertyRows, persons: personRows });
    } catch (e: any) {
      console.error("Error fetching my submissions:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/property-details/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM property_details WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id as string), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only edit your own submissions" });
      }
      await pool.query(
        `UPDATE property_details SET data = $1 WHERE id = $2`,
        [JSON.stringify(req.body), parseInt(req.params.id as string)]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/migration-records/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM migration_records WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id as string), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only edit your own submissions" });
      }
      const { full_name, village_of_origin, district, current_location, year_of_migration, migration_period, contact_info, notes, image_url } = req.body;
      await pool.query(
        `UPDATE migration_records SET full_name = $1, village_of_origin = $2, district = $3, current_location = $4, year_of_migration = $5, migration_period = $6, contact_info = $7, notes = $8, image_url = $9, updated_at = NOW() WHERE id = $10`,
        [full_name, village_of_origin, district, current_location, year_of_migration ? parseInt(year_of_migration) : null, migration_period, contact_info || null, notes || null, image_url || null, parseInt(req.params.id as string)]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/my-submissions/property/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM property_details WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id as string), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only delete your own submissions" });
      }
      await pool.query(`DELETE FROM property_details WHERE id = $1`, [parseInt(req.params.id as string)]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/my-submissions/person/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM migration_records WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id as string), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only delete your own submissions" });
      }
      await pool.query(`DELETE FROM migration_records WHERE id = $1`, [parseInt(req.params.id as string)]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const result = await pool.query(
        `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
        [req.params.id as string, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const userCheck = await pool.query(`SELECT role FROM auth_users WHERE id = $1`, [userId]);
      if (!userCheck.rows.length || userCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { status, tracking_number } = req.body;
      const validStatuses = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updates: string[] = [`status = $1`, `status_updated_at = NOW()`];
      const values: any[] = [status];
      let paramIndex = 2;
      if (tracking_number !== undefined) {
        updates.push(`tracking_number = $${paramIndex}`);
        values.push(tracking_number);
        paramIndex++;
      }
      values.push(req.params.id as string);
      const result = await pool.query(
        `UPDATE orders SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/orders", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const userCheck = await pool.query(`SELECT role FROM auth_users WHERE id = $1`, [userId]);
      if (!userCheck.rows.length || userCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const result = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/clear-all", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const userCheck = await pool.query(`SELECT role FROM auth_users WHERE id = $1`, [userId]);
      if (!userCheck.rows.length || userCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      await setDocument("users", "defaultUser", { name: "", phone: "", email: "", city: "", country: "", purpose: "" });
      const bookings = await getDocuments("bookings");
      for (const b of bookings) {
        await deleteDocument("bookings", b.docId);
      }
      const cartItems = await getDocuments("cart");
      for (const c of cartItems) {
        await deleteDocument("cart", c.docId);
      }
      const props = await getDocuments("propertyDetails");
      for (const p of props) {
        await deleteDocument("propertyDetails", p.docId);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: "Operation failed" });
    }
  });

  app.get("/api/shop-products", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT * FROM shop_products ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/shop-products", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const roleCheck = await pool.query("SELECT role, email FROM auth_users WHERE id = $1", [userId]);
      if (!roleCheck.rows.length || roleCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { name, price, original_price, category, description, details, image_url } = req.body;
      if (!name || !price) return res.status(400).json({ error: "Name and price are required" });
      const result = await pool.query(
        `INSERT INTO shop_products (name, price, original_price, category, description, details, image_url, posted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, price, original_price || null, category || "General", description || "", details || "", image_url || null, roleCheck.rows[0].email]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/shop-products/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const roleCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (!roleCheck.rows.length || roleCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      await pool.query("DELETE FROM shop_products WHERE id = $1", [req.params.id as string]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const exchangeRateCache: { rates: Record<string, number> | null; timestamp: number } = { rates: null, timestamp: 0 };
  const EXCHANGE_CACHE_TTL = 6 * 60 * 60 * 1000;

  app.get("/api/exchange-rates", async (_req: Request, res: Response) => {
    try {
      if (exchangeRateCache.rates && Date.now() - exchangeRateCache.timestamp < EXCHANGE_CACHE_TTL) {
        return res.json({ rates: exchangeRateCache.rates, cached: true });
      }

      const currencies = ["PKR", "INR"];
      const apiUrl = `https://open.er-api.com/v6/latest/USD`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        if (data.rates) {
          const filteredRates: Record<string, number> = { USD: 1 };
          for (const code of currencies) {
            if (data.rates[code]) {
              filteredRates[code] = Math.round(data.rates[code] * 100) / 100;
            }
          }
          exchangeRateCache.rates = filteredRates;
          exchangeRateCache.timestamp = Date.now();
          return res.json({ rates: filteredRates, cached: false });
        }
      }

      const fallbackRates: Record<string, number> = {
        USD: 1, PKR: 278.5, INR: 83.5,
      };
      res.json({ rates: fallbackRates, cached: false, fallback: true });
    } catch (e: any) {
      const fallbackRates: Record<string, number> = {
        USD: 1, PKR: 278.5, INR: 83.5,
      };
      res.json({ rates: fallbackRates, cached: false, fallback: true });
    }
  });

  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const { texts, targetLang } = req.body;
      if (!texts || !targetLang) {
        return res.status(400).json({ error: "texts and targetLang are required" });
      }

      const langMap: Record<string, string> = {
        en: "en",
        ur: "ur",
        hi: "hi",
        pa: "pa",
      };

      const target = langMap[targetLang] || "en";

      if (target === "en") {
        return res.json({ translations: texts });
      }

      const results: string[] = [];
      for (const text of texts) {
        if (!text || text.trim() === "") {
          results.push(text);
          continue;
        }

        const cacheKey = `${text}:${target}`;
        const cached = translationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          results.push(cached.text);
          continue;
        }

        try {
          const result = await translate(text, { to: target });
          const translated = (result as any).text as string;
          translationCache.set(cacheKey, { text: translated, timestamp: Date.now() });
          results.push(translated);
        } catch (err) {
          results.push(text);
        }
      }

      res.json({ translations: results });
    } catch (e: any) {
      console.error("Translation error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/access-requests", async (req: Request, res: Response) => {
    try {
      const { user_name, user_email, phone, reason, request_type } = req.body;
      if (!user_name || !user_email || !reason) {
        return res.status(400).json({ error: "Name, email and reason are required" });
      }
      const existing = await pool.query(
        "SELECT * FROM access_requests WHERE user_email = $1 AND status = 'pending'",
        [user_email]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "You already have a pending request" });
      }
      const result = await pool.query(
        `INSERT INTO access_requests (user_name, user_email, phone, reason, request_type)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_name, user_email, phone || null, reason, request_type || "premium"]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/access-requests/my-status", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const userResult = await pool.query("SELECT email FROM auth_users WHERE id = $1", [userId]);
      if (!userResult.rows.length) return res.json(null);
      const result = await pool.query(
        "SELECT * FROM access_requests WHERE user_email = $1 ORDER BY created_at DESC LIMIT 1",
        [userResult.rows[0].email]
      );
      res.json(result.rows[0] || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/access-requests", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const roleCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (!roleCheck.rows.length || roleCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const result = await pool.query("SELECT * FROM access_requests ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/access-requests/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const roleCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (!roleCheck.rows.length || roleCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { status, admin_note } = req.body;
      const result = await pool.query(
        "UPDATE access_requests SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
        [status, admin_note || null, req.params.id as string]
      );
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES auth_users(id),
      plan TEXT NOT NULL DEFAULT 'monthly',
      payment_method TEXT NOT NULL DEFAULT 'stripe',
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT,
      payment_proof_url TEXT,
      transaction_id TEXT,
      amount INTEGER NOT NULL DEFAULT 1000,
      currency TEXT NOT NULL DEFAULT 'usd',
      starts_at TIMESTAMP,
      expires_at TIMESTAMP,
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  app.get("/api/subscription/status", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const result = await pool.query(
        `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1`,
        [userId]
      );
      if (result.rows.length > 0) {
        res.json({ active: true, subscription: result.rows[0] });
      } else {
        const pending = await pool.query(
          `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
          [userId]
        );
        res.json({ active: false, pending: pending.rows[0] || null });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscription/create", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { plan, payment_method } = req.body;
      if (!plan || !["monthly", "yearly"].includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
      }
      if (!payment_method || !["stripe", "jazzcash", "easypaisa"].includes(payment_method)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      const amount = plan === "monthly" ? 1000 : 4000;
      const currency = payment_method === "stripe" ? "usd" : "pkr";
      const amountFinal = payment_method === "stripe" ? amount : (plan === "monthly" ? 2800 : 11200);

      if (payment_method === "stripe") {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          return res.status(503).json({ error: "Stripe is not configured yet. Please try JazzCash or EasyPaisa." });
        }
        const stripe = require("stripe")(stripeKey);
        const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN || "localhost:5000";
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: {
                name: plan === "monthly" ? "47daPunjab Monthly Plan" : "47daPunjab Yearly Plan",
                description: plan === "monthly" ? "Monthly subscription - $10/month" : "Yearly subscription - $40/year (Save 67%!)",
              },
              unit_amount: amount,
            },
            quantity: 1,
          }],
          mode: "payment",
          success_url: `https://${domain}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `https://${domain}/subscription?canceled=true`,
          metadata: { userId: String(userId), plan },
        });

        await pool.query(
          `INSERT INTO subscriptions (user_id, plan, payment_method, status, stripe_session_id, amount, currency) VALUES ($1, $2, $3, 'pending', $4, $5, $6)`,
          [userId, plan, "stripe", session.id, amount, "usd"]
        );

        return res.json({ url: session.url, sessionId: session.id });
      }

      const result = await pool.query(
        `INSERT INTO subscriptions (user_id, plan, payment_method, status, amount, currency) VALUES ($1, $2, $3, 'pending', $4, $5) RETURNING id`,
        [userId, plan, payment_method, amountFinal, currency]
      );

      res.json({ subscriptionId: result.rows[0].id, amount: amountFinal, currency });
    } catch (e: any) {
      console.error("Subscription create error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscription/submit-proof", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { subscription_id, transaction_id, payment_proof_url } = req.body;
      if (!subscription_id || !transaction_id) {
        return res.status(400).json({ error: "Transaction ID is required" });
      }

      const check = await pool.query(
        `SELECT id FROM subscriptions WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
        [subscription_id, userId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      await pool.query(
        `UPDATE subscriptions SET transaction_id = $1, payment_proof_url = $2, status = 'awaiting_review', updated_at = NOW() WHERE id = $3`,
        [transaction_id, payment_proof_url || null, subscription_id]
      );

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscription/verify-stripe", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ error: "Session ID required" });

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return res.status(503).json({ error: "Stripe not configured" });

      const stripe = require("stripe")(stripeKey);
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === "paid") {
        const plan = session.metadata?.plan || "monthly";
        const interval = plan === "yearly" ? "1 year" : "1 month";
        await pool.query(
          `UPDATE subscriptions SET status = 'active', starts_at = NOW(), expires_at = NOW() + INTERVAL '${interval}', updated_at = NOW() WHERE stripe_session_id = $1 AND user_id = $2`,
          [session_id, userId]
        );
        return res.json({ success: true, active: true });
      }

      res.json({ success: false, status: session.payment_status });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/subscriptions", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const userCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (userCheck.rows[0]?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const result = await pool.query(`
        SELECT s.*, u.name as user_name, u.email as user_email 
        FROM subscriptions s 
        JOIN auth_users u ON s.user_id = u.id 
        ORDER BY s.created_at DESC
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/subscriptions/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const userCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (userCheck.rows[0]?.role !== "admin") return res.status(403).json({ error: "Admin only" });

      const { status, admin_note } = req.body;
      const sub = await pool.query("SELECT * FROM subscriptions WHERE id = $1", [parseInt(req.params.id)]);
      if (sub.rows.length === 0) return res.status(404).json({ error: "Not found" });

      if (status === "active") {
        const plan = sub.rows[0].plan;
        const interval = plan === "yearly" ? "1 year" : "1 month";
        await pool.query(
          `UPDATE subscriptions SET status = 'active', starts_at = NOW(), expires_at = NOW() + INTERVAL '${interval}', admin_note = $1, updated_at = NOW() WHERE id = $2`,
          [admin_note || null, parseInt(req.params.id)]
        );
      } else {
        await pool.query(
          `UPDATE subscriptions SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3`,
          [status, admin_note || null, parseInt(req.params.id)]
        );
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
