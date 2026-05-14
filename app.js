require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Routes — uncomment as each ticket completes
// app.use('/api/auth',         require('./routes/auth.routes'));
// app.use('/api/products',     require('./routes/product.routes'));
// app.use('/api/cart',         require('./routes/cart.routes'));
// app.use('/api/pickup-slots', require('./routes/pickupSlot.routes'));
// app.use('/api/orders',       require('./routes/order.routes'));
// app.use('/api/admin',        require('./routes/admin.routes'));

// Global error handler — never expose stack trace
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
