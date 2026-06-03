# 🐛 Bug Report & Code Review — Login / Register Not Working
**Project:** Veggie Ville  
**File affected:** `public/router.js`  
**Severity:** 🔴 Critical — users cannot log in or register  
**Status:** ✅ Fixed

---

## 1. Symptom

> User fills in email and password on the Login page, clicks **Login** button — page reloads back to the Login page. Nothing changes. No error shown.

Same issue would appear on Register if the submit button text ever triggered a route pattern.

---

## 2. Root Cause — Step by Step

### The architecture

Veggie Ville is a **Single-Page Application (SPA)**. There is no real page navigation — it uses a custom client-side router in `public/router.js`. The router renders different "pages" by swapping HTML into a single `<div id="app-root">`.

To handle navigation, a **global click listener** is attached to the entire document:

```js
// public/router.js  (line ~135)
document.addEventListener('click', (event) => {
  // Step 1: check for explicit [data-route] attribute
  const explicit = event.target.closest('[data-route]');
  if (explicit) {
    event.preventDefault();
    navigate(explicit.dataset.route);
    return;
  }

  // Step 2: catch any .btn click and try to match text → route
  const link = event.target.closest('.link, .nav-bar .logo, .bottom-nav .b, .btn, .pcard');
  if (!link) return;
  const text = (link.textContent || '').trim().toLowerCase();

  // ... route matching table ...
  const routes = [
    [/^vv|veggie ville|home$/, '/'],
    [/browse|browse products/,  '/browse'],
    [/login/,                   '/login'],   // ← THIS LINE
    // ...
  ];
  for (const [pattern, path] of routes) {
    if (pattern.test(text)) {
      event.preventDefault();
      navigate(path);   // ← navigates to /login = re-renders login page
      return;
    }
  }
});
```

### The Login form HTML

```html
<!-- public/components.js  (Login page, desktop layout) -->
<form class="vv-login-form stack-12" data-layout="desktop">
  <div class="input">
    <label for="login-email-desktop">Email *</label>
    <input type="email" id="login-email-desktop" name="email" class="field" required>
  </div>
  <div class="input">
    <label for="login-pass-desktop">Password *</label>
    <input type="password" id="login-pass-desktop" name="password" class="field" required>
  </div>

  <!-- ↓ This button is the problem -->
  <button id="btn-submit-login-desktop" class="btn full" type="submit">Login</button>
</form>
```

### Why it breaks — the exact execution order

When the user clicks the **Login** button, two event listeners compete:

```
USER CLICKS "Login" button
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  document.addEventListener('click', ...)            │  ← fires FIRST (bubbling)
│                                                     │
│  1. No [data-route] on button → skip Step 1         │
│  2. button has class .btn → enters Step 2           │
│  3. text = "login"                                  │
│  4. /login/.test("login") === TRUE                  │
│  5. event.preventDefault()  ← ⚠️ kills form submit  │
│  6. navigate('/login')      ← re-renders login page │
└─────────────────────────────────────────────────────┘
        │
        ▼  ← never reaches here
┌─────────────────────────────────────────────────────┐
│  form.addEventListener('submit', ...)               │  ← blocked
│  (bindLogin in router.js)                           │
│  Would have called VVAuth.login() and navigate('/') │
└─────────────────────────────────────────────────────┘
```

`event.preventDefault()` on a `click` event **prevents the form's default submit behavior**, which means the `submit` event never fires. The global handler hijacks the click, interprets "Login" as a navigation intent, and sends the user back to the same page.

### Why the user sees "nothing changes"

`navigate('/login')` calls `renderPage('p5')` which:
1. Re-injects the login page HTML into `#app-root`
2. Calls `bindLogin()` again to re-attach form handlers
3. Scrolls to top

The page looks exactly the same as before. No error. No feedback. The user is stuck.

---

## 3. The Fix

**File:** `public/router.js`  
**Location:** Inside the global `document.addEventListener('click', ...)` handler

### Before (broken)

```js
const link = event.target.closest('.link, .nav-bar .logo, .bottom-nav .b, .btn, .pcard');
if (!link) return;
const text = (link.textContent || '').trim().toLowerCase();

if (link.classList.contains('pcard') && !event.target.closest('.btn')) {
  // ...product card logic
}

const routes = [
  [/^vv|veggie ville|home$/, '/'],
  [/browse|browse products/, '/browse'],
  [/login/,                  '/login'],
  // ...
];
```

### After (fixed) ✅

