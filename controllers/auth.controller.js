const authService = require('../services/auth.service');

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const allowedRoles = ['buyer', 'seller', 'admin'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Call service
    const user = await authService.register({ name, email, password, role });
    res.status(201).json(user);

  } catch (err) {
    console.error('[auth.controller] register:', err);
    if (err.message === 'Email already in use') {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Call service
    const result = await authService.login({ email, password });
    res.status(200).json(result);

  } catch (err) {
    console.error('[auth.controller] login:', err);
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/auth/me
 * Return decoded JWT payload for current user
 */
const me = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // Only expose safe fields
    const { id, role } = req.user;
    res.json({ id, role });
  } catch (err) {
    console.error('[auth.controller] me:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register, login, me };
