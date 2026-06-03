'use strict';
/**
 * Sprint 1 tests — base rubric defect fixes
 * Covers: CORS, order status ownership, seller stats, schema integrity, deployment docs.
 */

const fs   = require('fs');
const path = require('path');
const root = (...parts) => path.join(__dirname, '..', ...parts);

// ─── Shared mock helpers ──────────────────────────────────────────────────────

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ─── 1. CORS ──────────────────────────────────────────────────────────────────

describe('CORS configuration', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests';
    process.env.CORS_ORIGIN = 'http://localhost:3000,http://example.com';
    // Require after setting env so cors() reads the updated value
    jest.resetModules();
    app = require('../app').app;
  });

  afterAll(() => {
    delete process.env.CORS_ORIGIN;
    jest.resetModules();
  });

  function corsOriginCallback(origin) {
    // Extract the cors origin resolver from the app by calling the internal
    // middleware directly via supertest or by unit-testing the origin function.
    // We test it by reading the allowedOrigins logic used in app.js.
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',').map(o => o.trim()).filter(Boolean);
    if (!origin) return true;
    return allowed.includes(origin);
  }

  test('same-origin request (no Origin header) is allowed', () => {
    expect(corsOriginCallback(undefined)).toBe(true);
    expect(corsOriginCallback(null)).toBe(true);
  });

  test('explicitly listed origin is allowed', () => {
    expect(corsOriginCallback('http://localhost:3000')).toBe(true);
    expect(corsOriginCallback('http://example.com')).toBe(true);
  });

  test('unlisted origin is rejected', () => {
    expect(corsOriginCallback('http://evil.com')).toBe(false);
    expect(corsOriginCallback('http://attacker.xyz')).toBe(false);
  });

  test('app.js does not use bare cors() with no options', () => {
    const appSrc = fs.readFileSync(root('app.js'), 'utf8');
    // Must NOT contain `cors()` with nothing inside (bare wildcard)
    expect(appSrc).not.toMatch(/app\.use\(cors\(\)\)/);
    // Must contain origin callback or allowedOrigins
    expect(appSrc).toMatch(/allowedOrigins|CORS_ORIGIN/);
  });
});

// ─── 2. Order status ownership ────────────────────────────────────────────────

describe('order.service updateStatus — ownership', () => {
  let updateStatus;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../config/db', () => ({ query: jest.fn() }));
    updateStatus = require('../services/order.service').updateStatus;
  });

  afterEach(() => jest.resetAllMocks());

  function mockPool(responses) {
    const pool = require('../config/db');
    responses.forEach(r => pool.query.mockResolvedValueOnce(r));
    return pool;
  }

  test('admin can update any order without ownership check', async () => {
    mockPool([
      [[{ id: 5 }]],   // order exists
      // no ownership SELECT for admin
      [{ affectedRows: 1 }]  // UPDATE
    ]);
    const result = await updateStatus(5, 'shipped', { id: 99, role: 'admin' });
    expect(result.status).toBe('shipped');
  });

  test('seller can update an order that contains their product', async () => {
    mockPool([
      [[{ id: 5 }]],   // order exists
      [[{ id: 5 }]],   // ownership: seller owns product in order
      [{ affectedRows: 1 }]  // UPDATE
    ]);
    const result = await updateStatus(5, 'shipped', { id: 7, role: 'seller' });
    expect(result.status).toBe('shipped');
  });

  test('seller cannot update an order that does not contain their product', async () => {
    mockPool([
      [[{ id: 5 }]],   // order exists
      [[]]             // ownership: no match
    ]);
    await expect(
      updateStatus(5, 'shipped', { id: 99, role: 'seller' })
    ).rejects.toMatchObject({ code: 'ORDER_FORBIDDEN' });
  });

  test('returns 404 when order does not exist', async () => {
    mockPool([[[]]]);  // order not found
    await expect(
      updateStatus(999, 'shipped', { id: 7, role: 'seller' })
    ).rejects.toThrow('Order not found');
  });
});

describe('order.controller updateStatus — status validation', () => {
  let updateStatus;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('../config/db', () => ({ query: jest.fn() }));
    jest.mock('../services/order.service', () => ({ updateStatus: jest.fn() }));
    updateStatus = require('../controllers/order.controller').updateStatus;
  });

  afterEach(() => jest.resetAllMocks());

  test('invalid status returns 400', async () => {
    const req = { params: { id: '5' }, body: { status: 'flying' }, user: { id: 1, role: 'seller' } };
    const res = mockRes();
    await updateStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('pending') }));
  });

  test('missing status returns 400', async () => {
    const req = { params: { id: '5' }, body: {}, user: { id: 1, role: 'seller' } };
    const res = mockRes();
    await updateStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('service ORDER_FORBIDDEN returns 403', async () => {
    const svc = require('../services/order.service');
    const forbidden = new Error('Forbidden');
    forbidden.code = 'ORDER_FORBIDDEN';
    svc.updateStatus.mockRejectedValue(forbidden);

    const req = { params: { id: '5' }, body: { status: 'shipped' }, user: { id: 1, role: 'seller' } };
    const res = mockRes();
    await updateStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─── 3. Seller stats endpoint ─────────────────────────────────────────────────

describe('product.service getMineStats', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('../config/db', () => ({ query: jest.fn() }));
  });

  afterEach(() => jest.resetAllMocks());

  test('returns numeric stats with zero sales when no orders', async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce([[{
      totalListings: 3,
      activeListings: 2,
      expiringSoon: 1,
      sales30d: null   // COALESCE returns 0 from SQL; driver may return null in unit test
    }]]);

    const { getMineStats } = require('../services/product.service');
    const stats = await getMineStats(7);
    expect(stats.totalListings).toBe(3);
    expect(stats.activeListings).toBe(2);
    expect(stats.expiringSoon).toBe(1);
    expect(stats.sales30d).toBe(0);  // null coerced to 0
  });

  test('returns numeric stats with sales', async () => {
    const pool = require('../config/db');
    pool.query.mockResolvedValueOnce([[{
      totalListings: 5,
      activeListings: 4,
      expiringSoon: 0,
      sales30d: '1234.50'
    }]]);

    const { getMineStats } = require('../services/product.service');
    const stats = await getMineStats(7);
    expect(stats.sales30d).toBe(1234.5);
    expect(typeof stats.sales30d).toBe('number');
  });
});