```js
const link = event.target.closest('.link, .nav-bar .logo, .bottom-nav .b, .btn, .pcard');
if (!link) return;

// ✅ FIX: Never intercept submit buttons inside forms.
// Form submit buttons (type="submit") should always trigger the form's
// own submit event handler. Intercepting them here re-navigates the page
// instead of calling the form's async handler (VVAuth.login, etc.).
if ((link.type === 'submit' || link.getAttribute('type') === 'submit') && link.closest('form')) return;

const text = (link.textContent || '').trim().toLowerCase();

if (link.classList.contains('pcard') && !event.target.closest('.btn')) {
  // ...product card logic
}

const routes = [
  [/^vv|veggie ville|home$/, '/'],
  [/browse|browse products/, '/browse'],
  [/login/,                  '/login'],
  // ...
];
```

### Why this fix is safe

- `link.type === 'submit'` works for `<button type="submit">` (DOM property)
- `link.getAttribute('type') === 'submit'` is the fallback for elements where `.type` may not reflect the attribute directly
- `link.closest('form')` ensures only buttons **inside a form** are excluded — standalone nav buttons like `<button class="btn" data-route="/login">Login</button>` in navbars are **not** affected
- All other navigation buttons (Browse, Sell, Orders, etc.) that are not inside forms continue to work as before

---

## 4. All Forms Affected by This Bug

| Form | Submit button text | Matched route pattern | Would re-navigate to |
|---|---|---|---|
| Login | `Login` | `/login/` | `/login` ← **confirmed broken** |
| Register | `Create account` | no match | — (accidentally worked) |
| Filter (Browse) | `Apply` | no match | — (accidentally worked) |
| Save Listing | `Save listing` | `/sell\|become a seller\|seller dashboard/` | `/seller` ← **would break** |
| Place Order | `Place order` | no match (exclusion already existed) | — |

> ⚠️ **Save Listing** was also vulnerable. Clicking "Save listing" matches the `/sell/` pattern and would have navigated to `/seller` without saving. The fix resolves this too.

---

## 5. Full Code Review — Auth Flow

Now that the critical bug is fixed, here is a complete review of the auth-related code across all files.

---

### 5.1 `public/router.js` — `bindLogin()`

```js
function bindLogin() {
  bindPasswordToggles();
  document.querySelectorAll('.vv-login-form').forEach(form => {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const vErr = validateLoginFields(data);
      if (vErr) { showModalApiError('Login failed', vErr); return; }
      setSubmitState(form, true);
      try {
        await window.VVAuth.login(data.email, data.password);
        navigate('/');
      } catch (err) {
        showModalApiError('Login failed', err);
      } finally {
        setSubmitState(form, false);
      }
    });
  });
}
```

**✅ Good:**
- `form.dataset.bound` guard prevents duplicate event listeners after re-renders
- `setSubmitState` disables the button during the async call (prevents double-submit)
- `finally` block re-enables the button even if the request fails
- Client-side `validateLoginFields()` runs before the API call (fast feedback)

**⚠️ Issues:**

**Issue 1 — No redirect-back after login**  
After a successful login, the user is always sent to `/`. If the user was on `/cart` and got redirected to `/login`, they should be sent back to `/cart`, not home.

```js
// Suggested fix
const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/';
navigate(returnTo);
```

And in `canRender()` where you redirect unauthenticated users:
```js
// Before
renderNotice('Login required', 'Please login before viewing this page.');

// After
const encoded = encodeURIComponent(window.location.pathname);
navigate(`/login?returnTo=${encoded}`);
```

**Issue 2 — No "wrong password" user feedback in the UI**  
If the password is wrong, `showModalApiError` shows a modal. This is fine, but the email field is not re-focused and the password field is not cleared. Users expect the password field to clear after a failed login attempt.

```js
// Add after catch block
catch (err) {
  showModalApiError('Login failed', err);
  const passField = form.querySelector('[name="password"]');
  if (passField) { passField.value = ''; passField.focus(); }
}
```

---

### 5.2 `public/router.js` — `bindRegister()`

```js
form.addEventListener('submit', async e => {
  e.preventDefault();
  // ...validate...
  try {
    await request('/api/auth/register', { method: 'POST', ... });
    await window.VVAuth.login(data.email, data.password);  // auto-login after register
    navigate('/');
  } catch (err) {
    showModalApiError('Registration failed', err);
  }
});
```

**✅ Good:**
- Automatically logs in after successful registration (good UX)
- Password match validation runs before the API call
- `confirm_password` is deleted from the payload before sending to the API

**⚠️ Issues:**

**Issue 1 — Two separate API calls for register + login**  
If registration succeeds but the auto-login call fails (e.g., network drop), the user has an account but is not logged in and gets an error. The backend `register` endpoint should return a JWT token so the frontend can set the cookie in one round-trip.

