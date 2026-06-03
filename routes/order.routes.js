const express = require('express');
const router  = express.Router();
const authenticate = require('../middlewares/auth');
const controller = require('../controllers/order.controller');

const requireRole = require('../middlewares/role');

// All order routes require authentication
router.use(authenticate);

// POST /api/orders — place order (any authenticated user)
router.post(
  '/',
  controller.checkout
);

// GET /api/orders/received — orders for products I sell
router.get(
  '/received',
  requireRole('seller', 'admin'),
  controller.getReceived
);

// GET /api/orders — my order history (buyer)
router.get(
  '/',
  controller.getMyOrders
);

// GET /api/orders/:id — single order detail
router.get(
  '/:id',
  controller.getOrderById
);

// PATCH /api/orders/:id/status — update order status (seller or admin)
router.patch(
  '/:id/status',
  requireRole('seller', 'admin'),
  controller.updateStatus
);

// Note: admin list orders is mounted separately in app.js under /api/admin/orders

module.exports = router;
