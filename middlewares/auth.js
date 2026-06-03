const jwt = require('jsonwebtoken');

function getCookie(req, name) {
  const cookie = req.headers.cookie || '';
  return cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * Verify JWT from Authorization: Bearer <token> or same-origin auth cookie.
 * Attaches decoded payload to req.user
 */
const authenticateToken = (req, res, next) => {
  const header = req.headers['authorization'];
  const bearer = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  const cookieToken = getCookie(req, 'vv_token');

  let raw = bearer || cookieToken;
  if (!raw) {
    return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Unauthorized' });
  }

  // Safe decode — malformed percent-encoding must not throw a 500
  try { raw = decodeURIComponent(raw); } catch { /* use as-is */ }

  try {
    req.user = jwt.verify(raw, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    res.status(401).json({
      code:    expired ? 'AUTH_TOKEN_EXPIRED'  : 'AUTH_TOKEN_INVALID',
      message: expired ? 'Your session has expired. Please log in again.' : 'Invalid token.'
    });
  }
};

module.exports = authenticateToken;
