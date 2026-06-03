const express               = require('express');
const router                = express.Router();
const authenticate = require('../middlewares/auth');
const requireRole       = require('../middlewares/role');
const controller            = require('../controllers/product.controller');

// Public routes — no auth required
router.get('/',    controller.getAll);
router.get('/:id', controller.getById);

// Protected routes — seller or admin only
router.post('/',
  authenticate,
  requireRole('seller', 'admin'),
  controller.create
);
router.put('/:id',
  authenticate,
  requireRole('seller', 'admin'),
  controller.update
);
router.delete('/:id',
  authenticate,
  requireRole('seller', 'admin'),
  controller.remove
);

module.exports = router;
