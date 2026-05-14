const express               = require('express');
const router                = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { requireRole }       = require('../middlewares/role');
const controller            = require('../controllers/product.controller');

// Public routes — no auth required
router.get('/',    controller.getAll);
router.get('/:id', controller.getById);

// Protected routes — seller or admin only
router.post('/',
  authenticateToken,
  requireRole('seller', 'admin'),
  controller.create
);
router.put('/:id',
  authenticateToken,
  requireRole('seller', 'admin'),
  controller.update
);
router.delete('/:id',
  authenticateToken,
  requireRole('seller', 'admin'),
  controller.remove
);

module.exports = router;
