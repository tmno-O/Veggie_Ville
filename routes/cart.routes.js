const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authenticate = require('../middlewares/auth');

// All cart operations require authentication
router.use(authenticate);

/**
 * @route   GET /api/cart
 * @desc    Get user's shopping cart
 * @access  Private (Buyer/Admin)
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private (Buyer/Admin)
 */
router.post('/', cartController.addItem);

/**
 * @route   PUT /api/cart/:id
 * @desc    Update cart item quantity
 * @access  Private (Owner)
 */
router.put('/:id', cartController.updateItem);

/**
 * @route   DELETE /api/cart/:id
 * @desc    Remove single item from cart
 * @access  Private (Owner)
 */
router.delete('/:id', cartController.removeItem);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', cartController.clearCart);

module.exports = router;
