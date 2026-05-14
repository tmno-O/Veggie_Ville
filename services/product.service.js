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
 * Get a single product by id
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
 * Create a new product
 * @param {{ seller_id, name, description, price, quantity, size, category, best_before }} data
 * @returns {Promise<{ id: number }>}
 */
const create = async ({ seller_id, name, description, price, quantity, size, category, best_before }) => {
  const [result] = await pool.query(
    `INSERT INTO products
       (seller_id, name, description, price, quantity, size, category, best_before)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [seller_id, name, description || null, price, quantity || 0, size, category || null, best_before]
  );
  return { id: result.insertId };
};

/**
 * Update a product — seller must own it
 * @param {number} id
 * @param {number} seller_id  from JWT
 * @param {{ name, description, price, quantity, size, category, best_before }} fields
 * @returns {Promise<{ message: string }>}
 */
const update = async (id, seller_id, { name, description, price, quantity, size, category, best_before }) => {
  const [rows] = await pool.query(
    'SELECT seller_id FROM products WHERE id = ?',
    [id]
  );
  if (rows.length === 0) throw new Error('Product not found');
  if (rows[0].seller_id !== seller_id) throw new Error('Forbidden');

  await pool.query(
    `UPDATE products
     SET name = ?, description = ?, price = ?, quantity = ?,
         size = ?, category = ?, best_before = ?
     WHERE id = ?`,
    [name, description || null, price, quantity, size, category || null, best_before, id]
  );
  return { message: 'Product updated' };
};

/**
 * Delete a product — seller must own it
 * @param {number} id
 * @param {number} seller_id  from JWT
 * @returns {Promise<{ message: string }>}
 */
const remove = async (id, seller_id) => {
  const [rows] = await pool.query(
    'SELECT seller_id FROM products WHERE id = ?',
    [id]
  );
  if (rows.length === 0) throw new Error('Product not found');
  if (rows[0].seller_id !== seller_id) throw new Error('Forbidden');

  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return { message: 'Product deleted' };
};

module.exports = { getAll, getById, create, update, remove };
