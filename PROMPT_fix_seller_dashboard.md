# Claude Code Prompt — Fix Seller Dashboard (2 Bugs)

## Project Context

Veggie Ville — Node.js/Express backend + Vanilla JS SPA frontend.
- Backend routes: `routes/product.routes.js` → `controllers/product.controller.js` → `services/product.service.js`
- Frontend router: `public/router.js` (SPA, `bindSellerDashboard()` function handles page p9)
- Seller dashboard page: `/seller` (page id `p9`)

---

## Bug #1 — "Unable to load seller dashboard: Product not found"

### Symptom
When a seller navigates to `/seller`, the dashboard shows:
> **Unable to load seller dashboard: Product not found**
Their uploaded products do not appear in "My Listings".

### Root Cause

**The `/api/products/mine` route does not exist in the backend.**

The frontend `bindSellerDashboard()` in `public/router.js` line 682 calls:
```js
const mine = await request('/api/products/mine');
```

But `routes/product.routes.js` only registers:
```js
router.get('/',    controller.getAll);   // GET /api/products
router.get('/:id', controller.getById);  // GET /api/products/:id   ← catches "mine" as an id!
```

Express matches `GET /api/products/mine` against `GET /:id` with `req.params.id = "mine"`.
`getById` passes `"mine"` to the service which runs:
```sql
SELECT * FROM products WHERE id = 'mine'
```
Finds nothing → throws `new Error('Product not found')` → frontend catches it and shows the error banner.

### Fix — 3 files need changes

#### 1. `services/product.service.js`
Add a new `getMine` function that fetches all products belonging to the logged-in seller:

```js
/**
 * Get all products belonging to a specific seller
 * @param {number} seller_id - from JWT (req.user.id)
 * @returns {Promise<Array>}
 */
const getMine = async (seller_id) => {
  const [rows] = await pool.query(
    `SELECT id, name, description, price, quantity, size, category,
            best_before, image_url, created_at
     FROM products
     WHERE seller_id = ?
     ORDER BY created_at DESC`,
    [seller_id]
  );
  return rows;
};
```

Add `getMine` to the `module.exports` at the bottom of the file:
```js
module.exports = { getAll, getById, create, update, remove, getMine };
```

---

#### 2. `controllers/product.controller.js`
Add a new `getMine` controller that reads `seller_id` from the JWT and calls the service:

```js
/**
 * GET /api/products/mine
 * Returns all products created by the authenticated seller.
 * Requires: role = seller or admin
 */
const getMine = async (req, res) => {
  try {
    const seller_id = req.user.id;
    const products = await productService.getMine(seller_id);
    res.json(products);
  } catch (err) {
    console.error('[product.controller] getMine:', err);
    res.status(500).json({ message: 'Unable to load your listings. Please try again.' });
  }
};
```

Add `getMine` to the `module.exports` at the bottom:
```js
module.exports = { getAll, getById, create, update, remove, getMine };
```

---

#### 3. `routes/product.routes.js`
Register `GET /mine` route **BEFORE** `GET /:id`. Order is critical — Express matches routes top-to-bottom, so if `/:id` is listed first it will always swallow `/mine`.

```js
// BEFORE (broken order)
router.get('/',    controller.getAll);
router.get('/:id', controller.getById);   // ← swallows /mine

// AFTER (correct order)
router.get('/',    controller.getAll);

// /mine MUST be before /:id
router.get('/mine',
  authenticate,
  requireRole('seller', 'admin'),
  controller.getMine
);

router.get('/:id', controller.getById);   // ← now only catches real numeric IDs
```

---

## Bug #2 — Seller Sidebar (Dashboard / My Listings / Orders / Settings) not interactive

### Symptom
On the `/seller` desktop layout, the left sidebar has four items:
- Dashboard
- My Listings
- Orders
- Settings

Clicking any of them does nothing.

### Root Cause

The sidebar items in `public/components.js` page p9 are plain `<div>` elements:
```html
<aside class="side-panel">
  <h4>Seller</h4>
  <div class="check on"><span class="box"></span>Dashboard</div>
  <div class="check"><span class="box"></span>My listings</div>
  <div class="check"><span class="box"></span>Orders</div>
  <div class="check"><span class="box"></span>Settings</div>
</aside>
```

They have:
- No `data-route` attribute (so the global `[data-route]` click handler ignores them)
- No `.btn` or `.link` class (so the text-matching click handler ignores them)
- No explicit click listeners bound in `bindSellerDashboard()`

**Nothing in the codebase listens for clicks on `.check` divs inside the seller side panel.**

