require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'Wireframes.html')));

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

// SPA fallback — serve the wireframe shell for any non-API route
app.get(/^(?!\/api|\/socket\.io|\/veggie-ui\.css|\/veggie-ui\.js|\/modal\.js|\/public).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'Wireframes.html'));
});

// Global error handler — never expose stack trace
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });
// store io for other modules
require('./lib/socket').set(io);

io.on('connection', socket => {
  // expect token in handshake auth: { token }
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return; // unauthenticated sockets are ignored for room join
  const jwt = require('jsonwebtoken');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const uid = payload.id;
    if (uid) {
      socket.join(`user:${uid}`);
    }
    if (payload && payload.role === 'admin') {
      socket.join('admins');
    }
  } catch (err) {
    // ignore invalid token
  }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
