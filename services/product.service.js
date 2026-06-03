const pool = require('../config/db');

/**
 * Get all non-expired products with optional filters
 * @param {{ keyword, category, size, minPrice, maxPrice }} filters
 * @returns {Promise<Array>}
 */
const getAll = async ({ keyword, category, size, minPrice, maxPrice } = {}) => {
  let sql      = 'SELECT * FROM products WHERE best_before >= CURDATE()';
  const params = [];

  if (keyword)  { sql += ' AND name LIKE ?';  params.push(`%${keyword}%`); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (size)     { sql += ' AND size = ?';     params.push(size); }
  if (minPrice) { sql += ' AND price >= ?';   params.push(Number(minPrice)); }
  if (maxPrice) { sql += ' AND price <= ?';   params.push(Number(maxPrice)); }

  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Get a single non-expired product by id
 * @param {number} id
 * @returns {Promise<object>}
 */
const getById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
  if (rows.length === 0) throw new Error('Product not found');
  return rows[0];
};

/**
 * Create a new product and return the full product row
 * @param {{ seller_id, name, description, price, quantity, size, category, best_before }} data
 * @returns {Promise<object>}
 */
const create = async ({ seller_id, name, description, price, quantity, size, category, best_before }) => {
  const [result] = await pool.query(
    `INSERT INTO products
       (seller_id, name, description, price, quantity, size, category, best_before)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [seller_id, name, description ?? null, price, quantity, size, category ?? null, best_before]
  );

  const [rows] = await pool.query(
    'SELECT * FROM products WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
};

/**
 * Partially update a product — seller must own it
 * Only fields present in the request body are updated.
 * Column names come from a hardcoded allowlist — values use ? placeholders.
 * @param {number} id
 * @param {number} seller_id  from JWT
 * @param {object} fields
 * @returns {Promise<object>}  updated product row
 */
const update = async (id, seller_id, fields) => {
  const [existing] = await pool.query(
    'SELECT * FROM products WHERE id = ? AND seller_id = ?',
    [id, seller_id]
  );
  if (existing.length === 0) {
    throw new Error('Product not found or not authorized');
  }

  // Column names from hardcoded allowlist — safe to interpolate
  const allowed = ['name', 'description', 'price', 'quantity', 'size', 'category', 'best_before'];
  const updates = [];
  const params  = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  params.push(id);
  await pool.query(
    `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  const [updated] = await pool.query(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
  return updated[0];
};

/**
 * Delete a product — admin can delete any, seller only owns
 * @param {number} id
 * @param {number} seller_id  from JWT
 * @param {string} role       from JWT
 * @returns {Promise<{ message: string }>}
 */
const remove = async (id, seller_id, role) => {
  if (role === 'admin') {
    const [result] = await pool.query(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) throw new Error('Product not found');
  } else {
    const [result] = await pool.query(
      'DELETE FROM products WHERE id = ? AND seller_id = ?',
      [id, seller_id]
    );
    if (result.affectedRows === 0) {
      throw new Error('Product not found or not authorized');
    }
  }
  return { message: 'Product deleted successfully' };
};

/**
 * Get all products owned by a seller
 * @param {number} seller_id
 * @returns {Promise<Array>}
 */
const getMine = async (seller_id) => {
  const [rows] = await pool.query(
    `SELECT id, seller_id, name, description, price, quantity, size, category, best_before, image_url, created_at
     FROM products WHERE seller_id = ? ORDER BY created_at DESC`,
    [seller_id]
  );
  return rows;
};

module.exports = { getAll, getById, create, update, remove, getMine };
