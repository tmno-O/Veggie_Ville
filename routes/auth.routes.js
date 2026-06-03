const express      = require('express');
const router       = express.Router();
const rateLimit    = require('express-rate-limit');
const controller   = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'AUTH_RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' }
});

router.post('/register', authLimiter, controller.register);
router.post('/login',    authLimiter, controller.login);
router.post('/logout',   controller.logout);
router.get('/me',        authenticate, controller.me);

module.exports = router;
