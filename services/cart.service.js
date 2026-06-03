const pool = require('../config/db');

/**
 * Get cart items for a specific user
 * Joins with products to return full product details
 * @param {number} user_id - from JWT
 * @returns {Promise<Array>} cart items with product info
 */
const getCart = async (user_id) => {
  const [rows] = await pool.query(
    `SELECT
       ci.id          AS cart_item_id,
       ci.quantity    AS cart_quantity,
       ci.added_at,
       p.id           AS product_id,
       p.name,
       p.price,
       p.size,
       p.category,
       p.best_before,
       p.quantity     AS stock_quantity,
       (ci.quantity * p.price) AS subtotal
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = ?
     ORDER BY ci.added_at DESC`,
    [user_id]
  );
  return rows;
};

/**
 * Add item to cart with expiry + stock check
 * Updates quantity if item already in cart
 * @param {number} user_id    - from JWT
 * @param {number} product_id
 * @param {number} quantity
 * @returns {Promise<object>} success message
 */
const addItem = async (user_id, product_id, quantity) => {
  // Gatekeeper: check product exists, not expired,
  // and has sufficient stock
  const [products] = await pool.query(
    `SELECT * FROM products
     WHERE id = ?
     AND best_before >= date('now', 'localtime')
     AND quantity >= ?`,
    [product_id, quantity]
  );
  if (products.length === 0) {
    throw new Error('Product is expired or out of stock');
  }

  // Check if item already in this user's cart
  const [existing] = await pool.query(
    `SELECT id, quantity FROM cart_items
     WHERE user_id = ? AND product_id = ?`,
    [user_id, product_id]
  );

  if (existing.length > 0) {
    // Item exists — add to current quantity
    const newQty = existing[0].quantity + quantity;

    // Re-check stock for combined quantity
    const [recheck] = await pool.query(
      `SELECT id FROM products
       WHERE id = ?
       AND best_before >= date('now', 'localtime')
       AND quantity >= ?`,
      [product_id, newQty]
    );
    if (recheck.length === 0) {
      throw new Error('Not enough stock for requested quantity');
    }

    await pool.query(
      `UPDATE cart_items
       SET quantity = ?
       WHERE id = ?`,
      [newQty, existing[0].id]
    );
  } else {
    // Item not in cart — insert new row
    await pool.query(
      `INSERT INTO cart_items
         (user_id, product_id, quantity)
       VALUES (?, ?, ?)`,
      [user_id, product_id, quantity]
    );
  }

  // Emit cart update to user's socket room (if socket server available)
  try{
    const io = require('../lib/socket').get();
    if(io){
      const items = await getCart(user_id);
      const total = items.reduce((s,i)=>s+Number(i.subtotal||0),0);
      io.to(`user:${user_id}`).emit('cart:update', { items, total, count: items.length });
    }
  }catch(e){ /* non-fatal */ }

  return { message: 'Item added to cart' };
};

/**
 * Update quantity of a cart item
 * @param {number} cart_item_id - cart_items.id
 * @param {number} user_id      - from JWT (ownership check)
 * @param {number} quantity     - new quantity
 * @returns {Promise<object>} success message
 */
const updateItem = async (cart_item_id, user_id, quantity) => {
  // Verify ownership — user can only update their own cart
  const [items] = await pool.query(
    `SELECT ci.*, p.best_before, p.quantity AS stock
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.id = ? AND ci.user_id = ?`,
    [cart_item_id, user_id]
  );
  if (items.length === 0) {
    throw new Error('Cart item not found');
  }

  const item = items[0];

  // Check product still not expired
  if (new Date(item.best_before) < new Date()) {
    throw new Error('Product has expired — remove from cart');
  }

  // Check stock for new quantity
  if (item.stock < quantity) {
    throw new Error('Not enough stock for requested quantity');
  }

  await pool.query(
    `UPDATE cart_items SET quantity = ?
     WHERE id = ? AND user_id = ?`,
    [quantity, cart_item_id, user_id]
  );

  try{
    const io = require('../lib/socket').get();
    if(io){
      const items = await getCart(user_id);
      const total = items.reduce((s,i)=>s+Number(i.subtotal||0),0);
      io.to(`user:${user_id}`).emit('cart:update', { items, total, count: items.length });
    }
  }catch(e){ }

  return { message: 'Cart updated' };
};

/**
 * Remove a single item from cart
 * @param {number} cart_item_id
 * @param {number} user_id - from JWT (ownership check)
 * @returns {Promise<object>} success message
 */
const removeItem = async (cart_item_id, user_id) => {
  const [result] = await pool.query(
    `DELETE FROM cart_items
     WHERE id = ? AND user_id = ?`,
    [cart_item_id, user_id]
  );
  if (result.affectedRows === 0) {
    throw new Error('Cart item not found');
  }
  try{
    const io = require('../lib/socket').get();
    if(io){
      const items = await getCart(user_id);
      const total = items.reduce((s,i)=>s+Number(i.subtotal||0),0);
      io.to(`user:${user_id}`).emit('cart:update', { items, total, count: items.length });
    }
  }catch(e){}
  return { message: 'Item removed from cart' };
};

/**
 * Clear entire cart for a user
 * Called internally by BE-07 after successful checkout
 * @param {number} user_id
 * @param {object} conn - optional DB connection (for transaction)
 */
const clearCart = async (user_id, conn = pool) => {
  await conn.query(
    'DELETE FROM cart_items WHERE user_id = ?',
    [user_id]
  );
  try{
    const io = require('../lib/socket').get();
    if(io){
      io.to(`user:${user_id}`).emit('cart:update', { items: [], total: 0, count: 0 });
    }
  }catch(e){}
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
};
