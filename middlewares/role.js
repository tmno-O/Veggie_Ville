/**
 * Role-based access control
 * @param {...string} roles - allowed roles
 * @example router.post('/', auth, requireRole('admin'), controller)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

module.exports = { requireRole };
