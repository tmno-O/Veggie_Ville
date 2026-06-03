// public/router.js

const contentRoot = document.getElementById('app-root');
const appPages = window.pages || [];
const esc = window.VVEscape || ((value='') => String(value).replace(/[&<>"']/g, ch => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[ch])));

let _catalogPage = 1;
const CATALOG_PAGE_SIZE = 12;

const routeMap = {
  '': 'p1',
  'browse': 'p2',
  'products': 'p3',
  'register': 'p4',
  'login': 'p5',
  'cart': 'p6',
  'checkout': 'p7',
  'orders': 'p8',
  'seller': 'p9',
  'listing': 'p10',
  'admin': 'p11',
  'pickup-slots': 'p12'
};

const pageRoute = (pathname) => {
  const parts = (pathname || '/').replace(/\/+$/, '').split('/').filter(Boolean);
  if (!parts.length) return { pageId: 'p1', params: {} };
  if (parts[0] === 'products' && parts[1]) return { pageId: 'p3', params: { productId: parts[1] } };
  if (parts[0] === 'orders' && parts[1]) return { pageId: 'p8', params: { orderId: parts[1] } };
  if (parts[0] === 'listing' && parts[1]) return { pageId: 'p10', params: { productId: parts[1] } };
  const last = parts[parts.length - 1];
  return { pageId: routeMap[last] || (appPages.some(p => p.id === last) ? last : 'p1'), params: {} };
};

const pageRoles = {
  p6: ['buyer', 'admin'],
  p7: ['buyer', 'admin'],
  p8: ['buyer', 'admin'],
  p9: ['seller', 'admin'],
  p10: ['seller', 'admin'],
  p11: ['admin'],
  p12: ['admin']
};

const authFetch = (url, opts={}) => window.VVAuth.authFetch(url, opts);
const getMe = () => window.VVAuth.fetchMe();

function parseJsonError(errText) {
  try { return JSON.parse(errText).message || errText; } catch { return errText; }
}

async function request(url, opts={}) {
  const res = await authFetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseJsonError(text) || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

const money = (value) => `฿${Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
const dateOnly = (value) => value ? String(value).split('T')[0] : 'N/A';

function renderNotice(title, message, actionLabel='Login', actionPath='/login') {
  contentRoot.innerHTML = `
    <div class="page-content" style="padding:24px">
      <div class="surface stack-12" style="max-width:520px;margin:0 auto">
        <div class="h1">${esc(title)}</div>
        <div class="small">${esc(message)}</div>
        <button class="btn" data-route="${esc(actionPath)}">${esc(actionLabel)}</button>
      </div>
    </div>`;
}

async function canRender(pageId) {
  const allowed = pageRoles[pageId];
  if (!allowed) return true;
  const me = await getMe();
  if (!me) {
    renderNotice('Login required', 'Please login before viewing this page.');
    return false;
  }
  if (!allowed.includes(me.role)) {
    renderNotice('Access denied', 'Your account does not have permission to view this page.', 'Home', '/');
    return false;
  }
  return true;
}

async function renderPage(pageId, params={}) {
  if (!(await canRender(pageId))) return;
  const page = appPages.find(p => p.id === pageId) || appPages[0];

  contentRoot.innerHTML = `
    <div class="page-content" style="padding:0;gap:0">
      <div class="page-phone">${page.mobile}</div>
      <div class="page-desktop">${page.desktop}</div>
    </div>
  `;

  document.title = `Veggie Ville - ${page.name}`;
  try { window.scrollTo(0, 0); } catch (_) {}
  await bindPage(pageId, params);
  await bindAccountState();
  document.querySelectorAll('.pill').forEach(pill => { pill.tabIndex = 0; });
  if (window.VVBadge) window.VVBadge();
}

function navigate(path, replace=false) {
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  const route = pageRoute(window.location.pathname);
  renderPage(route.pageId, route.params);
}
window.VVNavigate = navigate;

document.addEventListener('click', (event) => {
  const explicit = event.target.closest('[data-route]');
  if (explicit) {
    event.preventDefault();
    navigate(explicit.dataset.route);
    return;
  }

  const link = event.target.closest('.link, .nav-bar .logo, .bottom-nav .b, .btn, .pcard');
  if (!link) return;
  const text = (link.textContent || '').trim().toLowerCase();

  if (link.classList.contains('pcard') && !event.target.closest('.btn')) {
    const id = link.dataset.id;
    if (id && /^\d+$/.test(id)) {
      event.preventDefault();
      navigate(`/products/${id}`);
    }
    return;
  }

  const routes = [
    [/^vv|veggie ville|home$/, '/'],
    [/browse|browse products/, '/browse'],
    [/sell|become a seller|seller dashboard/, '/seller'],
    [/create account|register/, '/register'],
    [/login/, '/login'],
    [/cart|checkout|proceed to checkout/, '/cart'],
    [/orders|my orders/, '/orders'],
    [/admin|overview|manage users|view all orders/, '/admin'],
    [/pickup slots|manage pickup slots/, '/pickup-slots'],
    [/add new listing|\+ add new listing|new listing/, '/listing']
  ];
  for (const [pattern, path] of routes) {
    if (pattern.test(text) || (link.classList.contains('logo') && path === '/')) {
      if (/^add$|add to cart|save listing|create slot|delete|remove|place order/i.test(text)) return;
      event.preventDefault();
      navigate(path);
      return;
    }
  }
});

window.addEventListener('popstate', () => {
  const route = pageRoute(window.location.pathname);
  renderPage(route.pageId, route.params);
});

async function bindPage(pageId, params) {
  if (pageId === 'p1' || pageId === 'p2') await bindProducts(pageId);
  if (pageId === 'p3') await bindProductDetail(params.productId);
  if (pageId === 'p4') bindRegister();
  if (pageId === 'p5') bindLogin();
  if (pageId === 'p6') await bindCartPage();
  if (pageId === 'p7') await bindCheckoutPage();
  if (pageId === 'p8') await bindOrders(params.orderId);
  if (pageId === 'p9') await bindSellerDashboard();
  if (pageId === 'p10') await bindListingForm(params.productId);
  if (pageId === 'p11') await bindAdminDashboard();
  if (pageId === 'p12') await bindPickupSlots();
}

async function bindProducts(pageId, filters={}, page=1) {
  try {
    _catalogPage = page;
    const query = new URLSearchParams({ ...filters, page, limit: CATALOG_PAGE_SIZE });
    const data = await request(`/api/products?${query.toString()}`);

    const products = Array.isArray(data) ? data : (data.items || []);
    const total = data.total || products.length;
    const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

    const cards = products.map(p => window.productCard({
      id: p.id, name: p.name, size: p.size,
      price: money(p.price), exp: dateOnly(p.best_before), category: p.category
    })).join('') || '<div class="surface small">No products available.</div>';

    if (pageId === 'p1') {
      document.querySelectorAll('.page-phone .stack-12, .page-desktop .grid-4').forEach(el => { el.innerHTML = cards; });
    } else {
      bindCatalogFilters(filters);
      const mobileGrid = document.querySelectorAll('.page-phone .grid-2')[1];
      const desktopGrid = document.querySelector('.page-desktop .grid-3');
      if (mobileGrid) mobileGrid.innerHTML = cards;
      if (desktopGrid) desktopGrid.innerHTML = cards;
      renderPagination(totalPages, page, filters);
    }
  } catch (err) {
    showInlineError('Unable to load products: ' + err.message);
  }
}

function renderPagination(totalPages, currentPage, filters) {
  const paginationRow = document.querySelector('.page-desktop .grid-3 + .row, .page-desktop [style*="justify-content:center"]');
  if (!paginationRow) return;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  paginationRow.innerHTML = pages.map(p => {
    const isActive = p === currentPage;
    return `<span class="tag vv-page-btn" style="${isActive ? 'background:#111;color:#fff;' : ''}" data-page="${p}">${p}</span>`;
  }).join('');

  paginationRow.insertAdjacentHTML('afterbegin',
    `<span class="tag vv-page-btn" data-page="${Math.max(1, currentPage - 1)}">‹</span>`);
  paginationRow.insertAdjacentHTML('beforeend',
    `<span class="tag vv-page-btn" data-page="${Math.min(totalPages, currentPage + 1)}">›</span>`);

  paginationRow.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = Number(btn.dataset.page);
      if (p !== _catalogPage) bindProducts('p2', filters, p);
    });
  });
}

function bindCatalogFilters(filters={}) {
  const filterHtml = `
    <form class="vv-filter-form row" style="flex-wrap:wrap;gap:8px;margin-bottom:12px">
      <input class="field" name="keyword" placeholder="Search produce" value="${esc(filters.keyword || '')}" style="height:36px;border:1px solid var(--line);border-radius:6px;padding:0 10px">
      <select class="field" name="category" style="height:36px;border:1px solid var(--line);border-radius:6px"><option value="">All categories</option>${['Vegetable','Fruit','Herb','Honey','Egg'].map(c=>`<option ${filters.category===c?'selected':''}>${c}</option>`).join('')}</select>
      <select class="field" name="size" style="height:36px;border:1px solid var(--line);border-radius:6px"><option value="">All sizes</option>${['S','M','L','XL'].map(s=>`<option ${filters.size===s?'selected':''}>${s}</option>`).join('')}</select>
      <input class="field" name="minPrice" type="number" min="0" placeholder="Min" value="${esc(filters.minPrice || '')}" style="width:84px;height:36px;border:1px solid var(--line);border-radius:6px;padding:0 10px">
      <input class="field" name="maxPrice" type="number" min="0" placeholder="Max" value="${esc(filters.maxPrice || '')}" style="width:84px;height:36px;border:1px solid var(--line);border-radius:6px;padding:0 10px">
      <button class="btn sm" type="submit">Apply</button>
      <button class="btn ghost sm" type="button" data-route="/browse">Clear</button>
    </form>`;
  const mobileHost = document.querySelector('.page-phone .surface.muted');
  const desktopHost = document.querySelector('.page-desktop [style*="flex:1;padding:24px"]');
  const applyFormFilters = async (form) => {
    const next = Object.fromEntries([...new FormData(form)].filter(([, v]) => v !== ''));
    await bindProducts('p2', next, 1);
  };

  if (mobileHost) {
    mobileHost.innerHTML = filterHtml;
    const form = mobileHost.querySelector('.vv-filter-form');
    if (form) {
      form.addEventListener('submit', async e => { e.preventDefault(); await applyFormFilters(form); });
      form.querySelectorAll('input, select').forEach(el => el.addEventListener('change', () => applyFormFilters(form)));
    }
  }
  if (desktopHost && !desktopHost.querySelector('.vv-filter-form')) {
    desktopHost.insertAdjacentHTML('afterbegin', filterHtml);
    const form = desktopHost.querySelector('.vv-filter-form');
    if (form && !form.dataset.bound) {
      form.dataset.bound = 'true';
      form.addEventListener('submit', async e => { e.preventDefault(); await applyFormFilters(form); });
      form.querySelectorAll('input, select').forEach(el => el.addEventListener('change', () => applyFormFilters(form)));
    }
  }

  const sidePanel = document.querySelector('.page-desktop .side-panel');
  if (sidePanel && sidePanel.querySelector('.vv-filter-input') && !sidePanel.dataset.bound) {
    sidePanel.dataset.bound = 'true';
    const applySideFilters = async () => {
      const next = {};
      const cat = sidePanel.querySelector('input[name="vv-category"]:checked');
      const size = sidePanel.querySelector('input[name="vv-size"]:checked');
      const min = sidePanel.querySelector('input[name="minPrice"]');
      const max = sidePanel.querySelector('input[name="maxPrice"]');
      const exp = sidePanel.querySelector('input[name="vv-exp"]:checked');
      if (cat && cat.value) next.category = cat.value;
      if (size && size.value) next.size = size.value;
      if (min && Number(min.value) > 0) next.minPrice = min.value;
      if (max && Number(max.value) < 500) next.maxPrice = max.value;
      if (exp && exp.value) next.expDanger = exp.value;
      const minLabel = sidePanel.querySelector('.vv-min-price');
      const maxLabel = sidePanel.querySelector('.vv-max-price');
      if (minLabel) minLabel.textContent = min ? min.value : '0';
      if (maxLabel) maxLabel.textContent = max ? max.value : '500';
      await bindProducts('p2', next, 1);
    };
    sidePanel.addEventListener('change', async (e) => {
      if (!e.target.matches('.vv-filter-input')) return;
      if (e.target.name === 'vv-category') {
        sidePanel.querySelectorAll('.check').forEach(c => { if (!c.closest('.row')) c.classList.remove('on'); });
        e.target.closest('.check')?.classList.add('on');
      }
      if (e.target.name === 'vv-size') {
        sidePanel.querySelectorAll('.row .check').forEach(c => c.classList.remove('on'));
        e.target.closest('.check')?.classList.add('on');
      }
      if (e.target.name === 'vv-exp') {
        if (e.target.checked) e.target.closest('.check')?.classList.add('on');
        else e.target.closest('.check')?.classList.remove('on');
      }
      await applySideFilters();
    });
    sidePanel.addEventListener('input', (e) => {
      if (e.target.type === 'range') {
        const min = sidePanel.querySelector('input[name="minPrice"]');
        const max = sidePanel.querySelector('input[name="maxPrice"]');
        const minLabel = sidePanel.querySelector('.vv-min-price');
        const maxLabel = sidePanel.querySelector('.vv-max-price');
        if (minLabel) minLabel.textContent = min ? min.value : '0';
        if (maxLabel) maxLabel.textContent = max ? max.value : '500';
      }
    });
  }
}

window.VVLoadProducts = async (filters={}) => {
  const route = pageRoute(window.location.pathname);
  if (route.pageId === 'p1' || route.pageId === 'p2') await bindProducts(route.pageId, filters, 1);
};

async function bindProductDetail(productId) {
  const id = productId || pageRoute(window.location.pathname).params.productId;
  if (!id) return;
  try {
    const p = await request(`/api/products/${encodeURIComponent(id)}`);
    document.querySelectorAll('.page-phone, .page-desktop').forEach(container => {
      const title = container.querySelector('.vv-product-title');
      const price = container.querySelector('.vv-product-price');
      const img = container.querySelector('.vv-product-hero');
      const desc = container.querySelector('.vv-product-desc');
      if (title) title.textContent = p.name || '';
      if (price) price.innerHTML = `${money(p.price)} <span class="small">/ item</span>`;
      if (img) {
        img.alt = p.name || '';
        if (p.image_url) img.src = p.image_url;
        else img.removeAttribute('src');
      }
      if (desc) desc.textContent = p.description || 'No description provided.';
      const size = container.querySelector('.vv-product-size');
      if (size) size.textContent = p.size || '';
      const expiry = container.querySelector('.vv-product-expiry');
      if (expiry) expiry.textContent = `⏳ Best before ${dateOnly(p.best_before)}`;
      const stock = container.querySelector('.vv-product-stock');
      if (stock) stock.textContent = `Stock: ${p.quantity ?? 0}`;
      const sellerName = container.querySelector('.vv-seller-name');
      if (sellerName) sellerName.textContent = p.seller_name;
      const sellerMeta = container.querySelector('.vv-seller-meta');
      if (sellerMeta) sellerMeta.textContent = `★ ${p.rating} · ${p.review_count} reviews`;
      const add = Array.from(container.querySelectorAll('.btn')).find(btn => /add/i.test(btn.textContent || ''));
      if (add) {
        add.dataset.productId = p.id;
        add.textContent = 'Add to Cart';
      }
    });
    document.title = `Veggie Ville - ${p.name || 'Product Detail'}`;
    const allProducts = await request('/api/products');
    const more = (Array.isArray(allProducts) ? allProducts : (allProducts.items || []))
      .filter(r => r.seller_id === p.seller_id && r.id !== p.id)
      .slice(0, 4);
    document.querySelectorAll('.page-phone .vv-scroll-x').forEach(el => {
      el.innerHTML = more.map(r => `<div style="min-width:140px">${window.productCard({
        id: r.id, name: r.name, size: r.size,
        price: money(r.price), exp: dateOnly(r.best_before), category: r.category, addBtn: false
      })}</div>`).join('');
    });
    document.querySelectorAll('.page-desktop .grid-4').forEach(el => {
      el.innerHTML = more.map(r => window.productCard({
        id: r.id, name: r.name, size: r.size,
        price: money(r.price), exp: dateOnly(r.best_before), category: r.category
      })).join('');
    });
  } catch (err) {
    showInlineError('Unable to load product: ' + err.message);
  }
}

function bindLogin() {
  ['mobile', 'desktop'].forEach(layout => {
    const btn = document.getElementById(`btn-submit-login-${layout}`);
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.VVAuth.login(
          document.getElementById(`login-email-${layout}`).value,
          document.getElementById(`login-pass-${layout}`).value
        );
        navigate('/');
      } catch (err) {
        showModalError('Login failed', err.message);
      }
    });
  });
}

function bindRegister() {
  document.querySelectorAll('.page-phone .surface, .page-desktop .surface').forEach((el, idx) => {
    el.innerHTML = `
      <div class="h1">Create account</div>
      <form class="vv-register-form stack-12" data-layout="${idx}">
        <div class="input"><label>Full name *</label><input class="field" name="name" required></div>
        <div class="input"><label>Email *</label><input type="email" class="field" name="email" required></div>
        <div class="input"><label>Password *</label><input type="password" class="field" name="password" minlength="8" required></div>
        <div class="input"><label>I am a *</label><select class="field" name="role"><option value="buyer">Buyer</option><option value="seller">Seller</option></select></div>
        <button class="btn full" type="submit">Create account</button>
      </form>`;
  });
  document.querySelectorAll('.vv-register-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      try {
        await request('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        await window.VVAuth.login(data.email, data.password);
        navigate('/');
      } catch (err) {
        showModalError('Registration failed', err.message);
      }
    });
  });
}

async function bindCartPage() {
  try {
    const [cart, slots] = await Promise.all([request('/api/cart'), request('/api/pickup-slots')]);
    renderCartSections(cart, slots);
    window.VVCart?.fetch();
  } catch (err) {
    showInlineError('Unable to load cart: ' + err.message);
  }
}

async function bindCheckoutPage() {
  try {
    const [cart, slots] = await Promise.all([request('/api/cart'), request('/api/pickup-slots')]);
    const itemsHtml = (cart.items || []).map(item => `
      <div class="row between">
        <span class="small">${esc(item.name)} <span class="badge">${esc(item.size)}</span> x${Number(item.cart_quantity || item.quantity || 1)}</span>
        <span class="mono">${money(item.subtotal || Number(item.price) * Number(item.cart_quantity || item.quantity || 1))}</span>
      </div>`).join('') || '<div class="small">Your cart is empty.</div>';
    const slotOptions = (slots || []).map(s => `<option value="${s.id}">${new Date(s.slot_start).toLocaleString()} - ${new Date(s.slot_end).toLocaleTimeString()} (max ${s.max_orders})</option>`).join('');
    const checkoutHtml = `
      <div class="surface stack-8">
        <div class="h2">Pickup window</div>
        <label class="input"><span>Select pickup window *</span><select class="field vv-pickup-slot"><option value="">Select pickup window</option>${slotOptions}</select></label>
      </div>
      <div class="surface stack-8">
        <div class="h2">Payment</div>
        <div class="callout"><span class="pin">!</span><div><span class="lbl">Demo mode</span>Payment is bypassed. Orders are confirmed immediately.</div></div>
      </div>`;
    const summaryHtml = `
      <div class="surface stack-8">
        <div class="h2">Order summary</div>
        ${itemsHtml}
        <div class="hr"></div>
        <div class="row between" style="font-weight:700"><span>Total</span><span class="mono">${money(cart.total)}</span></div>
        <button class="btn full vv-place-order" ${cart.items?.length ? '' : 'disabled'}>Place order</button>
      </div>`;

    document.querySelectorAll('.page-phone').forEach(container => {
      const summary = container.querySelector('.surface');
      if (summary) summary.outerHTML = summaryHtml;
      const pickup = container.querySelectorAll('.surface.stack-8')[0];
      if (pickup) pickup.outerHTML = checkoutHtml;
    });
    document.querySelectorAll('.page-desktop').forEach(container => {
      const left = container.querySelector('.stack-12');
      const right = container.querySelector('.stack-12[style*="sticky"]');
      if (left) left.innerHTML = checkoutHtml;
      if (right) right.innerHTML = summaryHtml;
    });
    document.querySelectorAll('.vv-place-order').forEach(btn => btn.addEventListener('click', placeOrderFromPage));
  } catch (err) {
    showInlineError('Unable to load checkout: ' + err.message);
  }
}

function renderCartSections(cart, slots) {
  const rows = (cart.items || []).map(item => `
    <div class="surface vv-cart-row" data-cart-item="${item.cart_item_id}" data-product-id="${item.product_id}" style="display:grid;grid-template-columns:60px 1fr auto;gap:10px;align-items:center">
      <div class="img-ph" style="width:60px;aspect-ratio:1/1">IMG</div>
      <div>
        <div style="font-weight:600;font-size:13px">${esc(item.name)}</div>
        <div class="row" style="gap:4px;margin-top:4px"><span class="badge">${esc(item.size)}</span><span class="tag">Best before ${esc(dateOnly(item.best_before))}</span></div>
        <div class="row" style="gap:8px;margin-top:6px"><div class="qty"><span data-qty="-1">-</span><span class="n">${item.cart_quantity}</span><span data-qty="1">+</span></div><span class="small">${money(item.price)} ea.</span></div>
      </div>
      <div style="text-align:right"><div style="font-weight:700">${money(item.subtotal)}</div><button class="btn ghost sm vv-remove-item" data-cart-item="${item.cart_item_id}">Remove</button></div>
    </div>`).join('') || '<div class="surface small">Your cart is empty.</div>';

  const slotOptions = (slots || []).map(s => `<option value="${s.id}">${new Date(s.slot_start).toLocaleString()} - ${new Date(s.slot_end).toLocaleTimeString()} (max ${s.max_orders})</option>`).join('');
  const summary = `
    <div class="surface stack-8">
      <div class="row between"><span>Total</span><span class="mono">${money(cart.total)}</span></div>
      <label class="input"><span>Pickup window *</span><select class="field vv-pickup-slot"><option value="">Select pickup window</option>${slotOptions}</select></label>
      <button class="btn full vv-place-order" ${cart.items?.length ? '' : 'disabled'}>Place order</button>
    </div>`;

  document.querySelectorAll('.page-phone, .page-desktop').forEach(container => {
    const stack = container.querySelector('.stack-12');
    if (stack) stack.innerHTML = rows;
    const surfaces = container.querySelectorAll('.surface.stack-8');
    const target = surfaces[surfaces.length - 1];
    if (target) target.outerHTML = summary;
  });

  document.querySelectorAll('.vv-place-order').forEach(btn => btn.addEventListener('click', placeOrderFromPage));
}

async function placeOrderFromPage(e) {
  e.preventDefault();
  const root = e.currentTarget.closest('.page-phone, .page-desktop') || document;
  const slot = root.querySelector('.vv-pickup-slot')?.value;
  if (!slot) return showModalError('Pickup required', 'Select a pickup window before placing the order.');
  try {
    const cart = await request('/api/cart');
    const items = cart.items.map(item => ({ product_id: item.product_id, quantity: item.cart_quantity }));
    const order = await request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup_slot_id: Number(slot), items })
    });
    showModalError('Order placed', `Order #${order.order_id} confirmed.`);
    navigate('/orders');
  } catch (err) {
    showModalError('Checkout failed', err.message);
  }
}

async function bindOrders(orderId=null) {
  try {
    if (orderId) {
      const order = await request(`/api/orders/${encodeURIComponent(orderId)}`);
      const items = (order.items || []).map(item => `<div class="row between"><span>${esc(item.name)} x${Number(item.quantity)}</span><span>${money(Number(item.unit_price) * Number(item.quantity))}</span></div>`).join('');
      const detail = `<div class="surface stack-12"><div class="h1">ORD-${order.id}</div><div class="badge">${esc(order.status)}</div><div class="small">Pickup: ${new Date(order.slot_start).toLocaleString()} - ${new Date(order.slot_end).toLocaleTimeString()}</div>${items}<div class="hr"></div><div class="row between" style="font-weight:700"><span>Total</span><span>${money(order.total_price)}</span></div><button class="btn ghost" data-route="/orders">Back to orders</button></div>`;
      document.querySelectorAll('.page-phone, .page-desktop').forEach(el => { el.innerHTML = detail; });
      return;
    }
    const orders = await request('/api/orders');
    const mobileHtml = orders.map(o => `
      <div class="surface row between">
        <div><div class="mono small">ORD-${o.id}</div><div class="small">${new Date(o.created_at).toLocaleString()} · ${o.item_count} item(s)</div></div>
        <div style="text-align:right"><div class="mono">${money(o.total_price)}</div><span class="badge">${esc(o.status)}</span></div>
      </div>`).join('') || '<div class="surface small">No orders yet.</div>';
    const desktopHtml = orders.map(o => `
      <tr>
        <td class="mono">ORD-${o.id}</td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td>${o.item_count} item(s)</td>
        <td>${new Date(o.slot_start).toLocaleString()} - ${new Date(o.slot_end).toLocaleTimeString()}</td>
        <td class="mono">${money(o.total_price)}</td>
        <td><span class="badge">${esc(o.status)}</span></td>
        <td><button class="btn ghost sm" data-route="/orders/${o.id}">View</button></td>
      </tr>`).join('');
    const mobileStack = document.querySelector('.page-phone .stack-12');
    const desktopTbody = document.querySelector('.page-desktop tbody');
    if (mobileStack) mobileStack.innerHTML = mobileHtml;
    if (desktopTbody) desktopTbody.innerHTML = desktopHtml;
  } catch (err) {
    showInlineError('Unable to load orders: ' + err.message);
  }
}

async function bindSellerDashboard() {
  try {
    const mine = await request('/api/products/mine');
    const cards = mine.map(p => window.productCard({ id:p.id, name:p.name, size:p.size, price:money(p.price), exp:dateOnly(p.best_before), category:p.category })).join('') || '<div class="surface small">No seller listings found.</div>';
    document.querySelectorAll('.page-phone .stack-12, .page-desktop tbody').forEach(el => {
      if (el.tagName === 'TBODY') {
        el.innerHTML = mine.map(p => `<tr><td><div class="img-ph" style="width:48px;height:48px">IMG</div></td><td>${esc(p.name)}</td><td><span class="badge">${esc(p.size)}</span></td><td>${money(p.price)}</td><td>${p.quantity}</td><td>${esc(dateOnly(p.best_before))}</td><td><span class="badge">${new Date(p.best_before) < new Date() ? 'Expired' : 'Active'}</span></td><td><button class="btn ghost sm" data-route="/listing/${p.id}">Edit</button> <button class="btn danger sm vv-delete-product" data-product-id="${p.id}">Delete</button></td></tr>`).join('');
      } else {
        el.innerHTML = cards;
      }
    });
  } catch (err) {
    showInlineError('Unable to load seller dashboard: ' + err.message);
  }
}

async function bindListingForm(productId=null) {
  let product = null;
  if (productId) {
    try { product = await request(`/api/products/${encodeURIComponent(productId)}`); }
    catch (err) { showInlineError('Unable to load listing for edit: ' + err.message); }
  }
  const formHtml = `
    <form class="vv-listing-form stack-12">
      <div class="input"><label>Product name *</label><input class="field" name="name" value="${esc(product?.name || '')}" required></div>
      <div class="input"><label>Description</label><textarea class="field" name="description">${esc(product?.description || '')}</textarea></div>
      <div class="grid-2"><div class="input"><label>Price *</label><input class="field" type="number" min="0.01" step="0.01" name="price" value="${esc(product?.price || '')}" required></div><div class="input"><label>Quantity *</label><input class="field" type="number" min="0" name="quantity" value="${esc(product?.quantity || '')}" required></div></div>
      <div class="grid-2"><div class="input"><label>Size *</label><select class="field" name="size">${['S','M','L','XL'].map(s=>`<option ${product?.size===s || (!product && s==='M') ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="input"><label>Category</label><select class="field" name="category">${['Vegetable','Fruit','Herb','Honey','Egg'].map(c=>`<option ${product?.category===c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
      <div class="input"><label>Best before *</label><input class="field" type="date" name="best_before" value="${esc(dateOnly(product?.best_before || ''))}" required></div>
      <button class="btn full" type="submit">Save listing</button>
    </form>`;
  document.querySelectorAll('.page-phone .stack-12, .page-desktop .stack-12').forEach((el, idx) => { if (idx < 2) el.innerHTML = formHtml; });
  document.querySelectorAll('.vv-listing-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        await request(productId ? `/api/products/${encodeURIComponent(productId)}` : '/api/products', {
          method: productId ? 'PUT' : 'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        navigate('/seller');
      } catch (err) {
        showModalError('Save failed', err.message);
      }
    });
  });
}

async function bindAdminDashboard() {
  try {
    const [stats, users, orders] = await Promise.all([
      request('/api/admin/users/stats'),
      request('/api/admin/users'),
      request('/api/admin/orders')
    ]);
    document.querySelectorAll('.page-phone, .page-desktop').forEach(container => {
      const values = container.querySelectorAll('.stat .v');
      if (values[0]) values[0].textContent = stats.total || 0;
      if (values[1]) values[1].textContent = stats.sellers || 0;
      if (values[2]) values[2].textContent = orders.length || 0;
      if (values[3]) values[3].textContent = stats.banned || 0;
    });
    const userHtml = users.slice(0, 5).map(u => `<div class="row between"><div><div style="font-weight:600;font-size:12px">${esc(u.name)}</div><div class="small mono">${esc(u.email)} · ${esc(u.role)}</div></div><span class="badge">${u.is_active ? 'Active' : 'Banned'}</span></div>`).join('');
    document.querySelectorAll('.page-desktop .surface.stack-8').forEach(el => { el.innerHTML = userHtml; });
    const userRows = users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><select class="field vv-admin-role" data-user-id="${u.id}">${['buyer','seller','admin'].map(role=>`<option value="${role}" ${u.role===role?'selected':''}>${role}</option>`).join('')}</select></td><td><button class="btn ghost sm vv-admin-status" data-user-id="${u.id}" data-active="${u.is_active ? 'false' : 'true'}">${u.is_active ? 'Ban' : 'Activate'}</button></td></tr>`).join('');
    const adminTable = `<div class="surface" style="padding:0;overflow:auto;margin-top:16px"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>${userRows}</tbody></table></div>`;
    const desktopMain = document.querySelector('.page-desktop [style*="flex:1;padding:24px"]');
    const mobileOrders = document.querySelector('.page-phone .stack-8');
    if (desktopMain && !desktopMain.querySelector('.vv-admin-role')) desktopMain.insertAdjacentHTML('beforeend', adminTable);
    if (mobileOrders) mobileOrders.innerHTML = userRows ? `<div class="surface stack-8"><div class="h2">Users</div>${users.map(u=>`<div class="row between"><span>${esc(u.name)}</span><button class="btn ghost sm vv-admin-status" data-user-id="${u.id}" data-active="${u.is_active ? 'false' : 'true'}">${u.is_active ? 'Ban' : 'Activate'}</button></div>`).join('')}</div>` : '';
  } catch (err) {
    showInlineError('Unable to load admin dashboard: ' + err.message);
  }
}

async function bindPickupSlots() {
  try {
    const slots = await request('/api/pickup-slots');
    const mobile = slots.map(s => `
      <div class="surface stack-8">
        <div class="row between"><b>${new Date(s.slot_start).toLocaleDateString()}</b><span class="mono">${new Date(s.slot_start).toLocaleTimeString()} - ${new Date(s.slot_end).toLocaleTimeString()}</span></div>
        <div class="row between small"><span>Max ${s.max_orders}</span><span>Available</span></div>
        <button class="btn danger sm vv-delete-slot" data-slot-id="${s.id}" style="align-self:flex-start">Delete</button>
      </div>`).join('') || '<div class="surface small">No pickup slots.</div>';
    const rows = slots.map(s => `
      <tr><td>${new Date(s.slot_start).toLocaleDateString()}</td><td class="mono">${new Date(s.slot_start).toLocaleTimeString()} - ${new Date(s.slot_end).toLocaleTimeString()}</td><td>${s.max_orders}</td><td>-</td><td><span class="badge">Available</span></td><td><button class="btn danger sm vv-delete-slot" data-slot-id="${s.id}">Delete</button></td></tr>`).join('');
    const mobileStack = document.querySelector('.page-phone .stack-12');
    const tbody = document.querySelector('.page-desktop tbody');
    if (mobileStack) mobileStack.innerHTML = mobile;
    if (tbody) tbody.innerHTML = rows;
  } catch (err) {
    showInlineError('Unable to load pickup slots: ' + err.message);
  }

  const mobileOverlay = document.querySelector('.page-phone .modal-overlay .surface');
  if (mobileOverlay) {
    mobileOverlay.innerHTML = `
      <form class="vv-slot-form stack-8">
        <div class="h3">Add slot</div>
        <div class="input"><label>Start *</label><input class="field" type="datetime-local" name="slot_start" required></div>
        <div class="input"><label>End *</label><input class="field" type="datetime-local" name="slot_end" required></div>
        <div class="input"><label>Max orders *</label><input class="field" type="number" min="1" name="max_orders" required></div>
        <button class="btn" type="submit">Create slot</button>
      </form>`;
  }

  const panel = document.querySelector('.page-desktop .surface.stack-8');
  if (panel) {
    panel.innerHTML = `
      <form class="vv-slot-form stack-8">
        <div class="h2">Add pickup slot</div>
        <div class="input"><label>Start *</label><input class="field" type="datetime-local" name="slot_start" required></div>
        <div class="input"><label>End *</label><input class="field" type="datetime-local" name="slot_end" required></div>
        <div class="input"><label>Max orders *</label><input class="field" type="number" min="1" name="max_orders" required></div>
        <button class="btn" type="submit">Create slot</button>
      </form>`;
  }
  document.querySelectorAll('.vv-slot-form').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await request('/api/pickup-slots', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      navigate('/pickup-slots', true);
    } catch (err) {
      showModalError('Slot save failed', err.message);
    }
  }));
}

document.addEventListener('click', async e => {
  const productDelete = e.target.closest('.vv-delete-product');
  if (productDelete) {
    e.preventDefault();
    try {
      await request(`/api/products/${productDelete.dataset.productId}`, { method:'DELETE' });
      navigate('/seller', true);
    } catch (err) {
      showModalError('Delete failed', err.message);
    }
  }
  const slotDelete = e.target.closest('.vv-delete-slot');
  if (slotDelete) {
    e.preventDefault();
    try {
      await request(`/api/pickup-slots/${slotDelete.dataset.slotId}`, { method:'DELETE' });
      navigate('/pickup-slots', true);
    } catch (err) {
      showModalError('Delete failed', err.message);
    }
  }
  const status = e.target.closest('.vv-admin-status');
  if (status) {
    e.preventDefault();
    try {
      await request(`/api/admin/users/${status.dataset.userId}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ is_active: status.dataset.active === 'true' })
      });
      navigate('/admin', true);
    } catch (err) {
      showModalError('User update failed', err.message);
    }
  }
});