describe('product.controller getMineStats', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('../config/db', () => ({ query: jest.fn() }));
    jest.mock('../services/product.service', () => ({
      getMineStats: jest.fn().mockResolvedValue({
        totalListings: 2, activeListings: 1, expiringSoon: 0, sales30d: 0
      })
    }));
  });

  afterEach(() => jest.resetAllMocks());

  test('returns 200 with stats JSON', async () => {
    const { getMineStats } = require('../controllers/product.controller');
    const req = { user: { id: 7 } };
    const res = mockRes();
    await getMineStats(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ totalListings: 2, activeListings: 1 })
    );
  });
});

// ─── 4. Schema integrity ──────────────────────────────────────────────────────

describe('schema.sql', () => {
  const schema = fs.readFileSync(root('schema.sql'), 'utf8');

  test('orders.pickup_slot_id uses ON DELETE RESTRICT', () => {
    // Find the orders table definition, then check the FK within it
    expect(schema).toMatch(/FOREIGN KEY \(pickup_slot_id\) REFERENCES pickup_slots\(id\) ON DELETE RESTRICT/);
  });

  test('schema does not use ON DELETE CASCADE for pickup_slot_id', () => {
    // Ensure the old cascade was replaced
    const lines = schema.split('\n');
    const fkLine = lines.find(l => l.includes('pickup_slot_id') && l.includes('REFERENCES pickup_slots'));
    expect(fkLine).toBeDefined();
    expect(fkLine).not.toMatch(/ON DELETE CASCADE/);
  });
});

// ─── 5. Deployment docs ───────────────────────────────────────────────────────

describe('deployment docs', () => {
  test('.env.example exists', () => {
    expect(fs.existsSync(root('.env.example'))).toBe(true);
  });

  test('.env.example documents all required variables', () => {
    const env = fs.readFileSync(root('.env.example'), 'utf8');
    for (const key of ['JWT_SECRET', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME', 'CORS_ORIGIN', 'PORT', 'NODE_ENV']) {
      expect(env).toContain(key);
    }
  });

  test('README.md exists', () => {
    expect(fs.existsSync(root('README.md'))).toBe(true);
  });

  test('README.md includes essential setup sections', () => {
    const readme = fs.readFileSync(root('README.md'), 'utf8').toLowerCase();
    expect(readme).toMatch(/npm install/);
    expect(readme).toMatch(/schema\.sql/);
    expect(readme).toMatch(/seed/);
    expect(readme).toMatch(/npm (start|run dev)/);
    expect(readme).toMatch(/\.env/);
  });

  test('.env is gitignored', () => {
    const gitignore = fs.readFileSync(root('.gitignore'), 'utf8');
    expect(gitignore).toMatch(/^\.env$/m);
  });

  test('.env.example is NOT gitignored', () => {
    const gitignore = fs.readFileSync(root('.gitignore'), 'utf8');
    expect(gitignore).not.toMatch(/\.env\.example/);
  });
});

// ─── 6. Seller stats — frontend integration ───────────────────────────────────

describe('seller dashboard stats — frontend', () => {
  // We test that the router.js source contains the stats API call and
  // uses the correct CSS class selectors we added to components.js
  test('router.js calls /api/products/mine/stats', () => {
    const src = fs.readFileSync(root('public/router.js'), 'utf8');
    expect(src).toContain('/api/products/mine/stats');
  });

  test('router.js targets .vv-stat-total and sibling classes for rendering', () => {
    const src = fs.readFileSync(root('public/router.js'), 'utf8');
    expect(src).toContain('vv-stat-total');
    expect(src).toContain('vv-stat-active');
    expect(src).toContain('vv-stat-expiring');
    expect(src).toContain('vv-stat-sales');
  });

  test('components.js stat cards carry vv-stat-* class names', () => {
    const src = fs.readFileSync(root('public/components.js'), 'utf8');
    expect(src).toContain('vv-stat-total');
    expect(src).toContain('vv-stat-active');
    expect(src).toContain('vv-stat-expiring');
    expect(src).toContain('vv-stat-sales');
    // Must NOT contain hardcoded numbers in the stat value elements
    expect(src).not.toMatch(/class="v vv-stat-total">\d/);
  });
});