```js
// backend: controllers/auth.controller.js — register()
// After creating the user, also issue a token:
const token = await authService.loginAfterRegister(user);
setAuthCookie(res, token);
res.status(201).json({ ...user, token });
```

```js
// frontend: router.js — bindRegister()
// Then just use the token from the register response:
const result = await request('/api/auth/register', { method: 'POST', ... });
// No separate login call needed — cookie is already set by Set-Cookie header
navigate('/');
```

**Issue 2 — Role field defaults silently**  
If the `<select name="role">` is not in the DOM (e.g., on mobile with a different layout), `role` will be `undefined` in `FormData` and the backend defaults to `'buyer'` silently. This is acceptable behavior but should be documented.

---

### 5.3 `public/veggie-ui.js` — `VVAuth.login()`

```js
window.VVAuth.login = async (email, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const txt = await res.text();
    let payload = { message: txt };
    try { payload = JSON.parse(txt); } catch {}
    const err = new Error(payload.message || res.statusText || 'Login failed');
    err.code = payload.code || `HTTP_${res.status}`;
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  connectSocket();
  return data;
};
```

**✅ Good:**
- `credentials: 'include'` ensures the `Set-Cookie` header is accepted by the browser
- Gracefully handles non-JSON error responses with the `try/catch JSON.parse`
- Attaches `.code` and `.status` to the error object for the UI to use

**⚠️ Issues:**

**Issue 1 — `connectSocket()` called on every login**  
If the socket is already connected (e.g., user logs out and back in without a page reload), calling `connectSocket()` again may open a second socket connection. Check if the socket is already open:

```js
// lib/socket.js or veggie-ui.js
function connectSocket() {
  if (vvSocket && vvSocket.connected) return; // already connected
  vvSocket = io();
}
```

**Issue 2 — Token not stored in memory**  
The token is stored in an `httpOnly` cookie (correct and secure). However, `fetchMe()` makes a full API round-trip every time the app needs to know who is logged in (e.g., for every `canRender()` call on route change). Consider caching the user object in a module-level variable and invalidating on logout:

```js
let _cachedUser = null;

async function fetchMe() {
  if (_cachedUser) return _cachedUser;
  try {
    const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
    if (!res.ok) { _cachedUser = null; return null; }
    _cachedUser = await res.json();
    return _cachedUser;
  } catch { return null; }
}

// In logout():
async function logout() {
  _cachedUser = null;  // ← invalidate cache
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  // ...
}
```

---

### 5.4 `middlewares/auth.js` — JWT Middleware

```js
const authenticateToken = (req, res, next) => {
  const header = req.headers['authorization'];
  const bearer = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  const cookieToken = getCookie(req, 'vv_token');
  const token = bearer || cookieToken;

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    req.user = jwt.verify(decodeURIComponent(token), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

**✅ Good:**
- Accepts both Bearer header (API clients) and `httpOnly` cookie (browser)
- Does not expose the JWT error reason (expired vs. invalid signature) to the client

**⚠️ Issues:**

**Issue 1 — Manual cookie parsing instead of `cookie-parser`**  
The `getCookie` helper manually splits `req.headers.cookie`. If `cookie-parser` is already in `app.js` middleware, use `req.cookies.vv_token` instead — it handles edge cases like URL-encoded values, whitespace, and duplicate cookie names correctly.

Check `app.js`:
```js
// If this exists in app.js:
app.use(require('cookie-parser')());