### Fix — `public/router.js` inside `bindSellerDashboard()`

Add a sidebar click handler at the **end** of `bindSellerDashboard()`, after the existing tab-binding code.

The sidebar maps to content that already exists on the page:
- **Dashboard** → reload the dashboard (re-run `bindSellerDashboard()`)
- **My Listings** → activate the "My listings" tab (index 0)
- **Orders** → activate the "Orders received" tab (index 1)
- **Settings** → show a placeholder notice (Settings page not yet built)

```js
// Add this at the END of bindSellerDashboard(), after the tab binding block

// ── Seller sidebar navigation ──────────────────────────────────────────────
const sellerSidePanel = document.querySelector('.page-desktop .side-panel');
if (sellerSidePanel && !sellerSidePanel.dataset.sidebarBound) {
  sellerSidePanel.dataset.sidebarBound = 'true';

  const sideItems = sellerSidePanel.querySelectorAll('.check');

  function setActiveSideItem(activeItem) {
    sideItems.forEach(item => item.classList.remove('on'));
    activeItem.classList.add('on');
  }

  function triggerTab(tabIndex) {
    // Click the correct tab to switch content (reuses existing tab logic)
    const tabs = document.querySelectorAll('.page-desktop .tabs .t');
    if (tabs[tabIndex]) tabs[tabIndex].click();
  }

  sideItems.forEach((item, index) => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', async () => {
      setActiveSideItem(item);
      const label = item.textContent.trim().toLowerCase();

      if (label === 'dashboard') {
        // Reload the full seller dashboard
        await bindSellerDashboard();
      } else if (label === 'my listings') {
        triggerTab(0);
      } else if (label === 'orders') {
        triggerTab(1);
      } else if (label === 'settings') {
        // Settings page not yet implemented — show a friendly placeholder
        const mainArea = document.querySelector('.page-desktop [style*="flex:1;padding:24px"]');
        if (mainArea) {
          mainArea.innerHTML = `
            <div class="surface stack-12" style="max-width:480px;margin:40px auto;text-align:center">
              <div style="font-size:48px">⚙️</div>
              <div class="h2">Settings</div>
              <div class="small" style="color:var(--ink-2)">
                Account settings are coming soon.<br>
                For now, please contact support to update your profile.
              </div>
            </div>`;
        }
      }
    });
  });
}
```

---

## Summary of All Changes

| File | Change | Bug |
|---|---|---|
| `services/product.service.js` | Add `getMine(seller_id)` function + export it | #1 |
| `controllers/product.controller.js` | Add `getMine` controller + export it | #1 |
| `routes/product.routes.js` | Register `GET /mine` route **before** `GET /:id` with `authenticate` + `requireRole` | #1 |
| `public/router.js` | Add sidebar click handler at end of `bindSellerDashboard()` | #2 |

**No changes needed to:**
- `public/components.js` — the sidebar HTML structure is fine, just needs JS handlers
- Any other backend files

---

## Verification Steps

### Bug #1 — My Listings loads correctly
1. Log in as seller: `seller@test.com` / `password123`
2. Navigate to `/seller`
3. ✅ "My Listings" tab shows the seller's uploaded products (no error banner)
4. In browser DevTools → Network tab, confirm `GET /api/products/mine` returns **200** with an array of products
5. Confirm `GET /api/products/123` (a real numeric ID) still works for the product detail page

### Bug #2 — Sidebar is interactive
1. On `/seller` desktop layout, click **My Listings** in the sidebar
   - ✅ Sidebar item highlights (`.on` class applied)
   - ✅ Product grid is shown
2. Click **Orders** in the sidebar
   - ✅ Sidebar item highlights
   - ✅ "Orders received" tab content is shown
3. Click **Dashboard** in the sidebar
   - ✅ Dashboard reloads with stats cards at top
4. Click **Settings** in the sidebar
   - ✅ "Coming soon" placeholder appears
5. Confirm sidebar clicks on mobile do **not** break anything (mobile uses `.tabs`, not `.side-panel`)

---

## Important Notes for Claude Code

- The `GET /mine` route **must** be placed before `GET /:id` in `product.routes.js`. If you put it after, Express will never reach it.
- In `bindSellerDashboard()`, the sidebar guard `sellerSidePanel.dataset.sidebarBound = 'true'` prevents duplicate listeners from being attached on re-renders. Do not remove it.
- The `triggerTab(index)` approach reuses the existing tab click logic rather than duplicating it, so any future changes to tab behaviour will automatically apply to sidebar clicks too.
