import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const TABLE_MAP: Record<string, string> = {
  bookings: "bookings",
  cart: "cart",
  propertyDetails: "property_details",
  rentalInquiries: "rental_inquiries",
  users: "users",
};

function getTable(collection: string) {
  return TABLE_MAP[collection] || collection;
}

export async function addDocument(collectionName: string, data: any) {
  const table = getTable(collectionName);
  const result = await pool.query(
    `INSERT INTO ${table} (data) VALUES ($1) RETURNING id`,
    [JSON.stringify(data)]
  );
  return { id: String(result.rows[0].id) };
}

export async function getDocuments(collectionName: string) {
  const table = getTable(collectionName);
  const result = await pool.query(
    `SELECT id, data FROM ${table} ORDER BY created_at DESC`
  );
  return result.rows.map((row) => ({ docId: String(row.id), ...row.data }));
}

export async function deleteDocument(collectionName: string, docId: string) {
  const table = getTable(collectionName);
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [parseInt(docId)]);
}

export async function setDocument(collectionName: string, docId: string, data: any) {
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

export async function getDocument(collectionName: string, docId: string) {
  const table = getTable(collectionName);
  if (collectionName === "users") {
    const result = await pool.query(`SELECT data FROM ${table} WHERE user_id = $1`, [docId]);
    if (result.rows.length === 0) return null;
    return result.rows[0].data;
  }
  const result = await pool.query(`SELECT id, data FROM ${table} WHERE id = $1`, [parseInt(docId)]);
  if (result.rows.length === 0) return null;
  return { docId: String(result.rows[0].id), ...result.rows[0].data };
}
