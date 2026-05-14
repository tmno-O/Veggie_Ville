const jwt = require('jsonwebtoken');

/**
 * Verify JWT from Authorization: Bearer <token>
 * Attaches decoded payload to req.user
 */
const authenticateToken = (req, res, next) => {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticateToken };
