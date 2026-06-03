# University Professor Architecture Audit: Veggie Ville

Audit date: 2026-06-04
Repository: C:\Users\kitic\Documents\veggie_ville (https://github.com/tmno-O/Veggie_Ville)
Evaluator: Claude Sonnet 4.6 — automated academic review

---

## Executive Summary

Veggie Ville is a full-stack community-garden marketplace built on Node.js + Express + MySQL2 with a vanilla-JS SPA frontend. The codebase demonstrates a competent understanding of MVC architecture, relational data modelling, JWT authentication, and frontend state management. The strongest areas are SQL safety (fully parameterised queries with hardcoded allowlists), service-layer separation, and the security of the authentication trust boundary. The checkout service in particular shows genuine engineering maturity: it uses a multi-step MySQL transaction with an inline stock-and-expiry gate, deducts inventory atomically, and rolls back cleanly on any failure — this is non-trivial work that earns the Bonus A partial credit.

Deductions arise from three recurring themes: (1) missing first-run documentation (no `.env.example`, no README), which means a new collaborator cannot configure the project without reading source code; (2) a CORS wildcard that would expose every endpoint to any origin in a production deployment; and (3) one broken trust boundary where any authenticated seller may update the status of any order, not only orders containing their own products. The three bonus challenges (Discount Engine, Recommendations) are entirely unimplemented, keeping the total score well below the maximum.

Base score: **22/30**
Bonus score: **2/11**
Final score: **24/41**

---

## Base Rubric Score Table

| # | Category | Best Practice Point | Score | Evidence Summary |
|---|----------|---------------------|-------|------------------|
| 1 | Version Control | Conventional Commits and Git Flow | 2 | Majority of recent commits use `fix:`/`feat:`/`chore:` prefix; several early commits are freeform; staged `.md` files are untracked; no `.env.example`. |
| 2 | Data Flow | Separation of Content and UI | 2 | Backend returns JSON only; services/controllers cleanly separated; but seller-dashboard stat cards (Total listings: 12, Active: 9, etc.) remain hardcoded HTML and are never updated from API data. |
| 3 | Interaction | Event Delegation and Debouncing | 2 | Debounced search (400 ms) present; `dataset.bound` guards prevent duplicate listeners; global click handler correctly skips submit buttons. Global text-regex routing is architecturally fragile. |
| 4 | State | Single Source of Truth and Continuity | 2 | Cookie-only auth with `_cachedUser` cache; URL drives routing; but cart badge count is mirrored to `localStorage`, creating a secondary state source. |
| 5 | Security Auth | Architecture of Trust | 3 | bcrypt cost-12 hashing; httpOnly + SameSite cookies; admin role blocked from public registration; `AUTH_TOKEN_EXPIRED` vs `AUTH_TOKEN_INVALID` distinction; `me()` re-validates `is_active` on every call; rate limiting on auth routes. |
| 6 | Security API | Gatekeeper Pattern | 2 | `authenticate` + `requireRole` middleware applied consistently; `/mine` correctly registered before `/:id`; `/received` before `/:id` in orders; however CORS is a wildcard (`cors()`) and `PATCH /:id/status` does not verify seller owns products in the target order. |
| 7 | Persistence | Relational Integrity SQL | 2 | All 6 tables have PKs and FKs with `ON DELETE CASCADE`; `order_items.unit_price` correctly snapshots price at order time; ACID transaction in checkout. Weakness: `orders.pickup_slot_id FK ON DELETE CASCADE` allows a slot deletion to silently destroy order history (should be `RESTRICT`). |
| 8 | SQL Safety | Parameterized Queries | 3 | Every query uses `?` placeholders. Dynamic `UPDATE` in `product.service.js:75-82` uses a hardcoded allowlist for column names. SQL errors are logged server-side and never leaked in API responses. No injectable path found. |
| 9 | Structure | Controller, Route, Service SoC | 3 | Routes define paths and middleware only. Controllers own HTTP validation, status codes, and response shape. Services own business logic and DB access. Pattern is consistent across all 6 modules (auth, product, cart, order, pickupSlot, admin). |
| 10 | Deployment | Zero-Config and `.env` Audit | 1 | `.gitignore` correctly excludes `.env`; `JWT_SECRET` guard causes immediate `process.exit(1)` if unset; `start`/`dev`/`test` scripts present. Critical gap: **`.env.example` does not exist** — a new developer has no documented list of required variables without reading source. No README. |

---

## Bonus Challenge Score Table

| Challenge | Name | Max Points | Awarded | Evidence Summary |
|-----------|------|------------|---------|------------------|
| A | Stock-Check Store | 3 | 2 | `order.service.js:34-49` performs `quantity >= ?` gate inside the same `beginTransaction()` block, then deducts stock at line 78-83 before `commit()`. Full rollback on failure. Not tested — no test covers insufficient-stock or concurrent-checkout scenarios. |
| B | Dynamic Discount Engine | 3 | 0 | No `DiscountService`, no discount logic anywhere in backend or frontend. |
| C | Personalized Recommendations | 5 | 0 | No recommendation query, endpoint, or service of any kind. |

---

## Detailed Category Feedback

### 1. Version Control: Conventional Commits and Git Flow

**Score: 2/3**

**Expected pattern:**
Every commit carries a conventional prefix (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`). Commits are atomic and focused. Branches are used for features. No secrets, build artifacts, or prompt files are committed. The working tree is clean.

**Evidence:**
- `git log --oneline -n 20` shows recent commits using prefixes correctly: `fix: add /api/products/mine route`, `fix(nav): Start Selling button`, `fix(auth): resolve critical login/register bugs`, `feat: implement order status system`.
- Early commits break convention: `"Fix auth flow and storefront UI issues"`, `"Clean up Veggie Ville frontend"`, `"Front-end Changes"` (no prefix, vague scope).
- `git status --short` shows five files staged (`A`) but not committed: `PROMPT_*.md`, `push_to_github.bat`, `veggie_ville_design_prompt.md`. These are planning artefacts that should either be committed to a `docs/` folder or listed in `.gitignore`.
- `PROMPT_CLI_university_professor_architecture_audit.md` is untracked (??), suggesting the working tree is not clean.
- No `.env.example` committed anywhere in the repository.
- Three remote branches (`Front-End`, `Front-End-SQLite-Version`, `feature/spa-routing`) indicate reasonable feature branching, though stale branches were not pruned.

**Strengths:**
- Majority of recent commits follow convention and have meaningful messages.
- `.env` is correctly excluded in `.gitignore:2`.
- No compiled/transpiled artifacts committed.

**Weaknesses:**
- Inconsistent adoption of conventional commits across the history.
- Prompt/planning `.md` files and a `.bat` deployment script are staged but uncommitted — suggests commits are not being made deliberately.
- No `.env.example` means anyone cloning the repo cannot start the app without reading source code.

**Required improvement to reach Mastery:**
- Adopt conventional commits for 100% of history going forward.
- Commit or `.gitignore` the staged `.md` files.
- Add `.env.example` with all required keys documented.

---

### 2. Data Flow: Separation of Content and UI

**Score: 2/3**

**Expected pattern:**
All data comes from API calls. Templates are parameterised with escaped data. No page uses hardcoded numbers that substitute for real API data. Fetching, processing, and rendering are in distinct functions.

**Evidence:**
- `controllers/*` return JSON only; no HTML fragments in any response.
- `public/router.js:66-74` — the `request()` helper centralises all API calls with error handling; all page-bind functions use it consistently.
- `public/router.js:5-7` — `esc()` is defined once and applied to every user-supplied value before insertion into HTML.
- `public/components.js:920-924` — the seller dashboard desktop template contains hardcoded stat cards:
  ```html
  <div class="stat"><div class="k">Total listings</div><div class="v">12</div>...
  <div class="stat"><div class="k">Active</div><div class="v">9</div></div>
  <div class="stat"><div class="k">Expiring &lt;7d</div><div class="v" style="color:var(--error)">3</div>...
  <div class="stat"><div class="k">Sales (30d)</div><div class="v">฿8,420</div></div>
  ```
  `bindSellerDashboard()` in `router.js:678` loads the product list and order tabs but **never overwrites these four stat cards**. A real seller sees fabricated numbers.
- `services/product.service.js:8-20` — `getAll()` builds the SQL filter chain cleanly without any HTML concerns.
- `controllers/product.controller.js:1-14` — controller maps the service result directly to `res.json()`, no transformation or presentation.

**Strengths:**
- Back-end is 100% JSON. No server-side HTML rendering.
- API helpers are centralised. No raw `fetch()` scattered in event handlers.
- `esc()` applied consistently — tested and confirmed by `frontend.test.js:96-97`.

**Weaknesses:**
- Four seller dashboard stat cards (`Total listings`, `Active`, `Expiring <7d`, `Sales`) are hardcoded mock values that are never replaced with live data. This is the definition of "hardcoded mock content substituting for live data in a production flow."

**Required improvement to reach Mastery:**
- Expose a `/api/products/mine/stats` endpoint or extend `/api/products/mine` to return aggregate counts.
- Have `bindSellerDashboard()` query and render the stats into the `.stat .v` elements.

---

### 3. Interaction: Event Delegation and Debouncing

**Score: 2/3**

**Expected pattern:**
Dynamic elements use delegation or `dataset.bound` guards to avoid duplicate listeners. API-triggering inputs are debounced. Form submit buttons are not accidentally intercepted by navigation handlers. SPA navigations do not leave stale listeners.

**Evidence:**
- `public/router.js:302-307` — keyword search uses a 400 ms `setTimeout` debounce:
  ```js
  let timer;
  form.querySelector('input').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      bindProducts('p2', { ..._catalogFilters, keyword: e.target.value }, 1);
    }, 400);
  });
  ```
- `router.js:509-510, 533-534, 559-560, 851, 911` — `dataset.bound`/`dataset.sidebarBound`/`dataset.tabBound` guards prevent duplicate listeners on re-renders.
- `router.js:152-153` — global click handler explicitly skips submit buttons inside forms:
  ```js
  if ((link.type === 'submit' || link.getAttribute('type') === 'submit') && link.closest('form')) return;
  ```
- `router.js:785` — a second `document.addEventListener('click')` handles cart/delete/add-to-cart actions via delegation against dynamic product cards.

**Weakness:**
- `router.js:155-180` — the global click handler falls back to matching button text with regex patterns (e.g. `/login/`, `/cart|checkout/`). This is fragile: a button with text "Please log in to continue" would match the `/login/` pattern and silently navigate away. This is a well-known anti-pattern. The explicit `data-route` attribute (line 142-147) is the correct pattern; the text-regex fallback creates unpredictable side effects for any future button whose label coincidentally matches a pattern.
- Price-range slider uses `addEventListener('input', ...)` without debouncing (`router.js:395-405`), triggering API calls on every pixel of slider movement.

**Required improvement to reach Mastery:**
- Replace the text-regex navigation fallback entirely with `data-route` attributes on all interactive elements.
- Debounce the price-range slider input handler.

---

### 4. State: Single Source of Truth and Continuity

**Score: 2/3**

**Expected pattern:**
Auth state is derived from one place (server-verified cookie). Cart state is server-authoritative. SPA location is derived from the URL. Caches are busted on login/logout. UI refreshes after mutations.

**Evidence:**
- `public/veggie-ui.js:59-74` — `_cachedUser` is a module-level variable. `fetchMe()` returns the cache on subsequent calls and clears it on 401/403. This is a sound pattern.
- `veggie-ui.js:54-57` — `setAuthToken()` now only clears the legacy `localStorage` key on logout. No token is written to `localStorage` on login.
- `veggie-ui.js:19` — `cartCount` is initialised from `localStorage.getItem('vv_cart')` and then mirrored back with `lsSet('vv_cart', cartCount)` on every badge render. This means the badge counter has **two sources of truth**: the server cart and `localStorage`. If the user clears their cart from another device, the badge counter will show the stale value until a full page reload fetches a fresh cart.
- `router.js:90-104` — `canRender()` calls `getMe()` on every navigation, ensuring role changes take effect without a manual refresh.
- After a product delete, `router.js:769` calls `navigate('/seller')` which re-runs `bindSellerDashboard()` — correct re-fetch.

**Weaknesses:**
- The `localStorage`/server dual-source for cart badge count is a state consistency gap.
- `_cachedUser` is not busted on login (only on logout and 401). After a `register → auto-login` flow, the cached user is the just-registered user, but if the page calls `fetchMe()` again between navigation events, it returns the old cache. This is generally harmless but technically inconsistent.

**Required improvement to reach Mastery:**
- Derive the cart badge count solely from the server response (already returned by `/api/cart`). Remove the `localStorage` mirror for cart count.
- Call `_cachedUser = null` at the start of `VVAuth.login()` to ensure a fresh fetch after each login.

---

### 5. Security Auth: Architecture of Trust

**Score: 3/3**

**Expected pattern:**
Passwords hashed with a strong algorithm. Tokens issued by the server only. Tokens stored in httpOnly cookies. User identity derived from JWT claims, never from client-supplied body fields. Admin accounts cannot be self-created. Logout clears auth state on both sides.

**Evidence:**
- `services/auth.service.js:17` — `bcrypt.hash(password, 12)` — cost factor 12 is strong (OWASP recommends minimum 10).
- `controllers/auth.controller.js:4-8` — `cookieOptions` sets `httpOnly: true`, `sameSite: 'lax'`, and `secure: process.env.NODE_ENV === 'production'`.
- `controllers/auth.controller.js:48-50` — role is validated against `['buyer', 'seller']` before registration; `admin` cannot be registered through the public endpoint.
- `middlewares/auth.js:30` — `jwt.verify(raw, process.env.JWT_SECRET)` — all identity is derived from the verified JWT, never from `req.body`.
- `middlewares/auth.js:33-37` — `TokenExpiredError` produces `AUTH_TOKEN_EXPIRED`; all other JWT failures produce `AUTH_TOKEN_INVALID`. This allows the client to distinguish session expiry from tampering.
- `controllers/auth.controller.js:105-112` — `logout` calls `res.clearCookie('vv_token')` with matching options; `veggie-ui.js` also sets `_cachedUser = null`.
- `controllers/auth.controller.js:118-133` — `me()` re-queries the database and checks `is_active = TRUE`, preventing a banned user from continuing a session with a valid JWT.
- `routes/auth.routes.js` — rate limiter (20 req / 15 min) applied to both `/register` and `/login`.
- `app.js:3-6` — server refuses to start if `JWT_SECRET` is not set.

**Strengths:**
All major auth trust boundaries are correct and consistent. No token or password appears in any response body or `localStorage`. This category is fully implemented at mastery level.

**Minor note (not a deduction):**
`seed.js:48` uses `bcrypt.hash(account.password, 10)` (cost 10) while the production service uses cost 12. This inconsistency has no security impact but is worth noting for uniformity.

---

### 6. Security API: Gatekeeper Pattern

**Score: 2/3**

**Expected pattern:**
Every protected route has authentication middleware. Role-restricted routes have role middleware. Client-supplied privileged fields are ignored. Static routes are registered before dynamic `/:id` routes. Controllers validate inputs before calling services.

**Evidence:**
- `middlewares/role.js:6-11` — clean variadic RBAC: `requireRole('seller', 'admin')`.
- `routes/product.routes.js:11-15` — `GET /mine` registered before `GET /:id` (fixed in this session).
- `routes/order.routes.js:17-22` — `GET /received` registered before `GET /:id`.
- `controllers/product.controller.js:41` — `seller_id = req.user.id` — seller identity taken from JWT, not request body.
- `services/product.service.js:66-71` — `update()` checks `WHERE id = ? AND seller_id = ?` before applying changes.
- `controllers/auth.controller.js:43-50` — input validation happens in the controller before the service is called.

**Defects:**
- `app.js:13` — `app.use(cors())` with no `origin` option accepts requests from **any domain**. In production this exposes the entire API to cross-origin JavaScript from arbitrary websites.
- `routes/order.routes.js:37-41` + `services/order.service.js:247-255` — `PATCH /:id/status` requires role `seller` or `admin` but does not verify that the seller owns any product in that order. Any seller can change the status of any order:
  ```js
  const updateStatus = async (order_id, status) => {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',  // no seller_id check
      [status, order_id]
    );
  ```

**Required improvement to reach Mastery:**
- Add `origin` option to CORS: `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' })`.
- Add a seller ownership check in `updateStatus()`: verify that at least one `order_items` row for this order has a `products.seller_id` matching the caller's JWT id before allowing the update.

---

### 7. Persistence: Relational Integrity SQL

**Score: 2/3**

**Expected pattern:**
Tables have primary and foreign keys. Delete behaviour is intentional. Multi-step writes use transactions. Schema reflects domain relationships accurately.

**Evidence:**
- `schema.sql:26` — `FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE` — products deleted when seller is deleted. Intentional.
- `schema.sql:45-46` — cart items cascade when user or product is deleted. Intentional.
- `schema.sql:60-64` — order_items cascade when order is deleted. Intentional.
- `schema.sql:65` — `unit_price DECIMAL(10,2)` stored on `order_items` — price is correctly snapshotted at checkout time, decoupled from future product price changes. This is a design strength.
- `services/order.service.js:15-107` — `beginTransaction()` / `commit()` / `rollback()` / `release()` pattern is correct and complete. All 6 steps (slot check, stock check, order insert, items insert, stock deduct, cart clear) run inside one atomic unit.
- `services/cart.service.js:161` — `clearCart(user_id, conn = pool)` accepts the transaction connection as an optional argument, correctly participating in the outer transaction.

**Defect:**
- `schema.sql:57` — `FOREIGN KEY (pickup_slot_id) REFERENCES pickup_slots(id) ON DELETE CASCADE`. This means deleting a pickup slot **silently deletes all orders** placed against that slot. Order history is permanent business data; the correct behaviour is `ON DELETE RESTRICT` to prevent slot deletion when orders exist. `services/pickupSlot.service.js` does implement a guard that queries for orders before allowing deletion, but this guard is bypassed if someone deletes directly from the database or if that service function is not used consistently.

**Required improvement to reach Mastery:**
- Change `orders.pickup_slot_id` FK to `ON DELETE RESTRICT`.
- Consider adding a unique constraint on `cart_items(user_id, product_id)` at the schema level (currently enforced only in application code).

---

### 8. SQL Safety: Parameterized Queries

**Score: 3/3**

**Expected pattern:**
All user-supplied values use `?` placeholders. Dynamic column names use hardcoded allowlists. SQL errors are logged internally and never returned to the client.

**Evidence:**
- Every `pool.query()` call in `services/` uses parameterised form. Spot-checked:
  - `cart.service.js:43-47` — stock/expiry gate: `WHERE id = ? AND best_before >= CURDATE() AND quantity >= ?`
  - `order.service.js:34-41` — inline transaction check: `WHERE id = ? AND best_before >= CURDATE() AND quantity >= ?`
  - `order.service.js:54-58` — order insert with user data: `VALUES (?, ?, ?, 'confirmed')`
  - `admin.service.js` — filters assembled with `conditions.push('o.status = ?')` pattern.
- `services/product.service.js:75-82` — the `UPDATE` allowlist:
  ```js
  const allowed = ['name', 'description', 'price', 'quantity', 'size', 'category', 'best_before'];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);   // column from hardcoded list — safe
      params.push(fields[key]);      // value as placeholder — safe
    }
  }
  ```
  Column names come from a hardcoded array, never from `req.body` keys.
- Error handling: every `catch` block does `console.error(...)` and returns a generic `{ message: 'Internal server error' }` to the client. No stack traces or SQL error messages are exposed.

**Strengths:**
This is the most consistently implemented category in the project. No SQL injection vectors found.

---

### 9. Structure: Controller, Route, Service Separation of Concerns

**Score: 3/3**

**Expected pattern:**
Routes define paths and middleware. Controllers own HTTP layer (validation, status codes, response). Services own business logic and database access. Pattern is consistent across all modules.

**Evidence:**
- `routes/product.routes.js` — only `router.get/post/put/delete` calls with middleware chains. Zero business logic.
- `controllers/product.controller.js:38-91` — controller validates `name`, `price`, `quantity`, `size`, `best_before` and returns `400` with specific messages before touching the service.
- `services/product.service.js:41-54` — service performs the DB insert and returns the created row. No HTTP concepts.
- `controllers/auth.controller.js:14` — `authError(res, status, code, message)` is a tiny helper that keeps the controller's HTTP responsibility clean without mixing it into the service.
- `services/auth.service.js:10-33` — service returns `{ id, name, email, role, token }`. The controller decides what to put in the cookie vs what to send in the JSON body (`controllers/auth.controller.js:54-61`). The boundary is respected.
- `routes/order.routes.js:9` — `router.use(authenticate)` applies middleware at the router level, not inside the controller.

**Minor note:**
`app.js:33-42` mounts the admin orders route inline rather than in a dedicated route file. This is a small structural irregularity but does not undermine the overall pattern.

---

### 10. Deployment: Zero-Config and `.env` Audit

**Score: 1/3**

**Expected pattern:**
`.env.example` documents all required variables. Application fails clearly when variables are missing. Secrets are gitignored. Setup instructions allow a new developer to run the app with a single documented sequence of commands.

**Evidence:**
- `.gitignore:2` — `.env` is excluded. Good.
- `app.js:3-6` — server exits with `FATAL: JWT_SECRET environment variable is not set.` if that variable is missing.
- `package.json:7-9` — `start`, `dev`, and `test` scripts are present and correct.
- `config/db.js` — reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` from environment. No default values that would silently fall back to a wrong database.
- `seed.js:1-80` — seed script correctly reads schema and creates test accounts using the same MySQL engine as the application.

**Defects:**
- **`.env.example` does not exist.** A new team member cloning the repository must read `config/db.js`, `app.js`, `controllers/auth.controller.js`, and `routes/auth.routes.js` to discover that the required variables are `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `NODE_ENV`, and optionally `PORT`. This is a significant onboarding gap.
- No `README.md` exists at the project root. There are no documented setup steps, seed instructions, or test account credentials for new contributors.
- `app.js:13` — `app.use(cors())` has no `origin` restriction. An environment variable like `CORS_ORIGIN` should be documented.
- `seed.js:48` — uses `bcrypt.hash(account.password, 10)` while `auth.service.js:17` uses cost 12. Test account password hashes stored in the database will have weaker protection than production user hashes. This should be unified.

**Required improvement to reach Mastery:**
- Create `.env.example` listing all 8 required/optional variables with placeholder values and comments.
- Write a minimal `README.md` covering: prerequisites, database setup, `node seed.js`, `npm run dev`, and test accounts.
- Standardise bcrypt cost factor to 12 in `seed.js`.

---

## Detailed Bonus Feedback

### Challenge A: Stock-Check Store

**Awarded: 2/3**

**Evidence:**
- `services/order.service.js:14-17` — connection acquired and transaction opened before any data access.
- `services/order.service.js:34-49` — for every cart item, the query `WHERE id = ? AND best_before >= CURDATE() AND quantity >= ?` is executed **inside the open transaction**, meaning MySQL holds row-level locks during the check.
- `services/order.service.js:63-83` — stock deduction `UPDATE products SET quantity = quantity - ? WHERE id = ?` also runs inside the transaction before `conn.commit()`.
- `services/order.service.js:100-107` — `conn.rollback()` in the catch block reverts all changes including partial inserts and stock deductions.

**Feedback:**
The core transactional stock gate is correctly implemented. The check and deduction happen inside the same transaction, which provides the intended concurrent protection. Points are deducted because:
1. No test exercises the "out of stock" or "expired at checkout" path. The rubric requires testability.
2. The InnoDB row lock covers the duration of the transaction but no `SELECT ... FOR UPDATE` is used, meaning two concurrent transactions could both read `quantity = 1`, both pass the check, and both proceed — a classic TOCTOU window. For a university project this is a minor gap; a production fix would add `SELECT ... FOR UPDATE` on line 34.

---

### Challenge B: Dynamic Discount Engine

**Awarded: 0/3**

No `DiscountService`, no discount calculation, no promotional pricing anywhere in the codebase. The checkout total is calculated at `order.service.js:48` as a simple sum of `product.price × quantity` with no discount logic. Not implemented.

---

### Challenge C: Personalized Recommendations

**Awarded: 0/5**

No recommendation query, endpoint, service, or frontend integration of any kind. Product detail page (`bindProducts`) fetches a single product but makes no cross-reference to order history. Not implemented.

---

## Critical Defects

| # | Severity | Location | Description |
|---|----------|----------|-------------|
| 1 | HIGH | `app.js:13` | `cors()` with no origin restriction. In production, any website can make credentialed requests to the API. Fix: `cors({ origin: process.env.CORS_ORIGIN })`. |
| 2 | HIGH | `routes/order.routes.js:37-41` + `services/order.service.js:247-255` | `PATCH /api/orders/:id/status` allows any seller to update any order's status. No ownership check against `order_items.product.seller_id`. |
| 3 | MEDIUM | `schema.sql:57` | `orders.pickup_slot_id FK ON DELETE CASCADE`. Deleting a pickup slot silently deletes all order records. Should be `ON DELETE RESTRICT`. |
| 4 | MEDIUM | Root directory | No `.env.example`. Required variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `PORT`, `NODE_ENV`) are undocumented for new contributors. |
| 5 | MEDIUM | `public/components.js:920-924` | Seller dashboard stat cards (`Total listings: 12`, `Active: 9`, etc.) are hardcoded HTML. `bindSellerDashboard()` never overwrites them with real API data. |
| 6 | LOW | `seed.js:48` | bcrypt cost factor is 10 in seed, 12 in auth service. Inconsistency in hashing strength between test accounts and production accounts. |
| 7 | LOW | `public/router.js:155-180` | Global click handler matches navigation targets by regex against button text content. A future button whose label contains "login", "cart", "admin" etc. will unexpectedly navigate the user. |

---

## Recommended Fix Plan

Listed in priority order.

1. **Create `.env.example`** — Unblock any new developer from running the project. 15-minute task.
2. **Restrict CORS origin** — Set `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' })` in `app.js`. Add `CORS_ORIGIN` to `.env.example`. 10-minute task.
3. **Fix `updateStatus` ownership** — In `services/order.service.js`, add a JOIN to `order_items` / `products` to verify `seller_id = req.user.id` before allowing the status change.
4. **Fix pickup slot FK** — Change `orders.pickup_slot_id` to `ON DELETE RESTRICT` in `schema.sql`.
5. **Populate seller dashboard stats** — Add a `/api/products/mine/stats` endpoint returning aggregate counts; call it in `bindSellerDashboard()` and render into the `.stat .v` elements.
6. **Write a README.md** — Minimum: prerequisites, `npm install`, database setup, `node seed.js`, `npm run dev`, test accounts.
7. **Add stock-check test** — Write a test that attempts to checkout with `quantity > stock` and asserts the transaction rolls back.
8. **Unify bcrypt cost** — Change `seed.js:48` to `bcrypt.hash(account.password, 12)`.
9. **Replace text-regex navigation** — Audit all interactive elements and add explicit `data-route` attributes. Remove the text-matching fallback from the global click handler.

---

## Test Results

**Command:** `npx jest --no-coverage`

**Result:** PASS — 4 suites, **23/23 tests passing**

```
Test Suites: 4 passed, 4 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        1.818 s
```

**Test files:**
- `__tests__/frontend.test.js` — 14 tests: routing, auth guards, XSS prevention, checkout slot selection, seller dashboard, admin stats, login/register validation.
- `__tests__/auth.backend.test.js` — 3 tests: JSON parse error handler, `ER_DUP_ENTRY` propagation.
- `__tests__/error-banner.test.js` — 3 tests: banner show/hide.
- `__tests__/modal.test.js` — 3 tests: modal open/close.

**Coverage gaps:**
- No test for out-of-stock checkout (Bonus A gap).
- No test for CORS headers.
- No test for `PATCH /orders/:id/status` ownership enforcement.
- No test for seller dashboard stat card rendering.
- No integration test touching the actual database.

---

## Final Grade Calculation

```
Base score:    22 / 30
Bonus score:    2 / 11
Final score:   24 / 41

Percentage (base only):   22/30 = 73.3%
Percentage (with bonus):  24/41 = 58.5%
```

**Grade band (base rubric):**
73.3% — **C+ / B−**

Mapping to academic convention:

| Range | Grade |
|-------|-------|
| 90–100% | A / Mastery |
| 80–89% | B / Competency+ |
| 70–79% | C / Competency |
| 60–69% | D / Basic |
| < 60% | F / 404 Not Found |

**Final professor comment:**

This team has built a genuinely functional, end-to-end marketplace application and has shown real engineering instinct in several places — the transactional checkout with inline stock verification, the parameterised SQL throughout, and the clean three-layer MVC separation are all evidence of students who have moved beyond tutorial-level work. The authentication trust boundary is among the strongest I have reviewed at this level: httpOnly cookies, `is_active` re-validation on every session check, and rate-limited auth routes show that someone on this team understands *why* these defences exist, not just *how* to copy them.

The score is held back by three recurrent gaps. First, deployment documentation: a project that cannot be run by a new developer from a fresh clone is not production-ready, regardless of how clean the code is. `.env.example` and a README are not optional extras. Second, the CORS wildcard and the missing `updateStatus` ownership check are real security defects that would need to be resolved before any public deployment. Third, the four bonus challenges — totalling 11 points — represent over a quarter of the available marks; choosing not to attempt them has the greatest single impact on the final score.

If the team fixes the three critical defects (CORS, order status ownership, `.env.example`), adds the seller stats API, and writes a stock-depletion test, they would comfortably reach the B band on the base rubric.
