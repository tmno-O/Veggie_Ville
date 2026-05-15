const express = require('express');
const router  = express.Router();
const authenticate = require('../middlewares/auth');
const requireRole       = require('../middlewares/role');
const controller = require('../controllers/pickupSlot.controller');

// GET /api/pickup-slots
// Authenticated users can view available slots
router.get(
  '/',
  authenticate,
  controller.getAll
);

// POST /api/pickup-slots
// Admin only — create new slot
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  controller.create
);

// DELETE /api/pickup-slots/:id
// Admin only — delete slot
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  controller.remove
);

module.exports = router;