document.addEventListener('change', async e => {
  const role = e.target.closest('.vv-admin-role');
  if (!role) return;
  try {
    await request(`/api/admin/users/${role.dataset.userId}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ role: role.value })
    });
    navigate('/admin', true);
  } catch (err) {
    showModalError('Role update failed', err.message);
  }
});

async function bindAccountState() {
  const me = await getMe();
  document.querySelectorAll('.nav-bar').forEach(nav => {
    if (nav.querySelector('.vv-account-action')) return;
    const btn = document.createElement('button');
    btn.className = 'btn ghost sm vv-account-action';
    btn.textContent = me ? `Logout (${me.role})` : 'Login';
    btn.addEventListener('click', () => {
      if (me) {
        window.VVAuth.setToken(null);
        window.VVAuth.lsRemove('vv_cart');
        navigate('/');
      } else {
        navigate('/login');
      }
    });
    nav.appendChild(btn);
  });
}

function showInlineError(message) {
  window.VVErrorBanner.show(message);
}

function showModalError(title, message) {
  if (window.VVModal?.openModal) {
    window.VVModal.openModal(`<div style="font-weight:700;margin-bottom:8px">${esc(title)}</div><div>${esc(message)}</div>`);
  } else {
    alert(`${title}: ${message}`);
  }
}

const initial = pageRoute(window.location.pathname);
renderPage(initial.pageId, initial.params);
