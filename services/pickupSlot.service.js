const pool = require('../config/db');

/**
 * Get all pickup slots
 * @returns {Promise<Array>} list of all slots
 */
const getAll = async () => {
  const [rows] = await pool.query(
    `SELECT
       id, admin_id, slot_start, slot_end,
       max_orders, created_at
     FROM pickup_slots
     ORDER BY slot_start ASC`
  );
  return rows;
};

/**
 * Create a new pickup slot (admin only)
 * @param {object} data
 * @param {number} data.admin_id   - from JWT req.user.id
 * @param {string} data.slot_start - datetime string
 * @param {string} data.slot_end   - datetime string
 * @param {number} data.max_orders - max bookings allowed
 * @returns {Promise<object>} created slot with id
 */
const create = async ({ admin_id, slot_start,
                         slot_end, max_orders }) => {
  // Business rule: slot_start must be before slot_end
  if (new Date(slot_start) >= new Date(slot_end)) {
    throw new Error(
      'slot_start must be before slot_end'
    );
  }

  // Business rule: slot must be in the future
  if (new Date(slot_start) <= new Date()) {
    throw new Error(
      'Pickup slot must be scheduled in the future'
    );
  }

  const [result] = await pool.query(
    `INSERT INTO pickup_slots
       (admin_id, slot_start, slot_end, max_orders)
     VALUES (?, ?, ?, ?)`,
    [admin_id, slot_start, slot_end, max_orders]
  );

  // Return full created slot
  const [rows] = await pool.query(
    'SELECT * FROM pickup_slots WHERE id = ?',
    [result.insertId]
  );
  // Emit slot created to clients/admins
  try{
    const io = require('../lib/socket').get();
    if(io){
      io.emit('pickup-slot:created', rows[0]);
      io.to('admins').emit('pickup-slot:created', rows[0]);
    }
  }catch(e){}
  return rows[0];
};

/**
 * Delete a pickup slot by id (admin only)
 * @param {number} id
 * @returns {Promise<object>} success message
 */
const remove = async (id) => {
  // Check if slot has existing orders before deleting
  const [orders] = await pool.query(
    'SELECT COUNT(*) AS count FROM orders WHERE pickup_slot_id = ?',
    [id]
  );
  if (orders[0].count > 0) {
    throw new Error(
      'Cannot delete slot with existing orders'
    );
  }

  const [result] = await pool.query(
    'DELETE FROM pickup_slots WHERE id = ?',
    [id]
  );
  if (result.affectedRows === 0) {
    throw new Error('Pickup slot not found');
  }
  // Emit slot removed
  try{
    const io = require('../lib/socket').get();
    if(io){
      io.emit('pickup-slot:removed', { id: Number(id) });
      io.to('admins').emit('pickup-slot:removed', { id: Number(id) });
    }
  }catch(e){}
  return { message: 'Pickup slot deleted successfully' };
};

module.exports = { getAll, create, remove };
