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
      return role ? json({ id: 7, name: 'Test User', role }) : json({ message: 'Unauthorized' }, false, 401);
    }
    if (url === '/api/products/mine/stats') {
      return json({ totalListings: 12, activeListings: 8, expiringSoon: 2, sales30d: 8400.50 });
    }
    if (url === '/api/products/mine') {
      return json([{ id: 3, name: 'Seller item', price: 20, size: 'M', quantity: 5, best_before: '2026-06-01' }]);
    }
    if (url === '/api/orders/received') {
      return json([{ id: 101, created_at: '2026-05-21T00:00:00Z', item_count: 2, total_price: 150, status: 'confirmed' }]);
    }
    if (url.startsWith('/api/products')) {
      return json({ items: [], total: 0 });
    }
    return json({});
  });
  window.fetch = fetchImpl || defaultFetch;

  eval(read('public/components.js'));
  eval(read('public/modal.js'));
  eval(read('public/error-banner.js'));
  eval(read('public/veggie-ui.js'));
  eval(read('public/router.js'));
  await new Promise(resolve => setTimeout(resolve, 100));
  return window.fetch;
}

test('seller dashboard renders real stats from API', async () => {
  await loadApp({ route: '/seller', role: 'seller' });
  expect(document.querySelector('.vv-stat-total').textContent).toBe('12');
  expect(document.querySelector('.vv-stat-sales').textContent).toContain('8,400.5');
});

test('seller sidebar switches between listings and orders', async () => {
  const fetchMock = await loadApp({ route: '/seller', role: 'seller' });
  
  // Directly click the Orders RECEIVED tab to test tab logic first
  const ordersTab = [...document.querySelectorAll('.page-desktop .tabs .t')].find(el => /orders received/i.test(el.textContent));
  expect(ordersTab).toBeDefined();
  
  ordersTab.click();
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const activeTab = document.querySelector('.page-desktop .tabs .t.active');
  expect(activeTab.textContent.toLowerCase()).toContain('orders received');
  expect(fetchMock).toHaveBeenCalledWith('/api/orders/received', expect.any(Object));
  expect(document.body.textContent).toContain('ORD-101');
});

test('catalog filters are debounced on input', async () => {
  const fetchMock = await loadApp({ route: '/browse' });
  
  const minPrice = document.querySelector('input[name="minPrice"]');
  expect(minPrice).not.toBeNull();
  expect(minPrice.type).toBe('range');
  
  // Reset mock to ignore initial load calls
  fetchMock.mockClear();
  
  minPrice.value = '50';
  minPrice.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Should not have called fetch yet
  let filterCalls = fetchMock.mock.calls.filter(c => c[0].includes('min=50'));
  expect(filterCalls.length).toBe(0);
  
  // Wait for debounce (400ms)
  await new Promise(resolve => setTimeout(resolve, 800));
  
  filterCalls = fetchMock.mock.calls.filter(c => c[0].includes('min=50'));
  expect(filterCalls.length).toBeGreaterThan(0);
});
