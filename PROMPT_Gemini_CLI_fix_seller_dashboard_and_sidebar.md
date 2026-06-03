# Gemini CLI Prompt: Fix Seller Dashboard Listings and Sidebar

Act as a Principal Software Engineer working in this repo:

`C:\Users\kitic\Documents\veggie_ville`

## Goal

Fix the seller dashboard at `http://localhost:3000/seller`.

User-visible bugs:

1. Seller dashboard shows `Unable to load seller dashboard: Product not found` and the My listings table says `Unable to load listings.`
2. Seller sidebar appears broken. Dashboard, My listings, Orders, and Settings should be clickable and should switch to the expected seller view.

Also fix any directly related route/data failures discovered while reproducing these two bugs.

## Current Live Reproduction

Use a fresh seller account if the seeded account fails:

```powershell
$body = @{
  name = 'Codex Browser Seller'
  email = 'codex-browser-seller@example.com'
  password = 'password123'
  role = 'seller'
} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method Post -Body $body -ContentType 'application/json'
```

Then log in through the browser and open:

`http://localhost:3000/seller`

Observed:

- Page URL becomes `/seller`.
- Error banner: `Unable to load seller dashboard: Product not found`.
- Seller table body: `Unable to load listings.`
- Live authenticated API call `GET /api/products/mine` returns `404 {"message":"Product not found"}`.
- Clicking sidebar `Orders` updates the active sidebar item but then shows `Unable to load received orders: Order not found`.
- Live authenticated API call `GET /api/orders/received` is being handled as `GET /api/orders/:id` with `id = received`.

## Key Root Causes To Verify

Do not assume the checked-in files and the running server are the same. Restart the Node server after code edits.

### Root Cause A: Product route ordering or missing route

The frontend calls:

`public/router.js`, inside `bindSellerDashboard()`:

```js
const mine = await request('/api/products/mine');
```

If Express registers `router.get('/:id', controller.getById)` before `router.get('/mine', ...)`, then `/mine` is treated as a product id. That produces `Product not found`.

Required behavior:

- `GET /api/products/mine` must be authenticated.
- It must require role `seller` or `admin`.
- It must use `req.user.id` as `seller_id`.
- It must return an array, including an empty array when the seller has no listings.
- It must never call `getById('mine')`.
- The static `/mine` route must be registered before `/:id`.

Relevant files:

- `routes/product.routes.js`
- `controllers/product.controller.js`
- `services/product.service.js`
- `public/router.js`
- `__tests__/frontend.test.js`

### Root Cause B: Missing seller received-orders route

The frontend calls:

`public/router.js`, inside the seller dashboard orders tab:

```js
const received = await request('/api/orders/received');
```

Current `routes/order.routes.js` only has:

```js
router.get('/', controller.getMyOrders);
router.get('/:id', controller.getOrderById);
```

That means `/api/orders/received` is swallowed by `/:id`, producing `Order not found`.

Required behavior:

- Add `GET /api/orders/received`.
- Register it before `GET /api/orders/:id`.
- Authenticate it.
- Require role `seller` or `admin`.
- Return orders containing products owned by `req.user.id`.
- Return `[]` when the seller has no received orders.
- Include fields the frontend expects:
  - `id`
  - `created_at`
  - `item_count`
  - `total_price`
  - `status`

Recommended SQL shape:

```sql
SELECT
  o.id,
  o.total_price,
  o.status,
  o.created_at,
  COUNT(oi.id) AS item_count
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE p.seller_id = ?
GROUP BY o.id, o.total_price, o.status, o.created_at
ORDER BY o.created_at DESC
```

For `admin`, either return all received-order rows or all seller-linked rows. Pick the behavior that best matches existing role conventions and test it.

Relevant files:

- `routes/order.routes.js`
- `controllers/order.controller.js`
- `services/order.service.js`
- `public/router.js`
- `__tests__/frontend.test.js`

### Root Cause C: Sidebar semantics and resilience

The seller sidebar items in `public/components.js` are plain `.check` divs:

