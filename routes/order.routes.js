const express = require('express');
const router  = express.Router();
const authenticate = require('../middlewares/auth');
const controller = require('../controllers/order.controller');

// All order routes require authentication
router.use(authenticate);

// POST /api/orders — place order (any authenticated user)
router.post(
  '/',
  controller.checkout
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

// Note: admin list orders is mounted separately in app.js under /api/admin/orders

module.exports = router;
