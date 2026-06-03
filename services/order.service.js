const pool        = require('../config/db');
const { clearCart } = require('./cart.service');
const discountService = require('./discount.service');

/**
 * Place an order atomically
 * Uses MySQL transaction — all or nothing
 *
 * @param {object} params
 * @param {number} params.buyer_id       - from JWT
 * @param {number} params.pickup_slot_id - must exist in DB
 * @param {Array}  params.items          - [{product_id, quantity}]
 * @returns {Promise<object>} created order summary
 */
const checkout = async ({ buyer_id, pickup_slot_id, items }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── STEP 1: Verify pickup slot exists ──────────────────
    const [slots] = await conn.query(
      'SELECT id FROM pickup_slots WHERE id = ?',
      [pickup_slot_id]
    );
    if (slots.length === 0) {
      throw new Error('Invalid pickup slot');
    }

    // ── STEP 2: Verify each product with LOCK ──────────────
    // Check not expired AND sufficient stock. Use FOR UPDATE to lock rows.
    const verifiedItems = [];

    for (const item of items) {
      const [products] = await conn.query(
        `SELECT id, name, price, size, quantity, category
         FROM products
         WHERE id = ?
         AND best_before >= CURDATE()
         FOR UPDATE`,
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Product ${item.product_id} not found or expired`);
      }

      const product = products[0];

      if (product.quantity < item.quantity) {
        const err = new Error(`Product ${item.product_id} is out of stock`);
        err.code = 'OUT_OF_STOCK';
        err.productId = item.product_id;
        throw err;
      }

      verifiedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        name: product.name,
        category: product.category,
        price: product.price,
        size: product.size
      });
    }

    // ── STEP 3: Calculate Discount ────────────────────────
    const discountData = discountService.calculateDiscount(verifiedItems);

    // ── STEP 4: Insert order ───────────────────────────────
    // Payment bypassed for demo — status = confirmed directly
    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (buyer_id, pickup_slot_id, total_price, status)
       VALUES (?, ?, ?, 'confirmed')`,
      [buyer_id, pickup_slot_id, discountData.total]
    );
    const order_id = orderResult.insertId;

    // ── STEP 5: Insert order_items + deduct stock ──────────
    for (const item of verifiedItems) {
      // Insert order item
      await conn.query(
        `INSERT INTO order_items
           (order_id, product_id, quantity, unit_price, size)
         VALUES (?, ?, ?, ?, ?)`,
        [
          order_id,
          item.product_id,
          item.quantity,
          item.price,
          item.size
        ]
      );
      // Deduct stock from products table with guard
      const [updateResult] = await conn.query(
        `UPDATE products
         SET quantity = quantity - ?
         WHERE id = ? AND quantity >= ?`,
        [item.quantity, item.product_id, item.quantity]
      );

      if (updateResult.affectedRows === 0) {
        const err = new Error(`Product ${item.product_id} is out of stock`);
        err.code = 'OUT_OF_STOCK';
        err.productId = item.product_id;
        throw err;
      }
    }

    // ── STEP 6: Clear buyer's cart ─────────────────────────
    await clearCart(buyer_id, conn);

    // ── STEP 7: Commit everything ──────────────────────────
    await conn.commit();

    return {
      order_id,
      subtotal: discountData.subtotal,
      discount_rate: discountData.discountRate,
      discount_amount: discountData.discountAmount,
      discount_reason: discountData.reason,
      total: discountData.total,
      status: 'confirmed',
      pickup_slot_id,
      item_count: items.length
    };

  } catch (err) {
    // Rollback on ANY error — leave DB unchanged
    await conn.rollback();
    throw err;
  } finally {
    // Always release connection back to pool
    conn.release();
  }
};

/**
 * Get all orders for a specific buyer
 * @param {number} buyer_id - from JWT
 * @returns {Promise<Array>}
 */
