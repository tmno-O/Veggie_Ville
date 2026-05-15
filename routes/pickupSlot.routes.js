const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { requireRole }       = require('../middlewares/role');
const controller = require('../controllers/pickupSlot.controller');

// GET /api/pickup-slots
// Authenticated users can view available slots
router.get(
  '/',
  authenticateToken,
  controller.getAll
);

// POST /api/pickup-slots
// Admin only — create new slot
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  controller.create
);

// DELETE /api/pickup-slots/:id
// Admin only — delete slot
router.delete(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  controller.remove
);

module.exports = router;
