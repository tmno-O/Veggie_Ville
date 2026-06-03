/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function json(data, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}

async function loadApp({ route = '/', role = null, fetchImpl = null } = {}) {
  document.documentElement.innerHTML = '<head></head><body><main id="app-root"></main></body>';
  window.history.pushState({}, '', route);
  window.scrollTo = jest.fn();
  window.io = undefined;
  window.alert = jest.fn();
  localStorage.clear();
  if (role) localStorage.setItem('vv_token', 'token');

  const defaultFetch = jest.fn(async (url, opts = {}) => {
    if (url === '/api/auth/me') {
      return role ? json({ id: 7, role }) : json({ message: 'Unauthorized' }, false, 401);
    }
    if (String(url).startsWith('/api/products/mine')) {
      return json([{ id: 3, seller_id: 7, name: 'Seller item', price: 20, size: 'M', category: 'Vegetable', quantity: 5, best_before: '2026-06-01' }]);
    }
    if (String(url).startsWith('/api/products')) {
      return json([{ id: 1, seller_id: 7, name: 'Tomato <safe>', price: 12, size: 'M', category: 'Vegetable', quantity: 4, best_before: '2026-06-01' }]);
    }
    if (url === '/api/cart') {
      return json({ items: [{ cart_item_id: 2, product_id: 1, name: 'Cart <safe>', price: 12, size: 'M', best_before: '2026-06-01', cart_quantity: 2, subtotal: 24 }], total: 24, count: 1 });
    }
    if (url === '/api/pickup-slots') {
      return json([{ id: 1, slot_start: '2026-06-01T09:00:00Z', slot_end: '2026-06-01T12:00:00Z', max_orders: 5 }]);
    }
    if (url === '/api/orders') {
      return json([{ id: 5, total_price: 24, status: 'confirmed', created_at: '2026-05-21T00:00:00Z', slot_start: '2026-06-01T09:00:00Z', slot_end: '2026-06-01T12:00:00Z', item_count: 1 }]);
    }
    if (url === '/api/orders/5') {
      return json({ id: 5, total_price: 24, status: 'confirmed', slot_start: '2026-06-01T09:00:00Z', slot_end: '2026-06-01T12:00:00Z', items: [{ name: 'Tomato', quantity: 2, unit_price: 12 }] });
    }
    if (url === '/api/admin/users/stats') return json({ total: 9, sellers: 2, banned: 1 });
    if (url === '/api/admin/users') return json([{ id: 7, name: 'Admin', email: 'a@example.com', role: 'admin', is_active: true }]);
    if (url === '/api/admin/orders') return json([{ id: 5 }]);
    return json({});
  });
  window.fetch = fetchImpl || defaultFetch;

  eval(read('public/components.js'));
  eval(read('public/modal.js'));
  eval(read('public/error-banner.js'));
  eval(read('public/veggie-ui.js'));
  eval(read('public/router.js'));
  await new Promise(resolve => setTimeout(resolve, 40));
  return window.fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('protected routes redirect anonymous users to /login with returnTo', async () => {
  await loadApp({ route: '/cart' });
  expect(window.location.pathname).toBe('/login');
  expect(window.location.search).toContain('returnTo');
});

test('how it works nav routes to the homepage section', async () => {
  Element.prototype.scrollIntoView = jest.fn();
  await loadApp({ route: '/products/111' });
  document.querySelector('[data-route="/#how-it-works"]').click();
  await new Promise(resolve => setTimeout(resolve, 40));
  expect(window.location.pathname).toBe('/');
  expect(window.location.hash).toBe('#how-it-works');
  expect(document.getElementById('how-it-works')).not.toBeNull();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});

test('anonymous desktop nav hides the profile avatar', async () => {
  await loadApp({ route: '/' });
  const desktopAvatar = document.querySelector('.page-desktop .nav-bar .avatar');
  expect(desktopAvatar.hidden).toBe(true);
  expect(desktopAvatar.style.display).toBe('none');
  expect(document.querySelector('.page-desktop .vv-account-action').textContent).toBe('Login');
});

test('product and cart rendering do not create tags from unsafe names', async () => {
  await loadApp({ route: '/', role: 'buyer' });
  expect(document.querySelector('.pcard .vvc-name').textContent).toBe('Tomato <safe>');
  expect(document.querySelectorAll('safe')).toHaveLength(0);

  window.VVAuth.authFetch = jest.fn(async (url) => {
    if (url === '/api/cart') return json({ items: [{ cart_item_id: 1, name: 'Cart <safe>', price: 1, cart_quantity: 1, subtotal: 1 }], total: 1, count: 1 });
    return json({});
  });
  document.querySelector('.nav-bar .icon[title="cart"]').click();
  await new Promise(resolve => setTimeout(resolve, 40));
  expect(document.querySelector('.vv-cart-body').textContent).toContain('Cart <safe>');
  expect(document.querySelectorAll('safe')).toHaveLength(0);
});

test('checkout page uses visible layout pickup slot when placing orders', async () => {
  const calls = [];
  await loadApp({
    route: '/checkout',
    role: 'buyer',
    fetchImpl: jest.fn(async (url, opts = {}) => {
      calls.push({ url, opts });
      if (url === '/api/auth/me') return json({ id: 1, role: 'buyer' });
      if (url === '/api/cart') return json({ items: [{ cart_item_id: 1, product_id: 4, name: 'Item', price: 2, cart_quantity: 1, subtotal: 2 }], total: 2, count: 1 });
      if (url === '/api/pickup-slots') return json([{ id: 11, slot_start: '2026-06-01T09:00:00Z', slot_end: '2026-06-01T12:00:00Z', max_orders: 5 }, { id: 22, slot_start: '2026-06-02T09:00:00Z', slot_end: '2026-06-02T12:00:00Z', max_orders: 5 }]);
      if (url === '/api/orders') return json({ order_id: 99 }, true, 201);
      return json({});
    })
  });
  document.querySelector('.page-phone .vv-pickup-slot').value = '11';
  document.querySelector('.page-desktop .vv-pickup-slot').value = '22';
  document.querySelector('.page-desktop .vv-place-order').click();
  await new Promise(resolve => setTimeout(resolve, 40));
  const orderCall = calls.find(call => call.url === '/api/orders' && call.opts.method === 'POST');
  expect(JSON.parse(orderCall.opts.body).pickup_slot_id).toBe(22);
});

test('seller dashboard uses seller-owned product endpoint', async () => {
  const fetchMock = await loadApp({ route: '/seller', role: 'seller' });
  expect(fetchMock).toHaveBeenCalledWith('/api/products/mine', expect.any(Object));
  expect(document.body.textContent).toContain('Seller item');
});

test('admin stats update desktop and mobile layouts', async () => {
  await loadApp({ route: '/admin', role: 'admin' });
  expect([...document.querySelectorAll('.page-phone .stat .v')].map(el => el.textContent).slice(0, 4)).toEqual(['9', '2', '1', '1']);
  expect([...document.querySelectorAll('.page-desktop .stat .v')].map(el => el.textContent).slice(0, 4)).toEqual(['9', '2', '1', '1']);
});

// ─── Auth validation UI tests ───────────────────────────────────────────────

function getModalText() {
  return document.querySelector('.vv-modal-body')?.textContent || '';
}

async function submitLoginForm(overrides = {}) {
  const form = document.querySelector('.vv-login-form');
  const fields = { email: 'seller@test.com', password: 'password123', ...overrides };
  form.querySelector('[name="email"]').value  = fields.email;
  form.querySelector('[name="password"]').value = fields.password;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 20));
}

