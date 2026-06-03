const pool = require('../config/db');

const mapUser = (user) => ({
  ...user,
  is_active: Boolean(user.is_active)
});

/**
 * Get all users — password_hash intentionally excluded
 * @param {object} filters - optional { role, is_active }
 * @returns {Promise<Array>}
 */
const getAllUsers = async (filters = {}) => {
  // NEVER use SELECT * — always list columns explicitly
  // password_hash is intentionally omitted
  let sql = `
    SELECT
      id,
      name,
      email,
      role,
      is_active,
      created_at
    FROM users
  `;
  const params = [];
  const conditions = [];

  if (filters.role) {
    conditions.push('role = ?');
    params.push(filters.role);
  }
  if (filters.is_active !== undefined &&
      filters.is_active !== null &&
      filters.is_active !== '') {
    conditions.push('is_active = ?');
    params.push(filters.is_active === 'true' ? 1 : 0);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(sql, params);
  return rows.map(mapUser);
};

/**
 * Get single user by id — password_hash excluded
 * @param {number} id
 * @returns {Promise<object>}
 */
const getUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       id, name, email, role,
       is_active, created_at
     FROM users
     WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new Error('User not found');
  }
  return mapUser(rows[0]);
};

/**
 * Update user status (ban / activate)
 * Admin cannot deactivate themselves
 * @param {number} target_id  - user to update
 * @param {number} admin_id   - requesting admin (from JWT)
 * @param {boolean} is_active - true = activate, false = ban
 * @returns {Promise<object>} updated user
 */
const updateUserStatus = async (
  target_id, admin_id, is_active
) => {
  // Self-protection: admin cannot ban themselves
  if (Number(target_id) === Number(admin_id)) {
    throw new Error('Cannot deactivate your own account');
  }

  // Verify target user exists
  const [users] = await pool.query(
    'SELECT id FROM users WHERE id = ?',
    [target_id]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  await pool.query(
    'UPDATE users SET is_active = ? WHERE id = ?',
    [is_active ? 1 : 0, target_id]
  );

  // Return updated user without password_hash
  const [updated] = await pool.query(
    `SELECT
       id, name, email, role,
       is_active, created_at
     FROM users WHERE id = ?`,
      [target_id]
  );
  return mapUser(updated[0]);
};

/**
 * Update user role
 * @param {number} target_id - user to update
 * @param {number} admin_id  - requesting admin (from JWT)
 * @param {string} role      - new role value
 * @returns {Promise<object>} updated user
 */
const updateUserRole = async (
  target_id, admin_id, role
) => {
  const allowedRoles = ['buyer', 'seller', 'admin'];
  if (!allowedRoles.includes(role)) {
    throw new Error(
      'Role must be buyer, seller, or admin'
    );
  }

  // Verify target exists
  const [users] = await pool.query(
    'SELECT id FROM users WHERE id = ?',
    [target_id]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  await pool.query(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, target_id]
  );

  // Return updated user without password_hash
  const [updated] = await pool.query(
    `SELECT
       id, name, email, role,
       is_active, created_at
     FROM users WHERE id = ?`,
      [target_id]
  );
  return mapUser(updated[0]);
};

/**
 * Get user statistics summary
 * @returns {Promise<object>} counts by role and status
 */
const getUserStats = async () => {
  const [stats] = await pool.query(
    'SELECT ' +
      'COUNT(*) AS total, ' +
      'SUM(role = "buyer") AS buyers, ' +
      'SUM(role = "seller") AS sellers, ' +
      'SUM(role = "admin") AS admins, ' +
      'SUM(is_active = 1) AS active, ' +
      'SUM(is_active = 0) AS banned ' +
    'FROM users'
  );
  return stats[0];
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getUserStats
};
