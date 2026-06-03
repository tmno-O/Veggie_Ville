const orderService = require('../services/order.service');

/**
 * POST /api/orders
 * Place an order — buyer only
 */
const checkout = async (req, res) => {
  try {
    const buyer_id = req.user.id; // ALWAYS from JWT

    const { pickup_slot_id, items } = req.body;

    // === INPUT VALIDATION ===

    // pickup_slot_id required
    if (!pickup_slot_id) {
      return res.status(400).json({
        message: 'pickup_slot_id is required'
      });
    }
    if (isNaN(pickup_slot_id) || Number(pickup_slot_id) < 1) {
      return res.status(400).json({
        message: 'pickup_slot_id must be a valid number'
      });
    }

    // items required and must be non-empty array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'items must be a non-empty array'
      });
    }

    // Validate each item in array
    for (const item of items) {
      if (!item.product_id || isNaN(item.product_id)) {
        return res.status(400).json({
          message: 'Each item must have a valid product_id'
        });
      }
      if (
        !item.quantity ||
        isNaN(item.quantity) ||
        Number(item.quantity) < 1
      ) {
        return res.status(400).json({
          message: 'Each item must have quantity >= 1'
        });
      }
    }

    // Normalize item values to numbers
    const normalizedItems = items.map(item => ({
      product_id: Number(item.product_id),
      quantity:   Number(item.quantity)
    }));

    const result = await orderService.checkout({
      buyer_id,
      pickup_slot_id: Number(pickup_slot_id),
      items: normalizedItems
    });

    res.status(201).json(result);

  } catch (err) {
    console.error('[order.controller] checkout:', err);

    if (err.message === 'Invalid pickup slot') {
      return res.status(400).json({ message: err.message });
    }
    if (
      err.message.includes('expired') ||
      err.message.includes('out of stock')
    ) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/orders
 * Get current buyer's order history
 */
const getMyOrders = async (req, res) => {
  try {
    const buyer_id = req.user.id;
    const orders   = await orderService.getMyOrders(buyer_id);
    res.json(orders);
  } catch (err) {
    console.error('[order.controller] getMyOrders:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/orders/:id
 * Get single order detail — buyer sees own only
 */
const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json(order);
  } catch (err) {
    console.error('[order.controller] getOrderById:', err);
    if (err.message === 'Order not found') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/admin/orders
 * Get all orders — admin only
 */
const getAllOrders = async (req, res) => {
  try {
    const filters = {
      status: req.query.status || null,
      date:   req.query.date   || null
    };
    const orders = await orderService.getAllOrders(filters);
    res.json(orders);
  } catch (err) {
    console.error('[order.controller] getAllOrders:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  getAllOrders
};
