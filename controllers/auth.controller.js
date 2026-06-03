const authService = require('../services/auth.service');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function setAuthCookie(res, token) {
  res.cookie('vv_token', token, cookieOptions);
}

function authError(res, status, code, message) {
  return res.status(status).json({ code, message });
}

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = role ? String(role).trim().toLowerCase() : 'buyer';

    // Input validation
    if (!name || name.trim() === '') {
      return authError(res, 400, 'AUTH_NAME_REQUIRED', 'Please enter your full name.');
    }
    if (!normalizedEmail) {
      return authError(res, 400, 'AUTH_EMAIL_REQUIRED', 'Please enter your email address.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return authError(res, 400, 'AUTH_EMAIL_INVALID', 'Please enter a valid email address.');
    }
    if (!password) {
      return authError(res, 400, 'AUTH_PASSWORD_REQUIRED', 'Please enter a password.');
    }
    if (password.length < 8) {
      return authError(res, 400, 'AUTH_PASSWORD_TOO_SHORT', 'Password must be at least 8 characters.');
    }
    // Admin accounts cannot be created via public registration
    const allowedRoles = ['buyer', 'seller'];
    if (!allowedRoles.includes(normalizedRole)) {
      return authError(res, 400, 'AUTH_ROLE_INVALID', 'Please choose Buyer or Seller.');
    }

    // Call service
    const user = await authService.register({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole
    });
    res.status(201).json(user);

  } catch (err) {
    console.error('[auth.controller] register:', err);
    if (err.message === 'Email already in use' || err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      return authError(res, 409, 'AUTH_EMAIL_EXISTS', 'This email is already registered. Please log in instead.');
    }
    authError(res, 500, 'AUTH_REGISTER_FAILED', 'We could not create your account. Please try again.');
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Input validation
    if (!normalizedEmail) {
      return authError(res, 400, 'AUTH_EMAIL_REQUIRED', 'Please enter your email address.');
    }
    if (!password) {
      return authError(res, 400, 'AUTH_PASSWORD_REQUIRED', 'Please enter your password.');
    }

    // Call service
    const result = await authService.login({ email: normalizedEmail, password });
    setAuthCookie(res, result.token);
    res.status(200).json(result);

  } catch (err) {
    console.error('[auth.controller] login:', err);
    if (err.message === 'Invalid credentials') {
      return authError(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    authError(res, 500, 'AUTH_LOGIN_FAILED', 'We could not log you in. Please try again.');
  }
};

/**
 * POST /api/auth/logout
 */
const logout = (_req, res) => {
  res.clearCookie('vv_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ message: 'Logged out' });
};

/**
 * GET /api/auth/me
 * Returns safe session info for the authenticated user.
 */
const me = async (req, res) => {
  try {
    const [rows] = await require('../config/db').query(
      'SELECT id, name, email, role FROM users WHERE id = ? AND is_active = TRUE',
      [req.user.id]
    );
    if (rows.length === 0) {
      return authError(res, 401, 'AUTH_SESSION_INVALID', 'Your session expired. Please log in again.');
    }
    const { id, name, email, role } = rows[0];
    res.json({ id, name, email, role });
  } catch (err) {
    console.error('[auth.controller] me:', err);
    authError(res, 500, 'AUTH_SESSION_CHECK_FAILED', 'We could not check your session. Please try again.');
  }
};

module.exports = { register, login, logout, me };
