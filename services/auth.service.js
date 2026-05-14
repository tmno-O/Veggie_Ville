const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

/**
 * Register a new user
 * @param {{ name, email, password, role }} data
 * @returns {Promise<{ id, name, email, role }>}
 */
const register = async ({ name, email, password, role = 'buyer' }) => {
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (existing.length > 0) throw new Error('Email already in use');

  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, role]
  );
  return { id: result.insertId, name, email, role };
};

/**
 * Login and return JWT
 * @param {{ email, password }} credentials
 * @returns {Promise<{ token, user: { id, name, role } }>}
 */
const login = async ({ email, password }) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
    [email]
  );
  if (rows.length === 0) throw new Error('Invalid credentials');

  const user  = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, user: { id: user.id, name: user.name, role: user.role } };
};

module.exports = { register, login };
