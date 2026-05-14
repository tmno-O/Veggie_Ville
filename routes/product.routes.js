const express              = require('express');
const router               = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { requireRole }       = require('../middlewares/role');
const controller            = require('../controllers/product.controller');

router.get('/',    controller.getAll);
router.get('/:id', controller.getById);
router.post('/',   authenticateToken, requireRole('seller'), controller.create);
router.put('/:id', authenticateToken, requireRole('seller'), controller.update);
router.delete('/:id', authenticateToken, requireRole('seller'), controller.remove);

module.exports = router;
