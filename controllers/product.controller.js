const service = require('../services/product.service');

/**
 * GET /api/products
 */
const getAll = async (req, res) => {
  try {
    const products = await service.getAll(req.query);
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
    const product = await service.getById(Number(req.params.id));
    res.json(product);
  } catch (err) {
    console.error('[product.controller] getById:', err);
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
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

    if (!name)        return res.status(400).json({ message: 'Name is required' });
    if (!price)       return res.status(400).json({ message: 'Price is required' });
    if (!size)        return res.status(400).json({ message: 'Size is required' });
    if (!best_before) return res.status(400).json({ message: 'best_before is required' });

    const result = await service.create({
      seller_id: req.user.id,
      name, description, price, quantity, size, category, best_before,
    });
    res.status(201).json(result);
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
    const result = await service.update(
      Number(req.params.id),
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    console.error('[product.controller] update:', err);
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'Forbidden') {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * DELETE /api/products/:id
 */
const remove = async (req, res) => {
  try {
    const result = await service.remove(Number(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    console.error('[product.controller] remove:', err);
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'Forbidden') {
      return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAll, getById, create, update, remove };