const getMyOrders = async (buyer_id) => {
  const [rows] = await pool.query(
    `SELECT
       o.id, o.total_price, o.status, o.created_at,
       ps.slot_start, ps.slot_end,
       COUNT(oi.id) AS item_count
     FROM orders o
     JOIN pickup_slots ps ON o.pickup_slot_id = ps.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.buyer_id = ?
     GROUP BY o.id, ps.slot_start, ps.slot_end
     ORDER BY o.created_at DESC`,
    [buyer_id]
  );
  return rows;
};

/**
 * Get single order detail
 * Verifies ownership — buyer can only see their own
 * @param {number} order_id
 * @param {number} buyer_id  - from JWT
 * @param {string} role      - 'admin' can bypass ownership
 * @returns {Promise<object>}
 */
const getOrderById = async (order_id, buyer_id, role) => {
  // Build query — admin sees any order, buyer sees own only
  let sql = `
    SELECT
      o.id, o.buyer_id, o.total_price,
      o.status, o.created_at,
      ps.slot_start, ps.slot_end, ps.max_orders
    FROM orders o
    JOIN pickup_slots ps ON o.pickup_slot_id = ps.id
    WHERE o.id = ?
  `;
  const params = [order_id];

  if (role !== 'admin') {
    sql += ' AND o.buyer_id = ?';
    params.push(buyer_id);
  }

  const [orders] = await pool.query(sql, params);
  if (orders.length === 0) {
    throw new Error('Order not found');
  }

  // Get order items
  const [items] = await pool.query(
    `SELECT
       oi.id, oi.quantity, oi.unit_price, oi.size,
       p.id AS product_id, p.name, p.category
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [order_id]
  );

  return { ...orders[0], items };
};

/**
 * Get all orders — admin only
 * @param {object} filters - optional { status, date }
 * @returns {Promise<Array>}
 */
const getAllOrders = async (filters = {}) => {
  let sql = `
    SELECT
      o.id, o.buyer_id, o.total_price,
      o.status, o.created_at,
      u.name AS buyer_name, u.email AS buyer_email,
      ps.slot_start, ps.slot_end,
      COUNT(oi.id) AS item_count
    FROM orders o
    JOIN users u  ON o.buyer_id = u.id
    JOIN pickup_slots ps ON o.pickup_slot_id = ps.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
  `;
  const params = [];
  const conditions = [];

  if (filters.status) {
    conditions.push('o.status = ?');
    params.push(filters.status);
  }
  if (filters.date) {
    conditions.push('DATE(o.created_at) = ?');
    params.push(filters.date);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' GROUP BY o.id, u.name, u.email, ps.slot_start, ps.slot_end';
  sql += ' ORDER BY o.created_at DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Get all orders containing products owned by a specific seller
 * @param {number} seller_id - from JWT
 * @returns {Promise<Array>}
 */
const getReceivedOrders = async (seller_id) => {
  const [rows] = await pool.query(
    `SELECT
       o.id,
       o.total_price,
       o.status,
       o.created_at,
       COUNT(oi.id) AS item_count
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     WHERE p.seller_id = ?
     GROUP BY o.id, o.total_price, o.status, o.created_at
     ORDER BY o.created_at DESC`,
    [seller_id]
  );
  return rows;
};

/**
 * Update order status — admin can update any order; seller must own a product in it.
 * @param {number} order_id
 * @param {string} status   - must be one of the allowed enum values
 * @param {{ id: number, role: string }} actor  - from JWT
 * @returns {Promise<object>}
 */
const updateStatus = async (order_id, status, actor) => {
  // Verify order exists
  const [orders] = await pool.query(
    'SELECT id FROM orders WHERE id = ?',
    [order_id]
  );
  if (orders.length === 0) {
    throw new Error('Order not found');
  }

  // Sellers must own at least one product in this order
  if (actor.role !== 'admin') {
    const [owned] = await pool.query(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.id = ? AND p.seller_id = ?
       LIMIT 1`,
      [order_id, actor.id]
    );
    if (owned.length === 0) {
      const err = new Error('Forbidden');
      err.code = 'ORDER_FORBIDDEN';
      throw err;
    }
  }

  await pool.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, order_id]
  );
  return { id: Number(order_id), status };
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getReceivedOrders,
  updateStatus
};