async function submitRegisterForm(overrides = {}) {
  const form = document.querySelector('.vv-register-form');
  const fields = {
    name: 'Test User', email: 'new@test.com',
    password: 'password123', confirm_password: 'password123', role: 'buyer',
    ...overrides
  };
  Object.entries(fields).forEach(([k, v]) => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = v;
  });
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 20));
}

test('login: empty email shows AUTH_EMAIL_REQUIRED', async () => {
  await loadApp({ route: '/login' });
  await submitLoginForm({ email: '' });
  expect(getModalText()).toContain('AUTH_EMAIL_REQUIRED');
});

test('login: invalid email format shows AUTH_EMAIL_INVALID', async () => {
  await loadApp({ route: '/login' });
  await submitLoginForm({ email: 'not-an-email' });
  expect(getModalText()).toContain('AUTH_EMAIL_INVALID');
});

test('login: empty password shows AUTH_PASSWORD_REQUIRED', async () => {
  await loadApp({ route: '/login' });
  await submitLoginForm({ password: '' });
  expect(getModalText()).toContain('AUTH_PASSWORD_REQUIRED');
});

test('login: password shorter than 8 chars shows AUTH_PASSWORD_TOO_SHORT', async () => {
  await loadApp({ route: '/login' });
  await submitLoginForm({ password: 'short' });
  expect(getModalText()).toContain('AUTH_PASSWORD_TOO_SHORT');
});

test('register: password mismatch shows AUTH_PASSWORD_MISMATCH', async () => {
  await loadApp({ route: '/register' });
  await submitRegisterForm({ password: 'password123', confirm_password: 'different1' });
  expect(getModalText()).toContain('AUTH_PASSWORD_MISMATCH');
});

test('register: short password shows AUTH_PASSWORD_TOO_SHORT', async () => {
  await loadApp({ route: '/register' });
  await submitRegisterForm({ password: 'short', confirm_password: 'short' });
  expect(getModalText()).toContain('AUTH_PASSWORD_TOO_SHORT');
});

test('register: empty name shows AUTH_NAME_REQUIRED', async () => {
  await loadApp({ route: '/register' });
  await submitRegisterForm({ name: '' });
  expect(getModalText()).toContain('AUTH_NAME_REQUIRED');
});
