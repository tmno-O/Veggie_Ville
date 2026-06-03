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
  const token = bearer || cookieToken;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    req.user = jwt.verify(decodeURIComponent(token), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticateToken;