- Dashboard
- My listings
- Orders
- Settings

`public/router.js` currently binds sidebar clicks inside `bindSellerDashboard()`. Keep or improve this, but make the behavior robust:

- Sidebar binding must happen even when listings fail.
- Do not attach duplicate event handlers across re-renders.
- Sidebar items should have clear click behavior:
  - Dashboard: show seller dashboard/listings view.
  - My listings: activate My listings tab and load `/api/products/mine`.
  - Orders: activate Orders received tab and load `/api/orders/received`.
  - Settings: show a clear placeholder or settings panel without throwing.
- Prefer real buttons or links with accessible semantics if changing markup is low risk. If keeping `.check`, add keyboard support and ARIA/current state.
- Do not break mobile tabs.

Relevant files:

- `public/components.js`
- `public/router.js`
- `public/veggie-ui.css`
- `public/vv-hifi.css`

### Root Cause D: Seed script uses SQLite while app uses MySQL

`config/db.js` uses MySQL.

`seed.js` currently writes to `database.sqlite`.

This causes documented credentials such as `seller@test.com / password123` to be unreliable for the running app.

Fix or document this mismatch. Prefer updating `seed.js` so it seeds the same MySQL database used by the app, or add a separate clearly named SQLite-only seed script and create a MySQL seed script for local development.

Acceptance expectation:

- Running the documented seed command should make `seller@test.com / password123` work against `npm start` on port 3000.

## Implementation Requirements

1. Inspect current code before editing.
2. Do not revert unrelated user changes.
3. Keep changes scoped to seller listings, seller received orders, sidebar behavior, and seed reliability.
4. Use server-side JWT identity. Never trust `seller_id` or `buyer_id` from client payloads.
5. Return arrays for list endpoints, not 404s, when a seller simply has no rows.
6. Restart the running server after backend route/controller/service changes.
7. Update or add Jest tests.

## Tests To Add Or Update

Backend route tests should verify:

- `GET /api/products/mine` as seller returns `200` and an array.
- `GET /api/products/mine` with no seller products returns `200 []`, not 404.
- `GET /api/products/mine` is not handled by `GET /api/products/:id`.
- `GET /api/orders/received` as seller returns `200` and an array.
- `GET /api/orders/received` with no received orders returns `200 []`, not 404.
- `GET /api/orders/received` is not handled by `GET /api/orders/:id`.
- Non-seller access to seller-only endpoints is rejected according to existing role middleware behavior.

Frontend tests should verify:

- Seller dashboard calls `/api/products/mine`.
- Seller dashboard renders product rows from `/api/products/mine`.
- Seller dashboard empty state renders without an error banner when `/api/products/mine` returns `[]`.
- Clicking seller sidebar `Orders` calls `/api/orders/received`.
- Clicking seller sidebar `My listings` returns to listings and calls `/api/products/mine`.
- Sidebar clicks still work if the first listings request fails.

Existing frontend test file:

`__tests__/frontend.test.js`

## Manual Verification Checklist

After implementing fixes:

1. Restart server:

```powershell
npm start
```

2. If needed, run the corrected seed command.
3. Log in as:

```text
seller@test.com
password123
```

4. Open:

`http://localhost:3000/seller`

Expected:

- No `Unable to load seller dashboard: Product not found` banner.
- My listings table shows seller listings or a friendly empty state.
- Browser Network for `/api/products/mine` is `200`.

5. Click seller sidebar:

- Dashboard: remains on seller dashboard/listings.
- My listings: shows listings.
- Orders: shows received orders or `No orders received yet.`
- Settings: shows settings placeholder/panel.

Expected:

- No `Order not found` when clicking Orders.
- Browser Network for `/api/orders/received` is `200`.

6. Run tests:

```powershell
npm test
```

## Deliverables

When done, provide:

- Files changed.
- Root causes confirmed.
- Tests added/updated.
- Manual verification result for `http://localhost:3000/seller`.
- Any remaining risks.
