// server/index.ts
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import compression from "compression";

// server/routes.ts
import { createServer } from "node:http";

// server/firebase.ts
import pg from "pg";
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
var TABLE_MAP = {
  bookings: "bookings",
  cart: "cart",
  propertyDetails: "property_details",
  rentalInquiries: "rental_inquiries",
  users: "users"
};
function getTable(collection) {
  return TABLE_MAP[collection] || collection;
}
async function addDocument(collectionName, data) {
  const table = getTable(collectionName);
  const result = await pool.query(
    `INSERT INTO ${table} (data) VALUES ($1) RETURNING id`,
    [JSON.stringify(data)]
  );
  return { id: String(result.rows[0].id) };
}
async function getDocuments(collectionName) {
  const table = getTable(collectionName);
  const result = await pool.query(
    `SELECT id, data FROM ${table} ORDER BY created_at DESC`
  );
  return result.rows.map((row) => ({ docId: String(row.id), ...row.data }));
}
async function deleteDocument(collectionName, docId) {
  const table = getTable(collectionName);
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [parseInt(docId)]);
}
async function setDocument(collectionName, docId, data) {
  const table = getTable(collectionName);
  if (collectionName === "users") {
    const existing = await pool.query(`SELECT user_id FROM ${table} WHERE user_id = $1`, [docId]);
    if (existing.rows.length === 0) {
      await pool.query(`INSERT INTO ${table} (user_id, data) VALUES ($1, $2)`, [docId, JSON.stringify(data)]);
    } else {
      await pool.query(`UPDATE ${table} SET data = $2 WHERE user_id = $1`, [docId, JSON.stringify(data)]);
    }
  }
}
async function getDocument(collectionName, docId) {
  const table = getTable(collectionName);
  if (collectionName === "users") {
    const result2 = await pool.query(`SELECT data FROM ${table} WHERE user_id = $1`, [docId]);
    if (result2.rows.length === 0) return null;
    return result2.rows[0].data;
  }
  const result = await pool.query(`SELECT id, data FROM ${table} WHERE id = $1`, [parseInt(docId)]);
  if (result.rows.length === 0) return null;
  return { docId: String(result.rows[0].id), ...result.rows[0].data };
}

