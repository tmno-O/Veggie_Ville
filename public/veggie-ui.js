(function(){
  // Simple UI interactions for Wireframes with filtering and backend cart integration
  function $(sel,ctx=document){return ctx.querySelector(sel)}
  function $all(sel,ctx=document){return Array.from(ctx.querySelectorAll(sel))}
  const esc = window.VVEscape || ((v='') => String(v).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));

  function lsGet(key, fallback=null) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, String(val)); } catch { /* quota or private mode */ }
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }

  // cart counter (initial value may be fetched from server later)
  let cartCount = Number(lsGet('vv_cart', '0')||0);
  function renderCartBadge(){
    $all('.nav-bar .icon, .bottom-nav .b .ic').forEach(ic=>{
      let existing = ic.querySelector('.vv-cart-badge');
      if(!existing && cartCount>0){
        const span = document.createElement('span');
        span.className = 'vv-cart-badge';
        span.textContent = cartCount;
        ic.appendChild(span);
      } else if(existing){
        if(cartCount>0) existing.textContent = cartCount; else existing.remove();
      }
    });
    lsSet('vv_cart', String(cartCount));
  }
  window.VVBadge = renderCartBadge;
  renderCartBadge();

  // Accessible live region (polite) and visual alert fallback
  let live = document.querySelector('.vv-live');
  if(!live){ live = document.createElement('div'); live.className='vv-live'; live.setAttribute('aria-live','polite'); live.setAttribute('role','status'); document.body.appendChild(live); }
  let alertEl = document.querySelector('.vv-alert');
  if(!alertEl){ alertEl = document.createElement('div'); alertEl.className='vv-alert'; alertEl.setAttribute('role','alertdialog'); alertEl.setAttribute('aria-hidden','true'); document.body.appendChild(alertEl); }

  function announce(msg){
    // screen reader
    live.textContent = msg;
    // visual fallback
    alertEl.textContent = msg; alertEl.setAttribute('aria-hidden','false'); alertEl.classList.add('show');
    setTimeout(()=>{ alertEl.classList.remove('show'); alertEl.setAttribute('aria-hidden','true'); }, 1800);
  }

  // modal functions provided by public/modal.js as `window.VVModal` (openModal/closeModal)

  // --- Auth helpers (cookie-based — no token in localStorage) ---
  function setAuthToken(token){
    // legacy: only used to clear any old localStorage token on logout
    if(!token){ lsRemove('vv_token'); }
  }

  let _cachedUser = null;

  async function fetchMe(){
    if(_cachedUser) return _cachedUser;
    try{
      const res = await fetch('/api/auth/me', { method:'GET', credentials:'include' });
      if(res.status === 401 || res.status === 403){
        _cachedUser = null;
        lsRemove('vv_token'); // clean up any legacy token left in storage
        return null;
      }
      if(!res.ok) return null;
      _cachedUser = await res.json();
      return _cachedUser;
    }catch(e){ return null; }
  }

  async function authFetch(url, opts={}){
    try {
      opts = Object.assign({ credentials: 'include', headers: {} }, opts || {});
      return await fetch(url, opts);
    } catch(err) {
      throw new Error('Network error: ' + esc(err.message||err));
    }
  }

  let vvSocket = null;
  function connectSocket(){
    try{
      if(typeof io === 'undefined') return;
      if(vvSocket && vvSocket.connected) return; // already connected — avoid duplicate socket
      if(vvSocket) vvSocket.disconnect();
      vvSocket = io(); // auth handled via httpOnly cookie
      vvSocket.on('connect', ()=>{});
      vvSocket.on('connect_error', ()=>{});
      vvSocket.on('cart:update', data=>{
        try{
          if(data && Array.isArray(data.items)){
            lastCartData = data;
            cartCount = data.count || data.items.reduce((sum, item)=>sum + Number(item.cart_quantity || item.quantity || 0), 0);
            renderCartBadge();
            const d = document.querySelector('.vv-cart-drawer');
            if(d && d.style.transform === 'translateX(0%)') renderCart(data);
          }
        }catch(e){ console.error('cart:update handling error', e); }
      });
    }catch(e){ console.warn('Socket init failed', e); }
  }

  async function logout(){
    _cachedUser = null; // invalidate user cache before the network call
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {
      // Still clear local state when the network is unavailable.
    }
    setAuthToken(null);
    lsRemove('vv_cart');
    if(vvSocket) {
      try { vvSocket.disconnect(); } catch (_) {}
      vvSocket = null;
    }
  }

  window.VVAuth = { setToken: setAuthToken, fetchMe, authFetch, connectSocket, logout, lsRemove };
  // convenience: perform login and persist token
  window.VVAuth.login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if(!res.ok) {
      const txt = await res.text();
      let payload = { message: txt };
      try { payload = JSON.parse(txt); } catch {}
      const err = new Error(payload.message || res.statusText || 'Login failed');
      err.code = payload.code || `HTTP_${res.status}`;
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    connectSocket(); // cookie is already set by the server's Set-Cookie header
    return data;
  };

  // Helper: server POST to /api/cart
  async function postAddToCart(item){
    try{
      // backend expects { product_id, quantity }
      const payload = { product_id: Number(item.product_id), quantity: Number(item.quantity||item.qty||1) };
      const res = await authFetch('/api/cart', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!res.ok){
        const txt = await res.text(); throw new Error(txt||res.statusText);
      }
      // on success, refresh the cart from server so counts/totals are authoritative
      await fetchCart();
      announce('Added to cart');
    }catch(err){
      // revert optimistic update if any
      cartCount = Math.max(0, Number(lsGet('vv_cart', '0')||0)); renderCartBadge();
      // show focus-trapped modal for important failure
      const msg = /Unauthorized/i.test(err.message) ? 'Please log in to add items.' : (err.message||err);
      window.VVModal && window.VVModal.openModal ? window.VVModal.openModal(`<div style="font-weight:700;margin-bottom:8px">Failed to add to cart</div><div style="color:#333;margin-bottom:8px">${esc(msg)}</div>`) : alert('Failed to add to cart: '+esc(msg));
      console.error('Add to cart error', err);
    }
  }

  // ---------- Cart drawer UI ----------
  function createCartDrawer(){
    let d = document.querySelector('.vv-cart-drawer');
    if(d) return d;
    d = document.createElement('aside'); d.className='vv-cart-drawer'; d.setAttribute('aria-hidden','true');
    d.style.cssText='position:fixed;right:0;top:0;height:100%;width:320px;background:#fff;border-left:1px solid rgba(0,0,0,.06);box-shadow:-24px 0 48px rgba(0,0,0,.12);z-index:9998;padding:16px;display:flex;flex-direction:column;gap:12px;transform:translateX(100%);transition:transform .28s ease';
    d.innerHTML = `<div class="vv-cart-header" style="display:flex;justify-content:space-between;align-items:center"><b>My cart</b><button class="vv-cart-close" aria-label="Close cart">✕</button></div><div class="vv-cart-body" style="flex:1;overflow:auto"></div><div class="vv-cart-footer" style="border-top:1px solid rgba(0,0,0,.06);padding-top:12px"><div class="vv-cart-total" style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Total</span><span class="mono">฿0</span></div><button class="btn full">Proceed to checkout</button></div>`;
    document.body.appendChild(d);
    d.querySelector('.vv-cart-close').addEventListener('click', toggleCart);
    return d;
  }

  async function fetchCart(){
    try{
      const res = await authFetch('/api/cart', {method:'GET'});
      if(!res.ok) throw new Error('no-cart');
      const data = await res.json();
      // expected shape from server: { items: [...], total: number, count: number }
      if(data && Array.isArray(data.items)) { renderCart(data); lastCartData = data; }
      if(data && Array.isArray(data.items)) {
        cartCount = data.items.reduce((sum, item)=>sum + Number(item.cart_quantity || item.quantity || 0), 0);
        renderCartBadge();
      } else if(data && typeof data.count === 'number') { cartCount = data.count; renderCartBadge(); }
    }catch(err){
      // server not available — fallback to local
    }
  }

  function renderCart(data){
    const d = createCartDrawer();
    const body = d.querySelector('.vv-cart-body');
    body.innerHTML = '';
    (data.items||[]).forEach(it=>{
      const qty = it.cart_quantity || it.quantity || it.qty || 1;
      const price = it.price || 0;
      const subtotal = it.subtotal || (price * qty) || 0;
      const el = document.createElement('div'); el.style.cssText='display:grid;grid-template-columns:48px 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.04)';
      el.innerHTML = `<div class="img-ph" style="width:48px;height:48px;aspect-ratio:1/1">img</div><div><div style="font-weight:600">${esc(it.name)}</div><div class="small mono">฿${Number(price)} × ${Number(qty)}</div></div><div style="text-align:right"><div class="mono">฿${Number(subtotal)}</div><div style="margin-top:6px"><button class="btn ghost sm vv-remove-item" data-cart-item="${esc(it.cart_item_id || '')}">Remove</button></div></div>`;
      body.appendChild(el);
    });
    const totalEl = d.querySelector('.vv-cart-total .mono');
    totalEl.textContent = '฿'+((data.total)||0);
  }

  // hold last cart for checkout
  let lastCartData = null;

  // Open checkout modal: list pickup slots and POST /api/orders
  async function openCheckoutModal(){
    if(!lastCartData || !Array.isArray(lastCartData.items) || lastCartData.items.length===0){
      window.VVModal && window.VVModal.openModal ? window.VVModal.openModal('<div style="font-weight:700">Cart is empty</div>') : alert('Cart is empty');
      return;
    }
    try{
      const r = await authFetch('/api/pickup-slots', { method: 'GET' });
      if(!r.ok) throw new Error('Failed to load pickup slots');
      const slots = await r.json();
      const options = slots.map(s=>`<label style="display:block;margin-bottom:8px"><input type="radio" name="vv-slot" value="${s.id}"> ${new Date(s.slot_start).toLocaleString()} — ${new Date(s.slot_end).toLocaleTimeString()} (max ${s.max_orders})</label>`).join('') || '<div class="small">No slots available</div>';
      const html = `<div style="font-weight:700;margin-bottom:8px">Select pickup slot</div><form id="vv-checkout-form">${options}<div style="margin-top:12px;text-align:right"><button type="submit" class="btn">Place order</button></div></form>`;
      window.VVModal && window.VVModal.openModal ? window.VVModal.openModal(html) : alert('Checkout: '+html);
      const modal = document.querySelector('.vv-modal');
      const form = modal.querySelector('#vv-checkout-form');
      form.addEventListener('submit', async ev=>{
        ev.preventDefault();
        const formData = new FormData(form);
        const slot = formData.get('vv-slot');
        if(!slot){ alert('Please select a slot'); return; }
        // prepare items from lastCartData
        const items = lastCartData.items.map(it=>({ product_id: Number(it.product_id), quantity: Number(it.cart_quantity || it.quantity || 1) }));
        try{
          const res = await authFetch('/api/orders', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pickup_slot_id: Number(slot), items }) });
          if(!res.ok){ const txt = await res.text(); throw new Error(txt||res.statusText); }
          const data = await res.json();
          window.VVModal && window.VVModal.closeModal ? window.VVModal.closeModal() : null;
          window.VVModal && window.VVModal.openModal ? window.VVModal.openModal(`<div style="font-weight:700">Order placed!</div><div class="small mono">ORD-${data.order_id}</div><div style="margin-top:12px"><button class="btn" data-route="/orders">View orders</button></div>`) : alert('Order placed: ORD-'+data.order_id);
          // refresh cart
          await fetchCart();
        }catch(err){
          window.VVModal && window.VVModal.openModal ? window.VVModal.openModal(`<div style="font-weight:700">Checkout failed</div><div style="color:#333">${esc(err.message||err)}</div>`) : alert('Checkout failed: '+esc(err.message||err));
        }
      }, { once:true });
    }catch(err){
      window.VVModal && window.VVModal.openModal ? window.VVModal.openModal(`<div style="font-weight:700">Unable to load pickup slots</div><div style="color:#333">${esc(err.message||err)}</div>`) : alert('Unable to load pickup slots');
    }
  }

  // delegate checkout button inside cart drawer
  document.addEventListener('click', function handler(e){
    const btn = e.target.closest('.vv-cart-drawer .btn');
    if(!btn) return;
    const text = (btn.textContent||'').trim();
    if(/Proceed to checkout|Place order/i.test(text)){
      e.preventDefault();
      openCheckoutModal();
    }
  });

  function toggleCart(){
    const d = createCartDrawer();
    const open = d.style.transform === 'translateX(0%)';
    if(open){ d.style.transform='translateX(100%)'; d.setAttribute('aria-hidden','true'); }
    else { d.style.transform='translateX(0%)'; d.setAttribute('aria-hidden','false'); fetchCart(); }
  }
  window.VVCart = { fetch: fetchCart, toggle: toggleCart };

  // attach cart toggle to cart icons
