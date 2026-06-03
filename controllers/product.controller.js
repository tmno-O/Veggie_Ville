const productService = require('../services/product.service');

/**
 * GET /api/products
 */
const getAll = async (req, res) => {
  try {
    const products = await productService.getAll(req.query);
    res.json(products);
  } catch (err) {
    console.error('[product.controller] getAll:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/products/:id
 */
const getById = async (req, res) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('[product.controller] getById:', err);
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/products
 */
const create = async (req, res) => {
  try {
    const { name, description, price, quantity, size, category, best_before } = req.body;
    const seller_id = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (price === undefined || price === null) {
      return res.status(400).json({ message: 'Price is required' });
    }
    if (isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    if (isNaN(quantity) || Number(quantity) < 0) {
      return res.status(400).json({ message: 'Quantity must be 0 or more' });
    }

    const allowedSizes = ['S', 'M', 'L', 'XL'];
    if (!size || !allowedSizes.includes(size)) {
      return res.status(400).json({ message: 'Size must be S, M, L, or XL' });
    }
    if (!best_before) {
      return res.status(400).json({ message: 'Best before date is required' });
    }

    const expiry = new Date(best_before);
    if (isNaN(expiry.getTime())) {
      return res.status(400).json({ message: 'Invalid best before date' });
    }
    if (expiry < new Date()) {
      return res.status(400).json({ message: 'Best before date must be in the future' });
    }

    const product = await productService.create({
      seller_id,
      name: name.trim(),
      description,
      price:    Number(price),
      quantity: Number(quantity),
      size,
      category,
      best_before,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('[product.controller] create:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * PUT /api/products/:id
 */
const update = async (req, res) => {
  try {
    const result = await productService.update(
      Number(req.params.id),
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    console.error('[product.controller] update:', err);
    if (err.message === 'No valid fields to update') {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes('not authorized') || err.message === 'Product not found') {
      return res.status(err.message === 'Product not found' ? 404 : 403)
        .json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * DELETE /api/products/:id
 */
const remove = async (req, res) => {
  try {
    const result = await productService.remove(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json(result);
  } catch (err) {
    console.error('[product.controller] remove:', err);
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('not authorized')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/products/mine
 */
const getMine = async (req, res) => {
  try {
    const products = await productService.getMine(req.user.id);
    res.json(products);
  } catch (err) {
    console.error('[product.controller] getMine:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAll, getById, create, update, remove, getMine };
