const service = require('../services/auth.service');

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const user = await service.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error('[auth.controller] register:', err.message);
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
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) {
    console.error('[auth.controller] login:', err.message);
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register, login };