document.addEventListener('click', e => {
    const ic = e.target.closest('.nav-bar .icon, .bottom-nav .b .ic');
    if (ic && (ic.textContent||'').includes('🛒')) {
      e.preventDefault();
      toggleCart();
    }
  });

  // ---------- Nav drawer (hamburger menu) ----------
  function createNavDrawer(){
    let d = document.querySelector('.vv-nav-drawer');
    if(d) return d;
    const overlay = document.createElement('div');
    overlay.className = 'vv-nav-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', toggleNavDrawer);

    d = document.createElement('aside');
    d.className = 'vv-nav-drawer';
    d.setAttribute('aria-hidden','true');
    d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b style="font-size:16px;color:var(--vv-green-900)">Veggie Ville</b><button class="vv-nav-close" aria-label="Close menu">✕</button></div>
      <nav style="display:flex;flex-direction:column;gap:4px">
        <a class="vv-nav-link" data-route="/" style="padding:10px 8px;border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">🏠 Home</a>
        <a class="vv-nav-link" data-route="/browse" style="padding:10px 8px;border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">🥬 Browse Products</a>
        <a class="vv-nav-link" data-route="/cart" style="padding:10px 8px;border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">🛒 Cart</a>
        <a class="vv-nav-link" data-route="/orders" style="padding:10px 8px;border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">📦 My Orders</a>
        <a class="vv-nav-link" data-route="/seller" style="padding:10px 8px;border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">🌱 Seller Dashboard</a>
        <a class="vv-nav-link" data-route="/login" style="padding:10px 8px;border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">🔑 Login</a>
      </nav>`;
    document.body.appendChild(d);
    d.querySelector('.vv-nav-close').addEventListener('click', toggleNavDrawer);
    d.querySelectorAll('.vv-nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        toggleNavDrawer();
        if(window.VVNavigate) window.VVNavigate(link.dataset.route);
      });
    });
    return d;
  }

  function toggleNavDrawer(){
    const d = createNavDrawer();
    const overlay = document.querySelector('.vv-nav-overlay');
    const open = d.classList.contains('open');
    if(open){
      d.classList.remove('open'); d.setAttribute('aria-hidden','true');
      if(overlay) overlay.classList.remove('open');
    } else {
      d.classList.add('open'); d.setAttribute('aria-hidden','false');
      if(overlay) overlay.classList.add('open');
    }
  }

  document.addEventListener('click', e => {
    const hamburger = e.target.closest('.nav-bar .icon[title="hamburger"]');
    if(hamburger){
      e.preventDefault();
      toggleNavDrawer();
    }
  });
  // try fetch cart on load
  window.addEventListener('load', ()=>{ fetchCart(); });

  // Use Socket.IO for server-pushed cart updates if available
  if(typeof io !== 'undefined') connectSocket();
  else setInterval(()=>{ fetchCart(); }, 15000);

  // Delegate remove-from-cart actions (DELETE /api/cart/:id)
  document.addEventListener('click', async e=>{
    const rem = e.target.closest('.vv-remove-item');
    if(!rem) return;
    const id = rem.dataset.cartItem;
    if(!id) return;
    try{
      const res = await authFetch(`/api/cart/${id}`, { method: 'DELETE' });
      if(!res.ok){ const txt = await res.text(); throw new Error(txt||res.statusText); }
      // refresh cart
      await fetchCart();
      announce('Item removed');
    }catch(err){
      window.VVModal && window.VVModal.openModal ? window.VVModal.openModal(`<div style="font-weight:700;margin-bottom:8px">Failed to remove item</div><div style="color:#333;margin-bottom:8px">${esc(err.message||err)}</div>`) : alert('Failed to remove item: '+esc(err.message||err));
      console.error('Remove cart item failed', err);
    }
  });

  // Filtering: show/hide product cards by data-category
  function filterByCategory(cat){
    const cards = $all('.pcard');
    cards.forEach(c=>{
      const ccat = c.dataset.category || '';
      if(!cat || cat.toLowerCase()==='all' || ccat.toLowerCase()===cat.toLowerCase()) c.style.display = '';
      else c.style.display = 'none';
    });
  }

  // click handlers
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.btn');
    if(btn){
      if(btn.classList.contains('disabled')){ announce('Action unavailable'); return }
      const txt = (btn.textContent||'').trim();
      // Add to cart behavior: prefer server call, infer product from nearest .pcard
      if(btn.matches('.vv-place-order, .vv-delete-product, .vv-delete-slot, .vv-remove-item')) return;
      if(/Add to Cart|^Add$|Add /i.test(txt)){
        const card = btn.closest('.pcard');
        if(card){
          // optimistic local increment (kept minimal)
          cartCount = Number(lsGet('vv_cart', '0')||0) + 1; renderCartBadge();
          const item = { product_id: card.dataset.id || card.dataset.name, qty: 1 };
          postAddToCart(item);
        } else if(btn.dataset.productId) {
          cartCount = Number(lsGet('vv_cart', '0')||0) + 1; renderCartBadge();
          postAddToCart({ product_id: btn.dataset.productId, qty: 1 });
        } else {
          cartCount = Number(lsGet('vv_cart', '0')||0) + 1; renderCartBadge(); announce('Added to cart');
        }
      } else if(/Remove|🗑|Delete/i.test(txt)){
        if(cartCount>0) cartCount = Math.max(0,cartCount-1); renderCartBadge(); announce('Removed');
      } else if(btn.classList.contains('fab')){
        announce('Create new listing (demo)');
      } else if(/Load more/i.test(txt)){
        const grid = document.querySelector('.grid-4') || document.querySelector('.grid-3') || document.querySelector('.grid-2');
        if(grid){
          const items = grid.children; if(items.length){
            for(let i=0;i<4;i++){ grid.appendChild(items[i%items.length].cloneNode(true)); }
            announce('Loaded more items');
          }
        }
      }
    }

    // pills: filter by category
    const pill = e.target.closest('.pill');
    if(pill){
      $all('.pill').forEach(p=>p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.textContent.trim();
      if(window.VVLoadProducts){
        window.VVLoadProducts(cat.toLowerCase() === 'all' ? {} : { category: cat })
          .catch(err => console.error('Product filter failed', err));
      } else {
        filterByCategory(cat);
      }
      announce('Filter: '+cat);
    }

    // select pickup slot -> enable checkout
    const sel = e.target.closest('.select');
    if(sel && /Sat|Sun|Select pickup|Pickup/i.test(sel.textContent)){
      const proceed = Array.from(document.querySelectorAll('.btn.full')).find(b => /Proceed to checkout|Place order/i.test(b.textContent));
      if(proceed){ proceed.classList.remove('disabled'); announce('Pickup slot selected — checkout enabled'); }
    }
  });

  // qty controls (delegated)
  document.addEventListener('click', e=>{
    const span = e.target.closest('.qty > span');
    if(!span) return;
    const q = span.closest('.qty'); const n = q.querySelector('.n'); if(!n) return;
    let val = Number(n.textContent)||0;
    if(span.textContent.trim()==='+'){ val++; }
    else if(span.textContent.trim()==='−' || span.textContent.trim()==='-'){ val = Math.max(1,val-1); }
    n.textContent = val;
    const row = span.closest('.vv-cart-row');
    if(row?.dataset.cartItem){
      authFetch(`/api/cart/${row.dataset.cartItem}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ quantity: val })
      }).then(fetchCart).catch(err => {
        announce('Unable to update quantity');
        console.error('Quantity update failed', err);
      });
    }
  });

  // keyboard accessible pills, including pills injected after SPA navigation
  document.addEventListener('keydown', ev=>{
    const p = ev.target.closest && ev.target.closest('.pill');
    if(p && (ev.key==='Enter' || ev.key===' ')){ ev.preventDefault(); p.click(); }
  });

  // nav smooth scroll
  $all('a[data-target]').forEach(a=>a.addEventListener('click', e=>{
    const id = a.dataset.target; const s = document.getElementById(id); if(s){ s.scrollIntoView({behavior:'smooth', block:'start'}); }
  }));

  // initial announce
  window.addEventListener('load', ()=>{ setTimeout(()=>announce('Interactive demo enabled'),500); });
})();
