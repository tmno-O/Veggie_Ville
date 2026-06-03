const express = require('express');
const router  = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate    = require('../middlewares/auth');
const requireRole     = require('../middlewares/role');

// All /api/admin/users routes require admin role
router.use(authenticate, requireRole('admin'));

/**
 * GET /api/admin/users
 * Search/List users
 */
router.get('/', adminController.getAllUsers);

/**
 * GET /api/admin/users/stats
 * Statistics summary (Note: placed above :id to prevent collision)
 */
router.get('/stats', adminController.getUserStats);

/**
 * GET /api/admin/users/:id
 * Single user details
 */
router.get('/:id', adminController.getUserById);

/**
 * PUT /api/admin/users/:id
 * Update role or ban/activate
 */
router.put('/:id', adminController.updateUser);

module.exports = router;
