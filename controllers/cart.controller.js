const cartService = require('../services/cart.service');

const getCart = async (req, res) => {
  try {
    const items = await cartService.getCart(req.user.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'product_id and positive quantity required' });
    }

    const result = await cartService.addItem(
      req.user.id,
      parseInt(product_id),
      parseInt(quantity)
    );
    res.status(201).json(result);
  } catch (err) {
    // 400 for business logic (e.g., stock/expiry)
    res.status(400).json({ message: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Positive quantity required' });
    }

    const result = await cartService.updateItem(
      parseInt(id),
      req.user.id,
      parseInt(quantity)
    );
    res.json(result);
  } catch (err) {
    const msg = err.message;
    if (msg === 'Cart item not found') {
      return res.status(404).json({ message: msg });
    }
    res.status(400).json({ message: msg });
  }
};

const removeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cartService.removeItem(parseInt(id), req.user.id);
    res.json(result);
  } catch (err) {
    if (err.message === 'Cart item not found') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await cartService.clearCart(req.user.id);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
};
