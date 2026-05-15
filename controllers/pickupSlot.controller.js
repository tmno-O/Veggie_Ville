const slotService = require('../services/pickupSlot.service');

/**
 * GET /api/pickup-slots
 * Public to authenticated users (buyer, seller, admin)
 */
const getAll = async (req, res) => {
  try {
    const slots = await slotService.getAll();
    res.json(slots);
  } catch (err) {
    console.error('[pickupSlot.controller] getAll:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/pickup-slots
 * Admin only — create new pickup slot
 */
const create = async (req, res) => {
  try {
    const { slot_start, slot_end, max_orders } = req.body;
    const admin_id = req.user.id; // always from JWT

    // === INPUT VALIDATION ===

    // slot_start required
    if (!slot_start) {
      return res.status(400).json({
        message: 'slot_start is required'
      });
    }

    // slot_end required
    if (!slot_end) {
      return res.status(400).json({
        message: 'slot_end is required'
      });
    }

    // Validate datetime format
    if (isNaN(new Date(slot_start).getTime())) {
      return res.status(400).json({
        message: 'slot_start must be a valid datetime'
      });
    }
    if (isNaN(new Date(slot_end).getTime())) {
      return res.status(400).json({
        message: 'slot_end must be a valid datetime'
      });
    }

    // max_orders required and must be positive integer
    if (max_orders === undefined || max_orders === null) {
      return res.status(400).json({
        message: 'max_orders is required'
      });
    }
    if (isNaN(max_orders) || Number(max_orders) < 1) {
      return res.status(400).json({
        message: 'max_orders must be a positive integer'
      });
    }

    // Call service (service handles slot_start < slot_end)
    const slot = await slotService.create({
      admin_id,
      slot_start,
      slot_end,
      max_orders: Number(max_orders)
    });

    res.status(201).json(slot);

  } catch (err) {
    console.error('[pickupSlot.controller] create:', err);

    // Handle known business logic errors from service
    if (err.message === 'slot_start must be before slot_end') {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes('future')) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * DELETE /api/pickup-slots/:id
 * Admin only — delete pickup slot
 */
const remove = async (req, res) => {
  try {
    const result = await slotService.remove(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('[pickupSlot.controller] remove:', err);

    if (err.message === 'Pickup slot not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('existing orders')) {
      return res.status(409).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAll, create, remove };
