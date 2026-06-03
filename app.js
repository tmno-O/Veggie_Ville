require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Routes — uncomment as each ticket completes
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/products',     require('./routes/product.routes'));
app.use('/api/cart',         require('./routes/cart.routes'));
app.use('/api/pickup-slots', require('./routes/pickupSlot.routes'));
app.use('/api/orders',       require('./routes/order.routes'));
app.use('/api/admin/users',  require('./routes/admin.routes'));

// Admin order route (reuse same controller)
const orderController = require('./controllers/order.controller');
const authenticate    = require('./middlewares/auth');
const requireRole     = require('./middlewares/role');

app.get(
  '/api/admin/orders',
  authenticate,
  requireRole('admin'),
  orderController.getAllOrders
);

// JSON parse error handler — must register before the generic handler
function jsonParseErrorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    const isAuth = (req.originalUrl || '').startsWith('/api/auth');
    return res.status(400).json({
      code: isAuth ? 'AUTH_INVALID_JSON' : 'INVALID_JSON',
      message: 'The request body is not valid JSON.'
    });
  }
  next(err);
}

// Global error handler — never expose stack trace
function globalErrorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err);
  res.status(500).json({ message: 'Internal server error' });
}

app.use(jsonParseErrorHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, jsonParseErrorHandler };
