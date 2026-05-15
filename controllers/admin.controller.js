const adminService = require('../services/admin.service');

/**
 * GET /api/admin/users
 * List all users with optional filters
 */
const getAllUsers = async (req, res) => {
  try {
    const filters = {
      role:      req.query.role      || null,
      is_active: req.query.is_active ?? null
    };
    const users = await adminService.getAllUsers(filters);
    res.json(users);
  } catch (err) {
    console.error('[admin.controller] getAllUsers:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/admin/users/:id
 * Get single user detail
 */
const getUserById = async (req, res) => {
  try {
    const user = await adminService.getUserById(
      req.params.id
    );
    res.json(user);
  } catch (err) {
    console.error('[admin.controller] getUserById:', err);
    if (err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user — supports is_active and/or role
 */
const updateUser = async (req, res) => {
  try {
    const target_id = req.params.id;
    const admin_id  = req.user.id; // from JWT
    const { is_active, role } = req.body;

    // Must provide at least one field to update
    if (is_active === undefined && role === undefined) {
      return res.status(400).json({
        message: 'Provide is_active or role to update'
      });
    }

    let result;

    // Handle is_active update (ban / activate)
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean' &&
          is_active !== 'true' &&
          is_active !== 'false' &&
          is_active !== 0 &&
          is_active !== 1) {
        return res.status(400).json({
          message: 'is_active must be true or false'
        });
      }
      const activeValue = is_active === true ||
                          is_active === 'true' ||
                          is_active === 1;
      result = await adminService.updateUserStatus(
        target_id, admin_id, activeValue
      );
    }

    // Handle role update
    if (role !== undefined) {
      result = await adminService.updateUserRole(
        target_id, admin_id, role
      );
    }

    res.json(result);

  } catch (err) {
    console.error('[admin.controller] updateUser:', err);

    if (err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    if (
      err.message === 'Cannot deactivate your own account' ||
      err.message.includes('Role must be')
    ) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await adminService.getUserStats();
    res.json(stats);
  } catch (err) {
    console.error('[admin.controller] getUserStats:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  getUserStats
};
