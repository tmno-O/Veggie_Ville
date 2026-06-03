const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth');

router.post('/register', controller.register);
router.post('/login',    controller.login);
router.post('/logout',   controller.logout);
router.get('/me',        authenticate, controller.me);

module.exports = router;