// server/routes.ts
import translate from "google-translate-api-x";
var translationCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 24 * 60 * 60 * 1e3;
async function registerRoutes(app2) {
  app2.post("/api/bookings", async (req, res) => {
    try {
      const docRef = await addDocument("bookings", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e) {
      console.error("Error adding booking:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/bookings", async (_req, res) => {
    try {
      const items = await getDocuments("bookings");
      res.json(items);
    } catch (e) {
      console.error("Error getting bookings:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/bookings/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      await deleteDocument("bookings", req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });
  app2.post("/api/cart", async (req, res) => {
    try {
      const docRef = await addDocument("cart", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/cart", async (_req, res) => {
    try {
      const items = await getDocuments("cart");
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/cart/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      await deleteDocument("cart", req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete cart item" });
    }
  });
  app2.post("/api/rental-inquiries", async (req, res) => {
    try {
      const docRef = await addDocument("rentalInquiries", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/property-details", async (req, res) => {
    try {
      const userId = req.session?.userId || null;
      const result = await pool.query(
        `INSERT INTO property_details (data, submitted_by) VALUES ($1, $2) RETURNING id`,
        [JSON.stringify(req.body), userId]
      );
      res.json({ docId: String(result.rows[0].id), ...req.body });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/property-details", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, data, created_at FROM property_details ORDER BY created_at DESC`
      );
      const rows = result.rows.map((row) => {
        const data = { ...row.data };
        if (data.images && data.images.length > 0) {
          data.hasImages = true;
          data.imageCount = data.images.length;
          delete data.images;
        }
        return { id: row.id, data, created_at: row.created_at };
      });
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/property-details/:id", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, data, created_at FROM property_details WHERE id = $1`,
        [req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/property-details/:id", async (req, res) => {
    try {
      await deleteDocument("propertyDetails", req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/profile", async (_req, res) => {
    try {
      const data = await getDocument("users", "defaultUser");
      if (data) {
        res.json(data);
      } else {
        res.json({ name: "", phone: "", email: "", city: "", country: "", purpose: "" });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.put("/api/profile", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      await setDocument("users", "defaultUser", req.body);
      res.json(req.body);
    } catch (e) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.get("/api/migration-records", async (req, res) => {
    try {
      const { search, period, district } = req.query;
      let query = `SELECT * FROM migration_records WHERE status = 'approved'`;
      const params = [];
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
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(query, params);
      res.json(result.rows);
    } catch (e) {
      console.error("Error searching migration records:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/migration-records", async (req, res) => {
    try {
      const { full_name, image_url, village_of_origin, district, year_of_migration, migration_period, current_location, contact_info, notes } = req.body;
      if (!full_name || !village_of_origin || !district || !current_location) {
        return res.status(400).json({ error: "Full name, village of origin, district, and current location are required." });
      }
      const userId = req.session?.userId || null;
      const result = await pool.query(
        `INSERT INTO migration_records (full_name, image_url, village_of_origin, district, year_of_migration, migration_period, current_location, contact_info, notes, status, submitted_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [full_name, image_url || null, village_of_origin, district, year_of_migration ? parseInt(year_of_migration) : null, migration_period || "after_1947", current_location, contact_info || null, notes || null, "approved", userId]
      );
      res.json(result.rows[0]);
    } catch (e) {
      console.error("Error adding migration record:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/migration-records/:id", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(`DELETE FROM migration_records WHERE id = $1`, [parseInt(req.params.id)]);
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting migration record:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/migration-records/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        `UPDATE migration_records SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, parseInt(req.params.id)]
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/migration-records/:id", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(`SELECT * FROM migration_records WHERE id = $1`, [parseInt(req.params.id)]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/migration-records/:id/comments", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        `SELECT * FROM migration_comments WHERE record_id = $1 ORDER BY created_at DESC`,
        [parseInt(req.params.id)]
      );
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/migration-records/:id/comments", async (req, res) => {
    try {
      const { user_name, user_email, comment } = req.body;
      if (!user_name || !comment) {
        return res.status(400).json({ error: "Name and comment are required." });
      }
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        `INSERT INTO migration_comments (record_id, user_name, user_email, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
        [parseInt(req.params.id), user_name, user_email || null, comment]
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/blog-posts", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const category = req.query.category;
      let query = "SELECT * FROM blog_posts";
      const params = [];
      if (category && category !== "All") {
        query += " WHERE category = $1";
        params.push(category);
      }
      query += " ORDER BY created_at DESC";
      const result = await dbPool.query(query, params);
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/blog-posts/:id", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query("SELECT * FROM blog_posts WHERE id = $1", [parseInt(req.params.id)]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/blog-posts", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
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
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/blog-posts/:id/like", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        "UPDATE blog_posts SET likes = likes + 1 WHERE id = $1 RETURNING *",
        [parseInt(req.params.id)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/blog-posts/:id/comments", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        "SELECT * FROM blog_comments WHERE post_id = $1 ORDER BY created_at DESC",
        [parseInt(req.params.id)]
      );
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/blog-posts/:id/comments", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { comment } = req.body;
      if (!comment || !comment.trim()) {
        return res.status(400).json({ error: "Comment is required" });
      }
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const userResult = await dbPool.query("SELECT name, email FROM auth_users WHERE id = $1", [userId]);
      const userName = userResult.rows[0]?.name || "User";
      const userEmail = userResult.rows[0]?.email || null;
      const result = await dbPool.query(
        "INSERT INTO blog_comments (post_id, user_name, user_email, comment) VALUES ($1, $2, $3, $4) RETURNING *",
        [parseInt(req.params.id), userName, userEmail, comment.trim()]
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/blog-write-requests", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { reason, topics, sample_title } = req.body;
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: "Please provide a reason for your request" });
      }
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
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
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/blog-write-requests", async (req, res) => {
    try {
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const status = req.query.status;
      let query = "SELECT * FROM blog_write_requests";
      const params = [];
      if (status) {
        query += " WHERE status = $1";
        params.push(status);
      }
      query += " ORDER BY created_at DESC";
      const result = await dbPool.query(query, params);
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/blog-write-requests/my-status", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const result = await dbPool.query(
        "SELECT * FROM blog_write_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      res.json(result.rows[0] || null);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/blog-write-requests/:id/approve", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const adminCheck = await dbPool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { admin_note } = req.body;
      const result = await dbPool.query(
        "UPDATE blog_write_requests SET status = 'approved', admin_note = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *",
        [admin_note || null, parseInt(req.params.id)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/blog-write-requests/:id/reject", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pool3 = (await import("pg")).default;
      const dbPool = new pool3.Pool({ connectionString: process.env.DATABASE_URL });
      const adminCheck = await dbPool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { admin_note } = req.body;
      const result = await dbPool.query(
        "UPDATE blog_write_requests SET status = 'rejected', admin_note = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *",
        [admin_note || null, parseInt(req.params.id)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      const userId = req.session?.userId || null;
      const { items, total, customer_name, customer_phone, customer_address, customer_city, customer_country, payment_method } = req.body;
      if (!items || !total || !customer_name || !customer_phone || !customer_address || !customer_city) {
        return res.status(400).json({ error: "All delivery details are required" });
      }
      const result = await pool.query(
        `INSERT INTO orders (user_id, items, total, customer_name, customer_phone, customer_address, customer_city, customer_country, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [userId, JSON.stringify(items), total, customer_name, customer_phone, customer_address, customer_city, customer_country || "Pakistan", payment_method || "cod"]
      );
      res.json(result.rows[0]);
    } catch (e) {
      console.error("Error creating order:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/orders", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const result = await pool.query(
        `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/my-submissions", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const properties = await pool.query(
        `SELECT id, data, created_at FROM property_details WHERE submitted_by = $1 ORDER BY created_at DESC`,
        [userId]
      );
      const propertyRows = properties.rows.map((row) => {
        const data = { ...row.data };
        if (data.images && data.images.length > 0) {
          data.hasImages = true;
          data.imageCount = data.images.length;
          delete data.images;
        }
        return { id: row.id, type: "property", data, created_at: row.created_at };
      });
      const persons = await pool.query(
        `SELECT * FROM migration_records WHERE submitted_by = $1 ORDER BY created_at DESC`,
        [userId]
      );
      const personRows = persons.rows.map((row) => ({
        id: row.id,
        type: "person",
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
        created_at: row.created_at
      }));
      res.json({ properties: propertyRows, persons: personRows });
    } catch (e) {
      console.error("Error fetching my submissions:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.put("/api/property-details/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM property_details WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only edit your own submissions" });
      }
      await pool.query(
        `UPDATE property_details SET data = $1 WHERE id = $2`,
        [JSON.stringify(req.body), parseInt(req.params.id)]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.put("/api/migration-records/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM migration_records WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only edit your own submissions" });
      }
      const { full_name, village_of_origin, district, current_location, year_of_migration, migration_period, contact_info, notes, image_url } = req.body;
      await pool.query(
        `UPDATE migration_records SET full_name = $1, village_of_origin = $2, district = $3, current_location = $4, year_of_migration = $5, migration_period = $6, contact_info = $7, notes = $8, image_url = $9, updated_at = NOW() WHERE id = $10`,
        [full_name, village_of_origin, district, current_location, year_of_migration ? parseInt(year_of_migration) : null, migration_period, contact_info || null, notes || null, image_url || null, parseInt(req.params.id)]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/my-submissions/property/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM property_details WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only delete your own submissions" });
      }
      await pool.query(`DELETE FROM property_details WHERE id = $1`, [parseInt(req.params.id)]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/my-submissions/person/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const check = await pool.query(
        `SELECT id FROM migration_records WHERE id = $1 AND submitted_by = $2`,
        [parseInt(req.params.id), userId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "You can only delete your own submissions" });
      }
      await pool.query(`DELETE FROM migration_records WHERE id = $1`, [parseInt(req.params.id)]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/orders/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const result = await pool.query(
        `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
        [req.params.id, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.put("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const userId = req.session?.userId;
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
      const updates = [`status = $1`, `status_updated_at = NOW()`];
      const values = [status];
      let paramIndex = 2;
      if (tracking_number !== void 0) {
        updates.push(`tracking_number = $${paramIndex}`);
        values.push(tracking_number);
        paramIndex++;
      }
      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE orders SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/orders", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const userCheck = await pool.query(`SELECT role FROM auth_users WHERE id = $1`, [userId]);
      if (!userCheck.rows.length || userCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const result = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/clear-all", async (req, res) => {
    try {
      const userId = req.session?.userId;
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
    } catch (e) {
      res.status(500).json({ error: "Operation failed" });
    }
  });
  app2.get("/api/shop-products", async (_req, res) => {
    try {
      const result = await pool.query("SELECT * FROM shop_products ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/shop-products", async (req, res) => {
    try {
      const userId = req.session?.userId;
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
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/shop-products/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const roleCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (!roleCheck.rows.length || roleCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      await pool.query("DELETE FROM shop_products WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  const exchangeRateCache = { rates: null, timestamp: 0 };
  const EXCHANGE_CACHE_TTL = 6 * 60 * 60 * 1e3;
  app2.get("/api/exchange-rates", async (_req, res) => {
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
          const filteredRates = { USD: 1 };
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
      const fallbackRates = {
        USD: 1,
        PKR: 278.5,
        INR: 83.5
      };
      res.json({ rates: fallbackRates, cached: false, fallback: true });
    } catch (e) {
      const fallbackRates = {
        USD: 1,
        PKR: 278.5,
        INR: 83.5
      };
      res.json({ rates: fallbackRates, cached: false, fallback: true });
    }
  });
  app2.post("/api/translate", async (req, res) => {
    try {
      const { texts, targetLang } = req.body;
      if (!texts || !targetLang) {
        return res.status(400).json({ error: "texts and targetLang are required" });
      }
      const langMap = {
        en: "en",
        ur: "ur",
        hi: "hi",
        pa: "pa"
      };
      const target = langMap[targetLang] || "en";
      if (target === "en") {
        return res.json({ translations: texts });
      }
      const results = [];
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
          const translated = result.text;
          translationCache.set(cacheKey, { text: translated, timestamp: Date.now() });
          results.push(translated);
        } catch (err) {
          results.push(text);
        }
      }
      res.json({ translations: results });
    } catch (e) {
      console.error("Translation error:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/access-requests", async (req, res) => {
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
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/access-requests/my-status", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const userResult = await pool.query("SELECT email FROM auth_users WHERE id = $1", [userId]);
      if (!userResult.rows.length) return res.json(null);
      const result = await pool.query(
        "SELECT * FROM access_requests WHERE user_email = $1 ORDER BY created_at DESC LIMIT 1",
        [userResult.rows[0].email]
      );
      res.json(result.rows[0] || null);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/access-requests", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const roleCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (!roleCheck.rows.length || roleCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const result = await pool.query("SELECT * FROM access_requests ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.put("/api/admin/access-requests/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Login required" });
      const roleCheck = await pool.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
      if (!roleCheck.rows.length || roleCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { status, admin_note } = req.body;
      const result = await pool.query(
        "UPDATE access_requests SET status = $1, admin_note = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
        [status, admin_note || null, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import pg2 from "pg";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";
var resolveMx = promisify(dns.resolveMx);
var pool2 = new pg2.Pool({ connectionString: process.env.DATABASE_URL });
var router = Router();
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(key, maxRequests, windowMs) {
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
    auth: { user, pass }
  });
}
async function validateEmailDomain(email) {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}
async function sendVerificationEmail(toEmail, code) {
  const transport = createMailTransport();
  if (!transport) {
    console.warn("GMAIL_APP_PASSWORD not set \u2014 cannot send verification email");
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
      `
    });
    return true;
  } catch (e) {
    console.error("Failed to send verification email:", e);
    return false;
  }
}
async function sendResetCodeEmail(toEmail, code) {
  const transport = createMailTransport();
  if (!transport) {
    console.warn("GMAIL_APP_PASSWORD not set \u2014 cannot send reset email");
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
            <p style="color:#666;font-size:13px;margin:0;">If you didn't request this, ignore this email \u2014 your password won't change.</p>
          </div>
        </div>
      `
    });
    return true;
  } catch (e) {
    console.error("Failed to send reset email:", e);
    return false;
  }
}
var ADMIN_EMAILS = ["47dapunjab@gmail.com"];
function generateAuthToken() {
  return crypto.randomBytes(48).toString("hex");
}
async function createAuthToken(userId) {
  const token = generateAuthToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
  await pool2.query(
    `INSERT INTO auth_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = $2, expires_at = $3`,
    [token, userId, expiresAt]
  );
  return token;
}
async function getUserFromToken(token) {
  const result = await pool2.query(
    `SELECT u.id, u.email, u.name, u.phone, u.city, u.country, u.purpose, u.role, u.avatar_url, u.provider
     FROM auth_tokens t JOIN auth_users u ON t.user_id = u.id
     WHERE t.token = $1 AND t.expires_at > NOW()`,
    [token]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}
function getBearerToken(req) {
  const auth = req.header("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}
async function getUserId(req) {
  const sessionUserId = req.session?.userId;
  if (sessionUserId) return sessionUserId;
  const token = getBearerToken(req);
  if (token) {
    const user = await getUserFromToken(token);
    if (user) return user.id;
  }
  return null;
}
function getBaseUrl(req) {
  const forwardedProto = (req.header("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
  const forwardedHost = (req.header("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return `${forwardedProto}://${forwardedHost}`;
}
function getOAuthRedirectBase() {
  if (process.env.OAUTH_BASE_URL) {
    return process.env.OAUTH_BASE_URL.replace(/\/+$/, "");
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  return "https://47dapunjab.com";
}
var oauthCallbackHtml = (success, message, token) => `
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
        var payload = { type: '47da-oauth-success'${token ? `, token: '${token}'` : ""} };
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
router.post("/api/auth/register", async (req, res) => {
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
    if (!checkRateLimit(`register:${email.toLowerCase()}`, 3, 10 * 60 * 1e3)) {
      return res.status(429).json({ error: "Too many registration attempts. Please try again in 10 minutes." });
    }
    const validDomain = await validateEmailDomain(email);
    if (!validDomain) {
      return res.status(400).json({ error: "This email domain does not appear to be valid. Please use a real email address." });
    }
    const existing = await pool2.query("SELECT id, provider, email_verified FROM auth_users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      const ex = existing.rows[0];
      if (ex.provider !== "email") {
        return res.status(409).json({ error: `An account with this email already exists via ${ex.provider}. Please use ${ex.provider} login.` });
      }
      if (!ex.email_verified) {
        const vCode = crypto.randomInt(1e5, 999999).toString();
        const vExpires = new Date(Date.now() + 15 * 60 * 1e3);
        await pool2.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [ex.id, vCode, vExpires]);
        await sendVerificationEmail(email.toLowerCase(), vCode);
        return res.status(409).json({ error: "An account with this email exists but is not verified. A new verification code has been sent.", needsVerification: true, email: email.toLowerCase() });
      }
      return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
    const verificationCode = crypto.randomInt(1e5, 999999).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1e3);
    await pool2.query(
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
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});
router.post("/api/auth/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }
    if (!checkRateLimit(`verify:${email.toLowerCase()}`, 5, 5 * 60 * 1e3)) {
      return res.status(429).json({ error: "Too many verification attempts. Please wait 5 minutes and try again." });
    }
    const result = await pool2.query(
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
    if (/* @__PURE__ */ new Date() > new Date(user.verification_code_expires)) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }
    await pool2.query(
      "UPDATE auth_users SET email_verified = true, verification_code = NULL, verification_code_expires = NULL, updated_at = NOW() WHERE id = $1",
      [user.id]
    );
    req.session.userId = user.id;
    const token = await createAuthToken(user.id);
    const { verification_code, verification_code_expires, email_verified, password_hash, ...safeUser } = user;
    res.json({ success: true, user: { ...safeUser, email_verified: true }, token, message: "Email verified successfully! Welcome to 47daPunjab." });
  } catch (e) {
    console.error("Verify email error:", e);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});
router.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!checkRateLimit(`resend:${email.toLowerCase()}`, 3, 5 * 60 * 1e3)) {
      return res.status(429).json({ error: "Too many requests. Please wait 5 minutes before trying again." });
    }
    const result = await pool2.query("SELECT id, email_verified FROM auth_users WHERE email = $1", [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email" });
    }
    if (result.rows[0].email_verified) {
      return res.json({ success: true, message: "Email is already verified. You can sign in." });
    }
    const code = crypto.randomInt(1e5, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1e3);
    await pool2.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [result.rows[0].id, code, expires]);
    const sent = await sendVerificationEmail(email.toLowerCase(), code);
    if (!sent) {
      return res.status(503).json({ error: "Email service is not available. Please contact 47dapunjab@gmail.com." });
    }
    res.json({ success: true, message: "Verification code sent! Check your email." });
  } catch (e) {
    console.error("Resend verification error:", e);
    res.status(500).json({ error: "Failed to resend verification code." });
  }
});
router.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!checkRateLimit(`login:${email.toLowerCase()}`, 5, 5 * 60 * 1e3)) {
      return res.status(429).json({ error: "Too many login attempts. Please try again in 5 minutes." });
    }
    const result = await pool2.query(
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
      const vCode = crypto.randomInt(1e5, 999999).toString();
      const vExpires = new Date(Date.now() + 15 * 60 * 1e3);
      await pool2.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [user.id, vCode, vExpires]);
      await sendVerificationEmail(email.toLowerCase(), vCode);
      return res.status(403).json({ error: "Please verify your email before logging in. A new verification code has been sent.", needsVerification: true, email: email.toLowerCase() });
    }
    req.session.userId = user.id;
    const { password_hash, email_verified, ...safeUser } = user;
    const token = await createAuthToken(user.id);
    res.json({ user: safeUser, token, message: "Welcome back!" });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});
router.post("/api/auth/smart-login", async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!checkRateLimit(`smartlogin:${email.toLowerCase()}`, 5, 5 * 60 * 1e3)) {
      return res.status(429).json({ error: "Too many login attempts. Please try again in 5 minutes." });
    }
    const existing = await pool2.query(
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
        const vCode = crypto.randomInt(1e5, 999999).toString();
        const vExpires = new Date(Date.now() + 15 * 60 * 1e3);
        await pool2.query("UPDATE auth_users SET verification_code = $2, verification_code_expires = $3 WHERE id = $1", [user.id, vCode, vExpires]);
        await sendVerificationEmail(email.toLowerCase(), vCode);
        return res.status(403).json({ error: "Please verify your email before logging in. A new verification code has been sent.", needsVerification: true, email: email.toLowerCase() });
      }
      req.session.userId = user.id;
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
    const verificationCode = crypto.randomInt(1e5, 999999).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1e3);
    await pool2.query(
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
  } catch (e) {
    console.error("Smart login error:", e);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
});
router.post("/api/auth/social", async (req, res) => {
  try {
    const { email, name, provider, providerId, avatarUrl } = req.body;
    if (!email || !provider) {
      return res.status(400).json({ error: "Email and provider are required" });
    }
    const existing = await pool2.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
      [email.toLowerCase()]
    );
    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      await pool2.query(
        "UPDATE auth_users SET provider = $2, provider_id = $3, avatar_url = COALESCE($4, avatar_url), email_verified = true, updated_at = NOW() WHERE id = $1",
        [user.id, provider, providerId || null, avatarUrl || null]
      );
      user.provider = provider;
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
      const result = await pool2.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [email.toLowerCase(), name || "", provider, providerId || null, avatarUrl || null, assignedRole]
      );
      user = result.rows[0];
    }
    req.session.userId = user.id;
    const socialToken = await createAuthToken(user.id);
    res.json({ user, token: socialToken });
  } catch (e) {
    console.error("Social login error:", e);
    res.status(500).json({ error: "Social login failed" });
  }
});
router.get("/api/auth/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: "Google login is not configured yet. Please use email login." });
  }
  const oauthBase = getOAuthRedirectBase();
  const redirectUri = `${oauthBase}/api/auth/google/callback`;
  const nonce = crypto.randomBytes(16).toString("hex");
  const platform = req.query.platform === "native" ? "native" : "web";
  const state = `${nonce}:${platform}`;
  req.session.oauthState = nonce;
  req.session.save?.();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
    prompt: "select_account"
  });
  console.log(`Google OAuth: redirect_uri=${redirectUri}, platform=${platform}`);
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});
router.get("/api/auth/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const stateStr = state || "";
    const colonIdx = stateStr.lastIndexOf(":");
    const nonce = colonIdx > -1 ? stateStr.slice(0, colonIdx) : stateStr;
    const platform = colonIdx > -1 ? stateStr.slice(colonIdx + 1) : "web";
    const isNative = platform === "native";
    const appScheme = process.env.APP_SCHEME || "47dapunjab";
    const nativeRedirectBase = `${appScheme}://auth`;
    const nativeRedirect = (queryParams) => {
      const params = new URLSearchParams(queryParams);
      const deepLink = `${nativeRedirectBase}?${params.toString()}`;
      const androidPackage = process.env.ANDROID_PACKAGE || "com.punjabtour.fordapunjab";
      const intentUrl = `intent://auth?${params.toString()}#Intent;scheme=${appScheme};package=${androidPackage};end`;
      console.log(`Google OAuth native: deep link redirect to ${deepLink}`);
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body>
<script>
function tryRedirect() {
  var ua = navigator.userAgent || '';
  if (/android/i.test(ua)) {
    window.location.href = ${JSON.stringify(intentUrl)};
  } else {
    window.location.href = ${JSON.stringify(deepLink)};
  }
  setTimeout(function() {
    document.getElementById('manual').style.display = 'block';
  }, 2000);
}
tryRedirect();
</script>
<p>Redirecting to app...</p>
<div id="manual" style="display:none;text-align:center;margin-top:20px;">
  <p>If you were not redirected automatically:</p>
  <a href="${intentUrl}" style="display:inline-block;padding:12px 24px;background:#0D7C3D;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Open in App</a>
</div>
</body></html>`);
    };
    const nativeError = (msg) => {
      return nativeRedirect({ error: msg });
    };
    if (error) {
      console.error(`Google OAuth error: ${error}, platform: ${platform}`);
      if (isNative) return nativeError(`Google login was cancelled: ${error}`);
      return res.send(oauthCallbackHtml(false, `Google login was cancelled or failed: ${error}`));
    }
    if (!code) {
      if (isNative) return nativeError("No authorization code received.");
      return res.send(oauthCallbackHtml(false, "No authorization code received from Google."));
    }
    if (!isNative) {
      const savedNonce = req.session?.oauthState;
      if (nonce && savedNonce && nonce !== savedNonce) {
        return res.send(oauthCallbackHtml(false, "Security check failed. Please try again."));
      }
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      if (isNative) return nativeError("Google OAuth is not configured.");
      return res.send(oauthCallbackHtml(false, "Google OAuth is not fully configured."));
    }
    const oauthBase = getOAuthRedirectBase();
    const redirectUri = `${oauthBase}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token error:", tokenData);
      if (isNative) return nativeError("Failed to get access token from Google.");
      return res.send(oauthCallbackHtml(false, "Failed to get access token from Google."));
    }
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userInfoRes.json();
    if (!googleUser.email) {
      if (isNative) return nativeError("Could not get your email from Google.");
      return res.send(oauthCallbackHtml(false, "Could not get your email from Google."));
    }
    const existing = await pool2.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
      [googleUser.email.toLowerCase()]
    );
    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      await pool2.query(
        "UPDATE auth_users SET provider = 'google', provider_id = $2, avatar_url = COALESCE($3, avatar_url), name = COALESCE(NULLIF(name, ''), $4), email_verified = true, verification_code = NULL, verification_code_expires = NULL, updated_at = NOW() WHERE id = $1",
        [user.id, googleUser.id, googleUser.picture, googleUser.name]
      );
      user.avatar_url = googleUser.picture || user.avatar_url;
      console.log("Google OAuth: linked existing account for", googleUser.email);
    } else {
      const gRole = ADMIN_EMAILS.includes(googleUser.email.toLowerCase()) ? "admin" : "user";
      const result = await pool2.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role, email_verified)
         VALUES ($1, $2, 'google', $3, $4, $5, true) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [googleUser.email.toLowerCase(), googleUser.name || "", googleUser.id, googleUser.picture || null, gRole]
      );
      user = result.rows[0];
      console.log("Google OAuth: created new account for", googleUser.email);
    }
    req.session.userId = user.id;
    delete req.session.oauthState;
    if (isNative) {
      const token = await createAuthToken(user.id);
      return nativeRedirect({ token, userId: String(user.id) });
    }
    const webToken = await createAuthToken(user.id);
    res.send(oauthCallbackHtml(true, `Signed in as ${user.name || user.email}. You can return to the app now.`, webToken));
  } catch (e) {
    console.error("Google callback error:", e);
    res.send(oauthCallbackHtml(false, "An error occurred during Google login. Please try again."));
  }
});
router.get("/api/auth/facebook", (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return res.status(503).json({ error: "Facebook login is not configured yet. Please use email login." });
  }
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email,public_profile",
    state
  });
  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
});
router.get("/api/auth/facebook/callback", async (req, res) => {
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
      code
    })}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Facebook token error:", tokenData);
      return res.send(oauthCallbackHtml(false, "Failed to get access token from Facebook."));
    }
    const userInfoRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`
    );
    const fbUser = await userInfoRes.json();
    if (!fbUser.email) {
      return res.send(oauthCallbackHtml(false, "Could not get your email from Facebook. Please ensure your Facebook account has an email."));
    }
    const avatarUrl = fbUser.picture?.data?.url || null;
    const existing = await pool2.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider FROM auth_users WHERE email = $1",
      [fbUser.email.toLowerCase()]
    );
    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      await pool2.query(
        "UPDATE auth_users SET provider = 'facebook', provider_id = $2, avatar_url = COALESCE($3, avatar_url), name = COALESCE(NULLIF(name, ''), $4), email_verified = true, updated_at = NOW() WHERE id = $1",
        [user.id, fbUser.id, avatarUrl, fbUser.name]
      );
      user.avatar_url = avatarUrl || user.avatar_url;
    } else {
      const fbRole = ADMIN_EMAILS.includes(fbUser.email.toLowerCase()) ? "admin" : "user";
      const result = await pool2.query(
        `INSERT INTO auth_users (email, name, provider, provider_id, avatar_url, role, email_verified)
         VALUES ($1, $2, 'facebook', $3, $4, $5, true) RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
        [fbUser.email.toLowerCase(), fbUser.name || "", fbUser.id, avatarUrl, fbRole]
      );
      user = result.rows[0];
    }
    req.session.userId = user.id;
    delete req.session.oauthState;
    res.send(oauthCallbackHtml(true, `Signed in as ${user.name || user.email}. You can return to the app now.`));
  } catch (e) {
    console.error("Facebook callback error:", e);
    res.send(oauthCallbackHtml(false, "An error occurred during Facebook login. Please try again."));
  }
});
router.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Please enter your email address" });
    }
    const result = await pool2.query(
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
    const code = crypto.randomInt(1e5, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1e3);
    await pool2.query(
      "UPDATE auth_users SET reset_code = $2, reset_code_expires = $3 WHERE id = $1",
      [user.id, code, expires]
    );
    const sent = await sendResetCodeEmail(email.toLowerCase(), code);
    if (!sent) {
      return res.status(503).json({ error: "Email service is not configured yet. Please contact 47dapunjab@gmail.com for your reset code." });
    }
    res.json({ success: true, message: "A 6-digit reset code has been sent to your email. It expires in 15 minutes." });
  } catch (e) {
    console.error("Forgot password error:", e);
    res.status(500).json({ error: "Failed to process reset request. Please try again." });
  }
});
router.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    const result = await pool2.query(
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
    if (/* @__PURE__ */ new Date() > new Date(user.reset_code_expires)) {
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool2.query(
      "UPDATE auth_users SET password_hash = $2, reset_code = NULL, reset_code_expires = NULL, updated_at = NOW() WHERE id = $1",
      [user.id, passwordHash]
    );
    res.json({ success: true, message: "Password reset successfully! You can now sign in with your new password." });
  } catch (e) {
    console.error("Reset password error:", e);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});
router.get("/api/auth/oauth/status", (_req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    facebook: false
  });
});
router.get("/api/auth/me", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const result = await pool2.query(
      "SELECT id, email, name, phone, city, country, purpose, role, avatar_url, provider, created_at FROM auth_users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ user: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: "Session check failed" });
  }
});
router.post("/api/auth/logout", async (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    await pool2.query("DELETE FROM auth_tokens WHERE token = $1", [token]).catch(() => {
    });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});
router.put("/api/auth/profile", async (req, res) => {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { name, phone, city, country, purpose } = req.body;
    const result = await pool2.query(
      `UPDATE auth_users SET name=$2, phone=$3, city=$4, country=$5, purpose=$6, updated_at=NOW() 
       WHERE id=$1 RETURNING id, email, name, phone, city, country, purpose, role, avatar_url, provider`,
      [userId, name || "", phone || "", city || "", country || "", purpose || ""]
    );
    res.json({ user: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: "Profile update failed" });
  }
});
router.get("/api/auth/users", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const adminCheck = await pool2.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const result = await pool2.query(
      "SELECT id, email, name, phone, role, provider, avatar_url, created_at FROM auth_users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
router.put("/api/auth/users/:id/role", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const adminCheck = await pool2.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const targetId = parseInt(req.params.id);
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    await pool2.query("UPDATE auth_users SET role = $2, updated_at = NOW() WHERE id = $1", [targetId, role]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Role update failed" });
  }
});
router.delete("/api/auth/users/:id", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const adminCheck = await pool2.query("SELECT role FROM auth_users WHERE id = $1", [userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const targetId = parseInt(req.params.id);
    if (targetId === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    await pool2.query("DELETE FROM auth_users WHERE id = $1", [targetId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "User deletion failed" });
  }
});
function tokenAuthMiddleware() {
  return async (req, _res, next) => {
    if (req.session?.userId) {
      return next();
    }
    const token = getBearerToken(req);
    if (token) {
      try {
        const user = await getUserFromToken(token);
        if (user) {
          req.session.userId = user.id;
        }
      } catch {
      }
    }
    next();
  };
}
async function ensureAuthTokensTable() {
  await pool2.query(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool2.query(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token)`);
  await pool2.query(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id)`);
  await pool2.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6)`);
  await pool2.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMPTZ`);
  await pool2.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true`);
  await pool2.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6)`);
  await pool2.query(`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMPTZ`);
}
var auth_default = router;

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCompression(app2) {
  app2.use(compression());
}
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    origins.add("https://47dapunjab.com");
    origins.add("https://www.47dapunjab.com");
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    const isMobileApp = !origin && req.header("Authorization")?.startsWith("Bearer ");
    if (isMobileApp) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    } else if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      limit: "50mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false, limit: "50mb" }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const safeResponse = { ...capturedJsonResponse };
        delete safeResponse.token;
        delete safeResponse.password_hash;
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
var METRO_PROXY_SKIP_HEADERS = /* @__PURE__ */ new Set(["transfer-encoding", "content-length", "connection", "content-encoding"]);
function getPublicHost(req) {
  return req.header("x-forwarded-host") || req.get("host") || "";
}
async function proxyManifestFromMetro(platform, req, res) {
  const metroUrl = "http://localhost:8081";
  try {
    const response = await fetch(`${metroUrl}/manifest`, {
      headers: { "expo-platform": platform }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Metro returned ${response.status} for ${platform} manifest` });
    }
    const host = getPublicHost(req);
    const publicBaseUrl = `https://${host}`;
    response.headers.forEach((value, key) => {
      if (!METRO_PROXY_SKIP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    let body = await response.text();
    body = body.replace(/https?:\/\/[^"'\s]*?:8081/g, publicBaseUrl);
    body = body.replace(/exp:\/\/[^"'\s]*?:8081/g, `exp://${host}`);
    body = body.replace(/localhost:8081/g, host);
    res.send(body);
  } catch (error) {
    log(`Metro proxy failed for ${platform} manifest:`, error);
    return res.status(502).json({ error: `Could not connect to Metro bundler at ${metroUrl}. Is the frontend running?` });
  }
}
async function proxyToMetro(req, res) {
  const metroUrl = `http://localhost:8081${req.originalUrl}`;
  try {
    const headers = {};
    const forwardHeaders = ["expo-platform", "accept", "user-agent", "range"];
    for (const h of forwardHeaders) {
      const val = req.header(h);
      if (val) headers[h] = val;
    }
    const response = await fetch(metroUrl, { headers });
    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }
    response.headers.forEach((value, key) => {
      if (!METRO_PROXY_SKIP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(502).json({ error: "Could not connect to Metro bundler" });
  }
}
function serveExpoManifest(platform, req, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    if (process.env.NODE_ENV === "development") {
      return proxyManifestFromMetro(platform, req, res);
    }
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  if (process.env.NODE_ENV === "development") {
    app2.get("/status", (_req, res) => {
      res.send("packager-status:running");
    });
  }
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, req, res);
    }
    if (req.path === "/") {
      if (process.env.NODE_ENV === "development") {
        return proxyToMetro(req, res);
      }
      const webBuildIndex = path.resolve(process.cwd(), "web-build", "index.html");
      if (fs.existsSync(webBuildIndex)) {
        return res.sendFile(webBuildIndex);
      }
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /my-orders
Disallow: /my-submissions
Disallow: /profile

Sitemap: https://47dapunjab.com/sitemap.xml`
    );
  });
  app2.get("/sitemap.xml", (_req, res) => {
    const pages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/services", priority: "0.9", changefreq: "weekly" },
      { loc: "/shop", priority: "0.9", changefreq: "weekly" },
      { loc: "/rent", priority: "0.8", changefreq: "weekly" },
      { loc: "/blog", priority: "0.8", changefreq: "daily" },
      { loc: "/history", priority: "0.7", changefreq: "monthly" },
      { loc: "/pakistan-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/login", priority: "0.5", changefreq: "monthly" },
      { loc: "/subscription", priority: "0.6", changefreq: "monthly" },
      { loc: "/submit-details", priority: "0.6", changefreq: "monthly" },
      { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms", priority: "0.3", changefreq: "yearly" }
    ];
    const urls = pages.map((p) => `  <url>
    <loc>https://47dapunjab.com${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n");
    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
    );
  });
  app2.get("/site.webmanifest", (_req, res) => {
    res.type("application/manifest+json").json({
      name: "47daPunjab",
      short_name: "47daPunjab",
      description: "Your complete service platform for Punjab, Pakistan",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0D7C3D",
      icons: [
        { src: "/assets/images/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/assets/images/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/assets/images/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
      ]
    });
  });
  const staticCacheOptions = { maxAge: "7d", etag: true };
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets"), staticCacheOptions));
  app2.use(express.static(path.resolve(process.cwd(), "static-build"), staticCacheOptions));
  if (process.env.NODE_ENV !== "development") {
    const webBuildDir = path.resolve(process.cwd(), "web-build");
    if (fs.existsSync(webBuildDir)) {
      app2.use(express.static(webBuildDir, staticCacheOptions));
    }
  }
  if (process.env.NODE_ENV === "development") {
    app2.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      return proxyToMetro(req, res);
    });
    log("Dev mode: Full Metro proxy enabled for web and bundle requests");
  } else {
    const webBuildIndex = path.resolve(process.cwd(), "web-build", "index.html");
    if (fs.existsSync(webBuildIndex)) {
      app2.use((req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/assets") || req.method !== "GET") {
          return next();
        }
        const ext = path.extname(req.path);
        if (ext && ext !== ".html") {
          return next();
        }
        res.sendFile(webBuildIndex);
      });
      log("Production: Serving Expo web build with SPA fallback");
    }
  }
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  app.set("trust proxy", 1);
  setupCompression(app);
  setupCors(app);
  setupBodyParsing(app);
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "sessions",
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || "47dapunjab-secret-key",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1e3,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      }
    })
  );
  app.use(tokenAuthMiddleware());
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  await ensureAuthTokensTable();
  app.use(auth_default);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