// Then simplify middleware/auth.js to:
const cookieToken = req.cookies?.vv_token || null;
```

**Issue 2 — `decodeURIComponent(token)` is potentially unsafe**  
If the cookie value is not URL-encoded, `decodeURIComponent` will throw on characters like `%` that aren't valid escape sequences (e.g., `%ZZ`). This would crash the middleware and return a 500 instead of a 401.

```js
// Safe version:
let rawToken = bearer || cookieToken;
try { rawToken = decodeURIComponent(rawToken); } catch { /* use as-is */ }
const token = rawToken;
```

**Issue 3 — No distinction between expired vs. invalid token in error response**  
Both cases return `{ message: 'Invalid token' }`. The frontend cannot tell whether to show "Your session expired, please log in again" vs. "This token is invalid". Consider:

```js
try {
  req.user = jwt.verify(token, process.env.JWT_SECRET);
  next();
} catch (err) {
  const expired = err.name === 'TokenExpiredError';
  res.status(401).json({
    code: expired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
    message: expired ? 'Your session has expired. Please log in again.' : 'Invalid token.'
  });
}
```

---

### 5.5 `services/auth.service.js`

```js
const register = async ({ name, email, password, role = 'buyer' }) => {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new Error('Email already in use');

  const hash = await bcrypt.hash(password, 12);
  let result;
  try {
    [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) throw new Error('Email already in use');
    throw err;
  }
  return { id: result.insertId, name, email, role };
};
```

**✅ Good:**
- `bcrypt` cost factor of 12 — appropriate balance of security vs. speed
- Duplicate email handled at both SELECT level and INSERT level (race condition safe)
- Never returns `password_hash` in the response

**⚠️ Issues:**

**Issue 1 — SELECT before INSERT is a TOCTOU race**  
Two concurrent registrations with the same email can both pass the `SELECT` check before either `INSERT` runs. The `ER_DUP_ENTRY` catch handles this correctly, but it's worth noting this is why both checks are needed.

**Issue 2 — `register` returns no token**  
The service returns `{ id, name, email, role }` but no JWT. This forces the frontend to make a second `/api/auth/login` call after registration. See Issue 1 in section 5.3 for the recommended fix.

**Issue 3 — No maximum length validation on `name`**  
A 10,000-character name would pass controller validation (only checks for empty string) and get inserted into the database. Add a max-length guard:

```js
// controllers/auth.controller.js
if (name.trim().length > 100) {
  return authError(res, 400, 'AUTH_NAME_TOO_LONG', 'Name must be 100 characters or fewer.');
}
```

---

## 6. Summary of All Issues Found

| # | File | Severity | Issue | Fixed? |
|---|---|---|---|---|
| 1 | `router.js` | 🔴 Critical | Global click handler intercepts form submit buttons, breaking login | ✅ Fixed |
| 2 | `router.js` | 🟠 High | "Save listing" submit button also intercepted (would navigate to /seller without saving) | ✅ Fixed (same fix) |
| 3 | `router.js` | 🟡 Medium | No redirect-back after login (user always goes to `/` regardless of where they came from) | ⬜ Pending |
| 4 | `router.js` | 🟡 Medium | Password field not cleared after failed login | ⬜ Pending |
| 5 | `veggie-ui.js` | 🟡 Medium | `connectSocket()` may open duplicate socket if called while already connected | ⬜ Pending |
| 6 | `veggie-ui.js` | 🟡 Medium | `fetchMe()` makes an API call on every route change — no caching | ⬜ Pending |
| 7 | `middlewares/auth.js` | 🟡 Medium | `decodeURIComponent(token)` can throw on malformed values, causing 500 instead of 401 | ⬜ Pending |
| 8 | `middlewares/auth.js` | 🟡 Medium | Manual cookie parsing instead of using `cookie-parser` | ⬜ Pending |
| 9 | `middlewares/auth.js` | 🟢 Low | No distinction between expired vs. invalid token in error code | ⬜ Pending |
| 10 | `services/auth.service.js` | 🟡 Medium | `register` returns no token — forces extra login round-trip | ⬜ Pending |
| 11 | `controllers/auth.controller.js` | 🟢 Low | No max-length check on `name` field | ⬜ Pending |
| 12 | `controllers/auth.controller.js` | 🟢 Low | No password complexity check (only length) | ⬜ Pending |
| 13 | `controllers/auth.controller.js` | 🟠 High | No rate limiting on `/login` and `/register` routes | ⬜ Pending |

---

## 7. Quick-Fix Checklist (copy-paste ready)

### Fix 1 — ✅ Already applied: global click handler guard
```js
// public/router.js — inside document.addEventListener('click', ...)
// Add immediately after: const link = event.target.closest(...)

if ((link.type === 'submit' || link.getAttribute('type') === 'submit') && link.closest('form')) return;
```

### Fix 2 — Safe decodeURIComponent in auth middleware
```js
// middlewares/auth.js
let rawToken = bearer || cookieToken;
if (rawToken) { try { rawToken = decodeURIComponent(rawToken); } catch { /* use as-is */ } }
const token = rawToken;
```

### Fix 3 — Rate limiting on auth routes
```bash
npm install express-rate-limit
```
```js
// routes/auth.routes.js
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { code: 'AUTH_RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' }
});
router.post('/register', authLimiter, controller.register);
router.post('/login',    authLimiter, controller.login);
```

### Fix 4 — JWT_SECRET startup guard
```js
// app.js — add at the top after dotenv.config()
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}
```

### Fix 5 — Token expiry distinction in middleware
```js
// middlewares/auth.js
} catch (err) {
  const expired = err.name === 'TokenExpiredError';
  return res.status(401).json({
    code: expired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
    message: expired ? 'Your session has expired. Please log in again.' : 'Invalid token.'
  });
}
```

---

*Report generated: 2026-06-03 · Veggie Ville v1.0*
