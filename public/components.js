  const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
  window.VVEscape = escapeHtml;

  // ---------- reusable wireframe fragments ----------
  const navBarMobile = `
    <div class="nav-bar">
      <div class="logo">VV</div>
      <div class="icon" title="hamburger">☰</div>
      <div class="search" style="flex:1">Search…</div>
      <div class="icon" title="cart">🛒</div>
      <div class="avatar"></div>
    </div>`;

  const navBarMobileLogoOnly = `
    <div class="nav-bar" style="justify-content:center">
      <div class="logo">VV — Veggie Ville</div>
    </div>`;

  const navBarDesktop = `
    <div class="nav-bar" style="padding:12px 24px">
      <div class="logo">VV — Veggie Ville</div>
      <div class="search">🔍&nbsp; Search produce, herbs, eggs…</div>
      <span class="link">Browse</span>
      <span class="link">Sell</span>
      <div class="icon">🛒</div>
      <div class="avatar"></div>
    </div>`;

  const navBarDesktopAdmin = `
    <div class="nav-bar" style="padding:12px 24px">
      <div class="logo">VV — Admin Console</div>
      <span class="badge" style="margin-left:8px">👑 ADMIN</span>
      <div style="flex:1"></div>
      <span class="link mono small">admin@veggieville.local</span>
      <div class="avatar"></div>
    </div>`;

  const bottomNav = `
    <div class="bottom-nav">
      <div class="b"><div class="ic"></div>Home</div>
      <div class="b"><div class="ic"></div>Browse</div>
      <div class="b"><div class="ic"></div>Cart</div>
      <div class="b"><div class="ic"></div>Me</div>
    </div>`;

  const footerMini = `<div class="footer-mini">© 2026 Veggie Ville · Terms · Privacy</div>`;
  const footerFull = `
    <div class="footer">
      <div><h5>Veggie Ville</h5>Community garden-share marketplace.</div>
      <div>
        <h5>Shop</h5>
        <span data-route="/browse" style="cursor:pointer;display:block;margin-bottom:4px;color:inherit">Browse</span>
        <span data-route="/browse" style="cursor:pointer;display:block;margin-bottom:4px;color:inherit">Categories</span>
        <span data-route="/browse" style="cursor:pointer;display:block;color:inherit">Sellers near me</span>
      </div>
      <div>
        <h5>Sell</h5>
        <span data-route="/seller" style="cursor:pointer;display:block;margin-bottom:4px;color:inherit">Become a seller</span>
        <span data-route="/listing" style="cursor:pointer;display:block;margin-bottom:4px;color:inherit">Listing guide</span>
        <span data-route="/pickup-slots" style="cursor:pointer;display:block;color:inherit">Pickup slots</span>
      </div>
      <div>
        <h5>Support</h5>
        <span style="cursor:pointer;display:block;margin-bottom:4px;color:inherit">FAQ</span>
        <span style="cursor:pointer;display:block;margin-bottom:4px;color:inherit">Terms</span>
        <span style="cursor:pointer;display:block;color:inherit">Privacy</span>
      </div>
    </div>`;

  const productCard = (opts={}) => {
    const {size='M', exp='2027-08-12', expDanger=false, name='Cherry tomato', price='฿120', addBtn=true, id=null, category: explicitCategory=null} = opts;
    // infer category from name when not explicitly provided
    const nl = (name||'').toLowerCase();
    let category = 'Vegetable';
    if(/egg|eggs/.test(nl)) category = 'Egg';
    else if(/honey/.test(nl)) category = 'Honey';
    else if(/basil|mint|cilantro|herb|oregano|parsley|thyme|sage/.test(nl)) category = 'Herb';
    else if(/strawberry|apple|banana|berry|lemon|lime|orange/.test(nl)) category = 'Fruit';
    if(explicitCategory) category = explicitCategory;
    const slug = id || nl.replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const safeName = escapeHtml(name);
    const safeSize = escapeHtml(size);
    const safeCategory = escapeHtml(category);
    const safePrice = escapeHtml(price);
    const safeExp = escapeHtml(exp);
    const safeId = escapeHtml(slug);
    return `
      <div class="pcard" data-id="${safeId}" data-name="${safeName}" data-category="${safeCategory}" data-size="${safeSize}" data-price="${safePrice}" data-exp="${safeExp}">
        <div class="img-ph" style="border-radius:0;border-left:none;border-right:none;border-top:none"></div>
        <div class="body">
          <div class="name">${safeName}</div>
          <div class="meta">
            <span class="badge">${safeSize}</span>
            <span class="tag ${expDanger?'danger':''}" title="best_before">⏳ ${safeExp}</span>
          </div>
          <div class="row between">
            <div class="price">${safePrice}</div>
            ${addBtn?'<button class="btn sm">Add</button>':''}
          </div>
        </div>
      </div>`;
  };

  const pills = (active='All') => {
    const items = ['All','Vegetable','Fruit','Herb','Honey','Egg'];
    return `<div class="pills">${items.map(i=>`<span class="pill ${i===active?'active':''}">${i}</span>`).join('')}</div>`;
  };

  const callout = (txt, lbl='⚡ BUSINESS LOGIC', cls='') => `
    <div class="callout ${cls}">
      <span class="pin">${lbl.split(' ')[0]}</span>
      <div><span class="lbl">${lbl.replace(/^\S+\s/,'')}</span>${txt}</div>
    </div>`;

  const api = (txt) => `
    <div class="callout api">
      <span class="pin">→</span>
      <div><span class="lbl">API CALL</span><span class="mono">${txt}</span></div>
    </div>`;

  // ---------- pages ----------
  const pages = [];

  // ============== PAGE 1 — Landing ==============
  pages.push({
    id:'p1', name:'Landing / Home', auth:'public',
    apis:'GET /api/products?limit=12 · GET /api/categories',
    mobile:`
      ${navBarMobile}
      <div class="surface vv-center">
        <div class="h1">Fresh from your neighbors</div>
        <div class="small" style="margin-top:6px">Buy &amp; swap home-grown produce</div>
        <button class="btn full" style="margin-top:12px">Browse Products</button>
      </div>
      ${pills('All')}
      <div class="stack-12">
        ${productCard({id:101,name:'Cherry tomato',size:'M',exp:'2026-05-20',expDanger:true,price:'฿120',category:'Vegetable'})}
        ${productCard({id:102,name:'Basil bunch',size:'S',exp:'2026-05-18',expDanger:true,price:'฿45',category:'Herb'})}
        ${productCard({id:103,name:'Free-range eggs',size:'L',exp:'2026-06-04',price:'฿180',category:'Egg'})}
        ${productCard({id:104,name:'Wildflower honey',size:'M',exp:'2027-01-01',price:'฿320',category:'Honey'})}
      </div>
      ${api('GET /api/products?limit=6&amp;offset=0 · infinite scroll')}
      ${callout('Server returns only listings where best_before &gt;= today. Expired rows never reach the client.','⚡ Expiry filter: server hides best_before &lt; today')}
      ${footerMini}
      ${bottomNav}
    `,
    desktop:`
      ${navBarDesktop}
      <div style="padding:32px 64px 0">
        <div class="grid-2" style="gap:32px;align-items:center">
          <div class="stack-12">
            <h1 class="h1" style="font-size:36px">Fresh from your neighbors</h1>
            <div class="small" style="font-size:14px">Buy &amp; swap home-grown produce. Pick up nearby on weekends.</div>
            <div class="row"><button class="btn">Browse Products</button><button class="btn ghost">Become a Seller</button></div>
          </div>
          <div class="img-ph banner"></div>
        </div>
        <div style="margin-top:24px">${pills('All')}</div>
      </div>
      <div class="vv-panel-bg">
        <div class="row between" style="margin-bottom:12px"><div class="h2">Just listed</div></div>
        <div class="grid-4">
          ${productCard({id:101,name:'Cherry tomato',size:'M',exp:'2026-05-20',expDanger:true,price:'฿120',category:'Vegetable'})}
          ${productCard({id:102,name:'Basil bunch',size:'S',exp:'2026-05-18',expDanger:true,price:'฿45',category:'Herb'})}
          ${productCard({id:103,name:'Free-range eggs',size:'L',exp:'2026-06-04',price:'฿180',category:'Egg'})}
          ${productCard({id:104,name:'Wildflower honey',size:'M',exp:'2027-01-01',price:'฿320',category:'Honey'})}
          ${productCard({id:105,name:'Pumpkin',size:'XL',exp:'2026-09-10',price:'฿95',category:'Vegetable'})}
          ${productCard({id:106,name:'Mint',size:'S',exp:'2026-05-22',expDanger:true,price:'฿30',category:'Herb'})}
          ${productCard({id:107,name:'Cucumber',size:'M',exp:'2026-05-30',price:'฿60',category:'Vegetable'})}
          ${productCard({id:108,name:'Strawberry',size:'S',exp:'2026-05-19',expDanger:true,price:'฿220',category:'Fruit'})}
        </div>
      </div>
      <div style="padding:24px 64px">${callout('Server returns only listings where best_before &gt;= today. Expired rows never reach the client.','⚡ Expiry filter: server hides best_before &lt; today')}</div>
      ${footerFull}
    `
  });

  // ============== PAGE 2 — Catalog / Browse ==============
  pages.push({
    id:'p2', name:'Product Catalog / Browse', auth:'public',
    apis:'GET /api/products?category=&size=&min=&max=&keyword=&sort=',
    mobile:`
      ${navBarMobile}
      <div class="surface muted" style="position:sticky;top:0">
        <div class="h3">Filters</div>
        <div class="grid-2" style="margin-top:8px">
          <div class="select">Category: All</div>
          <div class="select">Size: All</div>
        </div>
        <div style="margin-top:8px" class="slider">
          <div class="small mono">Price ฿0 — ฿500</div>
          <div class="track" style="position:relative">
            <div class="thumb" style="left:18%"></div><div class="thumb" style="left:62%"></div>
          </div>
        </div>
        <div class="input" style="margin-top:8px">
          <label>Keyword <span class="small">· debounced 300ms</span></label>
          <div class="field">tomato<span style="margin-left:auto" class="small mono">…typing</span></div>
        </div>
      </div>
      <div class="row" style="flex-wrap:wrap;gap:6px">
        <span class="tag">Category: Vegetable ✕</span>
        <span class="tag">Size: M ✕</span>
        <span class="small" style="margin-left:auto;text-decoration:underline">Clear all</span>
      </div>
      <div class="row between">
        <div class="small mono">24 results</div>
        <div class="select" style="width:160px">Sort: Newest</div>
      </div>
      <div class="grid-2">
        ${productCard({id:109,name:'Tomato',size:'M',exp:'2026-05-20',expDanger:true,price:'฿120',category:'Vegetable'})}
        ${productCard({id:101,name:'Cherry tomato',size:'S',exp:'2026-05-30',price:'฿80',category:'Vegetable'})}
        ${productCard({id:110,name:'Heirloom tomato',size:'L',exp:'2026-06-02',price:'฿180',category:'Vegetable'})}
        ${productCard({id:111,name:'Roma tomato',size:'M',exp:'2026-05-25',price:'฿95',category:'Vegetable'})}
      </div>
      <button class="btn ghost full">Load more</button>
      ${api('GET /api/products?category=vegetable&amp;size=M&amp;keyword=tomato')}
      ${callout('Expired rows excluded server-side; no client-side date filter needed.','⚡ Expiry filter (server)')}
      ${bottomNav}
    `,
    desktop:`
      ${navBarDesktop}
      <div style="display:flex;flex:1">
        <aside class="side-panel">
          <div class="input"><input type="text" class="field vv-filter-input" name="keyword" placeholder="🔍 Search produce"></div>
          <h4>Category</h4>
          <label class="check on"><input type="radio" name="vv-category" value="" class="vv-filter-input" checked><span class="box"></span>All</label>
          <label class="check"><input type="radio" name="vv-category" value="Vegetable" class="vv-filter-input"><span class="box"></span>Vegetable</label>
          <label class="check"><input type="radio" name="vv-category" value="Fruit" class="vv-filter-input"><span class="box"></span>Fruit</label>
          <label class="check"><input type="radio" name="vv-category" value="Herb" class="vv-filter-input"><span class="box"></span>Herb</label>
          <label class="check"><input type="radio" name="vv-category" value="Honey" class="vv-filter-input"><span class="box"></span>Honey</label>
          <label class="check"><input type="radio" name="vv-category" value="Egg" class="vv-filter-input"><span class="box"></span>Egg</label>
          <h4>Size</h4>
          <div class="row" style="flex-wrap:wrap">
            <label class="check"><input type="radio" name="vv-size" value="S" class="vv-filter-input"><span class="box"></span>S</label>
            <label class="check on"><input type="radio" name="vv-size" value="M" class="vv-filter-input" checked><span class="box"></span>M</label>
            <label class="check"><input type="radio" name="vv-size" value="L" class="vv-filter-input"><span class="box"></span>L</label>
            <label class="check"><input type="radio" name="vv-size" value="XL" class="vv-filter-input"><span class="box"></span>XL</label>
          </div>
          <h4>Price range</h4>
          <div class="slider">
            <div class="small mono">฿<span class="vv-min-price">0</span> — ฿<span class="vv-max-price">500</span></div>
            <input type="range" name="minPrice" class="vv-filter-input" min="0" max="500" value="0" style="width:100%">
            <input type="range" name="maxPrice" class="vv-filter-input" min="0" max="500" value="500" style="width:100%">
          </div>
          <h4>Best before</h4>
          <label class="check"><input type="checkbox" name="vv-exp" value="true" class="vv-filter-input"><span class="box"></span>Show expiring soon (&lt;7d)</label>
          <span class="small vv-clear-filters" style="text-decoration:underline;cursor:pointer;margin-top:12px;text-align:center">Clear all</span>
        </aside>
        <div style="flex:1;padding:24px">
          <div class="row between" style="margin-bottom:12px">
            <span class="small mono vv-results-counter">24 results</span>
            <select class="select vv-sort-select" style="width:200px">
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
          <div class="grid-3">
            ${productCard({id:109,name:'Tomato',size:'M',exp:'2026-05-20',expDanger:true,price:'฿120',category:'Vegetable'})}
            ${productCard({id:101,name:'Cherry tomato',size:'S',exp:'2026-05-30',price:'฿80',category:'Vegetable'})}
            ${productCard({id:110,name:'Heirloom tomato',size:'L',exp:'2026-06-02',price:'฿180',category:'Vegetable'})}
            ${productCard({id:111,name:'Roma tomato',size:'M',exp:'2026-05-25',price:'฿95',category:'Vegetable'})}
            ${productCard({id:112,name:'Yellow tomato',size:'S',exp:'2026-06-08',price:'฿110',category:'Vegetable'})}
            ${productCard({name:'Green tomato',size:'M',exp:'2026-06-12',price:'฿70'})}
          </div>
          <div class="row" style="justify-content:center;margin-top:16px">
            <span class="tag vv-page-btn">‹</span><span class="tag vv-page-btn" style="background:#111;color:#fff">1</span><span class="tag vv-page-btn">2</span><span class="tag vv-page-btn">3</span><span class="tag vv-page-btn">…</span><span class="tag vv-page-btn">›</span>
          </div>
          <div style="margin-top:16px">${api('GET /api/products?category=vegetable&amp;size=M&amp;min=0&amp;max=500&amp;keyword=tomato&amp;sort=newest&amp;page=2')}</div>
        </div>
      </div>
      ${footerFull}
    `
  });

  // ============== PAGE 3 — Product Detail ==============
  pages.push({
    id:'p3', name:'Product Detail', auth:'public',
    apis:'GET /api/products/:id · GET /api/products?seller_id=&exclude=:id',
    mobile:`
      ${navBarMobile}
      <img class="img-ph vv-product-hero" src="" alt="">
      <div class="stack-8">
        <div class="h1 vv-product-title"></div>
        <div class="row" style="gap:6px"><span class="badge vv-product-size"></span><span class="tag vv-product-expiry"></span></div>
        <div class="price vv-product-price"></div>
        <div class="row" style="gap:8px">
          <div class="avatar"></div>
          <div>
            <div class="small vv-seller-name" style="font-weight:600;color:var(--ink)">Ploy's Backyard Garden</div>
            <div class="small mono vv-seller-meta">★ 4.8 · 38 reviews</div>
          </div>
        </div>
        <div class="text-lines vv-product-desc"></div>
        <div class="row" style="gap:12px">
          <div class="qty"><span>−</span><span class="n">1</span><span>+</span></div>
          <span class="small mono vv-product-stock"></span>
        </div>
      </div>
      <div class="hr"></div>
      <div class="h3">More from this seller</div>
      <div class="vv-scroll-x">
        <div style="min-width:140px">${productCard({name:'Sungold cherry',size:'S',price:'฿120',exp:'2026-06-04',addBtn:false})}</div>
        <div style="min-width:140px">${productCard({name:'Basil',size:'S',price:'฿45',exp:'2026-05-30',addBtn:false})}</div>
        <div style="min-width:140px">${productCard({name:'Mint',size:'S',price:'฿30',exp:'2026-05-22',addBtn:false,expDanger:true})}</div>
      </div>
      ${api('GET /api/products/:id')}
      <div style="position:sticky;bottom:0;background:#fff;padding-top:12px;border-top:1px solid var(--line);margin:0 -16px;padding:12px 16px">
        <button class="btn full">Add to Cart</button>
      </div>
    `,
    desktop:`
      ${navBarDesktop}
      <div class="vv-page-pad">
        <div class="row small mono" style="color:var(--ink-3);margin-bottom:12px">Home / Vegetable / Tomato / Heirloom — Sungold</div>
        <div style="display:grid;grid-template-columns:60% 40%;gap:32px">
          <div>
            <img class="img-ph vv-product-hero" style="aspect-ratio:4/3;width:100%;object-fit:cover" src="" alt="">
            <div class="row" style="margin-top:12px;gap:8px">
              <div class="img-ph" style="width:80px;aspect-ratio:1/1"></div>
              <div class="img-ph" style="width:80px;aspect-ratio:1/1"></div>
              <div class="img-ph" style="width:80px;aspect-ratio:1/1"></div>
              <div class="img-ph" style="width:80px;aspect-ratio:1/1"></div>
            </div>
          </div>
          <div class="stack-12">
            <div>
              <div class="h1 vv-product-title" style="font-size:28px"></div>
              <div class="row" style="gap:6px;margin-top:6px"><span class="badge vv-product-size"></span><span class="tag vv-product-expiry"></span></div>
            </div>
            <div class="price vv-product-price" style="font-size:32px"></div>
            <div class="surface" style="display:flex;gap:10px;align-items:center">
              <div class="avatar" style="width:36px;height:36px"></div>
              <div>
                <div class="vv-seller-name" style="font-weight:600">Ploy's Backyard Garden</div>
                <div class="small mono vv-seller-meta">★ 4.8 · 38 reviews · Bangkok 10110</div>
              </div>
              <button class="btn ghost sm" style="margin-left:auto">View profile</button>
            </div>
            <div class="text-lines vv-product-desc"></div>
            <div class="row" style="gap:12px"><div class="qty"><span>−</span><span class="n">1</span><span>+</span></div><span class="small mono vv-product-stock"></span></div>
            <div class="row" style="gap:8px"><button class="btn">Add to Cart</button><button class="btn ghost">♡ Save to wishlist</button></div>
            ${api('GET /api/products/:id')}
          </div>
        </div>
        <div style="margin-top:32px">
          <div class="h2" style="margin-bottom:12px">More from Ploy's Backyard Garden</div>
          <div class="grid-4">
            ${productCard({name:'Sungold cherry',size:'S',price:'฿120',exp:'2026-06-04'})}
            ${productCard({name:'Basil',size:'S',price:'฿45',exp:'2026-05-30'})}
            ${productCard({name:'Mint',size:'S',price:'฿30',exp:'2026-05-22',expDanger:true})}
            ${productCard({name:'Cilantro',size:'S',price:'฿35',exp:'2026-05-28'})}
          </div>
        </div>
      </div>
      ${footerFull}
    `
  });

  // ============== PAGE 4 — Register ==============
  pages.push({
    id:'p4', name:'Register', auth:'public',
    apis:'POST /api/auth/register',
    mobile:`
      ${navBarMobileLogoOnly}
      <div class="surface stack-12">
        <div class="h1">Create account</div>
        <div class="input"><label>Full name *</label><div class="field">Somchai Jaidee</div></div>
        <div class="input ok"><label>Email *</label><div class="field">somchai@example.com</div></div>
        <div class="input"><label>Password *</label><div class="field">••••••••<span style="margin-left:auto" class="small">show</span></div></div>
        <div class="input error"><label>Confirm password *</label><div class="field">••••••<span style="margin-left:auto" class="small">show</span></div><div class="help" style="color:var(--error)">Passwords do not match</div></div>
        <div class="input"><label>I am a *</label><div class="select">Buyer</div></div>
        <button class="btn full">Create account</button>
        <div class="row" style="justify-content:center"><span class="small">— or —</span></div>
        <div class="small vv-center">Already have an account? <b>Login</b></div>
      </div>
      ${api('POST /api/auth/register { name, email, password, role }')}
      ${callout('Role enum: buyer | seller. Admin accounts created out-of-band by DB seed.','⚡ Role validation: enum check before INSERT')}
      ${callout('Email must be unique; bcrypt-hash password before storing in MySQL.','⚡ Unique email + password hash')}
    `,
    desktop:`
      ${navBarDesktop}
      <div class="vv-auth-viewport">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:64px; width:100%; max-width:960px">
          <div style="flex:1 1 400px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center">
            <div class="h1" style="font-size:28px">Welcome to Veggie Ville</div>
            <div style="color:var(--ink-2);margin-top:12px;font-size:15px;line-height:1.6">Fresh, local produce delivered straight from the farm to your table.</div>
          </div>
          <div style="flex:1 1 400px; display:flex; justify-content:center">
            <div class="surface stack-12 vv-max-420" style="width:100%">
              <div class="h1">Create account</div>
              <div class="input"><label>Full name *</label><div class="field">Somchai Jaidee</div></div>
              <div class="input ok"><label>Email *</label><div class="field">somchai@example.com</div></div>
              <div class="grid-2">
                <div class="input"><label>Password *</label><div class="field">••••••••</div></div>
                <div class="input error"><label>Confirm *</label><div class="field">••••••</div><div class="help" style="color:var(--error)">Mismatch</div></div>
              </div>
              <div class="input"><label>I am a *</label><div class="select">Buyer</div></div>
              <button class="btn full">Create account</button>
              <div class="row" style="justify-content:center"><span class="small">— or —</span></div>
              <div class="small vv-center">Already have an account? <b>Login</b></div>
              ${api('POST /api/auth/register')}
            </div>
          </div>
        </div>
      </div>

    `
  });

  // ============== PAGE 5 — Login ==============
 pages.push({
    id:'p5', name:'Login', auth:'public',
    mobile:`
      ${navBarMobile}
      <div class="vv-auth-viewport">
        <div class="surface stack-12 vv-max-420">
          <div class="h1">Welcome back</div>
          <div class="input"><label>Email *</label><input type="email" id="login-email-mobile" class="field" placeholder="somchai@example.com" /></div>
          <div class="input"><label>Password *</label><div style="position:relative;display:flex"><input type="password" id="login-pass-mobile" class="field" placeholder="••••" style="width:100%;padding-right:44px" /><span class="vv-pwd-toggle small" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;font-weight:600;user-select:none">Show</span></div></div>
          <span class="small" style="text-align:right;text-decoration:underline;cursor:pointer;display:block" data-route="/login">Forgot password?</span>
          <button id="btn-submit-login-mobile" class="btn full">Login</button>
          <div class="small" style="text-align:center;color:var(--ink-3)">— or —</div>
          <div class="small vv-center">New here? <span data-route="/register" style="font-weight:700;cursor:pointer;text-decoration:underline">Create account</span></div>
        </div>
      </div>
    `,
    desktop:`
      ${navBarDesktop}
      <div class="vv-auth-viewport">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:64px; width:100%; max-width:960px">
          <div style="flex:1 1 400px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center">
            <div class="h1" style="font-size:28px">Welcome to Veggie Ville</div>
            <div style="color:var(--ink-2);margin-top:12px;font-size:15px;line-height:1.6">Fresh, local produce delivered straight from the farm to your table.</div>
          </div>
          <div style="flex:1 1 400px; display:flex; justify-content:center">
            <div class="surface stack-12 vv-max-420" style="width:100%">
              <div class="h1">Login</div>
              <div class="input"><label>Email *</label><input type="email" id="login-email-desktop" class="field" placeholder="somchai@example.com" /></div>
              <div class="input"><label>Password *</label><div style="position:relative;display:flex"><input type="password" id="login-pass-desktop" class="field" placeholder="••••" style="width:100%;padding-right:44px" /><span class="vv-pwd-toggle small" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;font-weight:600;user-select:none">Show</span></div></div>
              <span class="small" style="text-align:right;text-decoration:underline;cursor:pointer;display:block" data-route="/login">Forgot password?</span>
              <button id="btn-submit-login-desktop" class="btn full">Login</button>
              <div class="small" style="text-align:center;color:var(--ink-3)">— or —</div>
              <div class="small vv-center">New here? <span data-route="/register" style="font-weight:700;cursor:pointer;text-decoration:underline">Create account</span></div>
            </div>
          </div>
        </div>
      </div>
    `
  });
  
  // ============== PAGE 6 — Cart ==============
  pages.push({
    id:'p6', name:'Cart', auth:'buyer',
    apis:'GET /api/cart · GET /api/pickup-slots · PUT /api/cart/:id',
    mobile:`
      ${navBarMobile}
      <div class="row between"><div class="h1">My cart</div><span class="small mono">3 items</span></div>
      ${callout('Route requires JWT. Anonymous users redirected to /login.','🔒 Auth gate: buyer or higher')}
      <div class="stack-12">
        ${[1,2,3].map(i=>`
          <div class="surface" style="display:grid;grid-template-columns:60px 1fr auto;gap:10px;align-items:center">
            <div class="img-ph" style="width:60px;aspect-ratio:1/1">60</div>
            <div>
              <div style="font-weight:600;font-size:13px">${['Heirloom tomato','Basil bunch','Free-range eggs'][i-1]}</div>
              <div class="row" style="gap:4px;margin-top:4px"><span class="badge">${['M','S','L'][i-1]}</span><span class="tag ${i===2?'danger':''}">⏳ ${['2026-06-02','2026-05-18','2026-06-04'][i-1]}</span></div>
              <div class="row" style="gap:8px;margin-top:6px"><div class="qty"><span>−</span><span class="n">${i}</span><span>+</span></div><span class="small">฿${[180,45,180][i-1]} ea.</span></div>
            </div>
            <div class="vv-right"><div style="font-weight:700">฿${i*[180,45,180][i-1]}</div><div class="small" style="text-decoration:underline">🗑 remove</div></div>
          </div>
        `).join('')}
      </div>
      ${callout('Expired item warning: Basil bunch ends in 2 days. Add anyway, but flagged at checkout.','⚠ Expiring soon (&lt;7d)','error')}
      <div class="hr"></div>
      <div class="surface stack-8" style="border-color:#111">
        <div class="h2">Select pickup window *</div>
        <div class="select">Sat 1 Jun, 09:00–12:00 (5 slots left)</div>
        <div class="small" style="color:var(--ink-2)">Pickup window required before checkout</div>
      </div>
      ${callout('Cart cannot proceed to checkout until pickup_slot_id is set. Button is disabled state.','⚡ Pickup slot required before checkout enabled')}
      <div class="hr"></div>
      <div class="surface stack-8">
        <div class="row between"><span>Subtotal</span><span class="mono">฿765</span></div>
        <div class="row between"><span>Service fee</span><span class="mono">฿20</span></div>
        <div class="row between" style="font-weight:700"><span>Total</span><span class="mono">฿785</span></div>
      </div>
      <button class="btn full">Proceed to checkout</button>
      <button class="btn full disabled">Proceed to checkout (select pickup first)</button>
      ${api('PUT /api/cart/:id · POST /api/orders { pickup_slot_id, items }')}
    `,
    desktop:`
      ${navBarDesktop}
      <div style="padding:32px 64px;display:grid;grid-template-columns:65% 35%;gap:24px">
        <div>
          <div class="h1" style="margin-bottom:12px">My cart (3 items)</div>
          ${callout('Route requires JWT. Anonymous users redirected to /login.','🔒 Auth gate: buyer or higher')}
          <table class="tbl" style="margin-top:12px">
            <thead><tr><th></th><th>Item</th><th>Size</th><th>Expiry</th><th>Qty</th><th>Price</th><th></th></tr></thead>
            <tbody>
              ${[
                ['Heirloom tomato','M','2026-06-02',1,180,false],
                ['Basil bunch','S','2026-05-18',2,45,true],
                ['Free-range eggs','L','2026-06-04',3,180,false],
              ].map(r=>`
              <tr>
                <td><div class="img-ph" style="width:48px;height:48px;aspect-ratio:1/1"></div></td>
                <td><div style="font-weight:600">${r[0]}</div><div class="small mono">SKU-${String(r[0]).replace(/[^A-Z0-9]/g,'-').slice(0,8)}</div></td>
                <td><span class="badge">${r[1]}</span></td>
                <td><span class="tag ${r[5]?'danger':''}">⏳ ${r[2]}</span></td>
                <td><div class="qty"><span>−</span><span class="n">${r[3]}</span><span>+</span></div></td>
                <td class="mono">฿${r[3]*r[4]}</td>
                <td><span class="small" style="text-decoration:underline">🗑</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
          ${callout('Expired item warning: Basil bunch ends in 2 days. Flagged at checkout.','⚠ Expiring soon (&lt;7d)','error')}
        </div>
        <div class="stack-12">
          <div class="surface stack-8" style="border-color:#111">
            <div class="h2">Select pickup window *</div>
            <div class="select">Sat 1 Jun, 09:00–12:00 (5 slots left)</div>
            <div class="small">Pickup window required before checkout</div>
            ${api('GET /api/pickup-slots?available=true')}
          </div>
          ${callout('Cart cannot proceed until pickup_slot_id is set.','⚡ Pickup slot required before checkout enabled')}
          <div class="surface stack-8">
            <div class="h2">Order summary</div>
            <div class="row between"><span>Subtotal</span><span class="mono">฿765</span></div>
            <div class="row between"><span>Service fee</span><span class="mono">฿20</span></div>
            <div class="hr"></div>
            <div class="row between" style="font-weight:700;font-size:16px"><span>Total</span><span class="mono">฿785</span></div>
            <button class="btn full">Proceed to checkout</button>
            <button class="btn full disabled">Disabled state (no slot)</button>
          </div>
        </div>
      </div>
      ${footerFull}
    `
  });

  // ============== PAGE 7 — Checkout ==============
  pages.push({
    id:'p7', name:'Checkout / Order Confirmation', auth:'buyer',
    apis:'POST /api/orders · GET /api/orders/:id',
    mobile:`
      ${navBarMobile}
      <div class="step-ind">
        <span class="s done">1</span>Cart
        <span style="color:var(--line)">———</span>
        <span class="s on">2</span>Checkout
        <span style="color:var(--line)">———</span>
        <span class="s">3</span>Done
      </div>
      <div class="surface">
        <div class="row between"><div class="h3">Order summary</div><span class="small">▾ expand</span></div>
        <div class="small mono" style="margin-top:4px;color:var(--ink-3)">3 items · ฿765</div>
      </div>
      <div class="surface stack-8">
        <div class="h3">Pickup details</div>
        <div class="row between"><span class="small mono">Sat 1 Jun, 09:00–12:00</span><span class="small" style="text-decoration:underline">Change</span></div>
      </div>
      <div class="surface stack-8">
        <div class="h3">Contact info</div>
        <div class="input"><label>Name *</label><div class="field">Somchai Jaidee</div></div>
        <div class="input"><label>Phone *</label><div class="field">+66 81 234 5678</div></div>
      </div>
      <div class="surface stack-8">
        <div class="h3">Payment</div>
        <div class="callout"><span class="pin">⚡</span><div><span class="lbl">Demo mode</span>Payment bypassed for this version. Order is created with payment_status='demo'.</div></div>
        <span class="badge">DEMO MODE</span>
      </div>
      <button class="btn full">Place order</button>
      ${api('POST /api/orders { items, pickup_slot_id, contact }')}
      ${callout('seller_id and buyer_id are derived from JWT server-side. Never read these fields from the form payload.','⚡ seller_id / buyer_id from JWT — never from form')}
      <div class="hr"></div>
      <div class="surface" style="text-align:center;padding:24px">
        <div style="font-size:36px">✓</div>
        <div class="h1" style="margin-top:8px">Order placed!</div>
        <div class="small mono" style="margin-top:4px">ORD-20260601-001</div>
        <div class="small" style="margin-top:8px">Pickup: Sat 1 Jun, 09:00–12:00</div>
        <div class="stack-8" style="margin-top:16px">
          <button class="btn full">View my orders</button>
          <button class="btn ghost full">Continue shopping</button>
        </div>
      </div>
    `,
    desktop:`
      ${navBarDesktop}
      <div class="vv-page-pad">
        <div class="step-ind" style="margin-bottom:24px">
          <span class="s done">1</span>Cart
          <span style="color:var(--line)">———</span>
          <span class="s on">2</span>Checkout
          <span style="color:var(--line)">———</span>
          <span class="s">3</span>Done
        </div>
        <div style="display:grid;grid-template-columns:60% 40%;gap:24px">
          <div class="stack-12">
            <div class="surface stack-8">
              <div class="h2">Pickup details</div>
              <div class="row between"><span class="mono">Sat 1 Jun, 09:00–12:00</span><span class="small" style="text-decoration:underline">Change slot</span></div>
            </div>
            <div class="surface stack-8">
              <div class="h2">Contact info</div>
              <div class="grid-2">
                <div class="input"><label>Name *</label><div class="field">Somchai Jaidee</div></div>
                <div class="input"><label>Phone *</label><div class="field">+66 81 234 5678</div></div>
              </div>
            </div>
            <div class="surface stack-8">
              <div class="h2">Payment</div>
              ${callout("Payment bypassed for this version. payment_status='demo' on the row.",'⚡ Demo mode')}
              <span class="badge">DEMO MODE</span>
            </div>
            ${callout('seller_id / buyer_id derived from JWT — never trusted from form payload.','⚡ Trust boundary')}
          </div>
          <div class="stack-12" style="position:sticky;top:0;align-self:start">
            <div class="surface stack-8">
              <div class="h2">Order summary</div>
              ${[['Heirloom tomato','M',1,180],['Basil bunch','S',2,90],['Free-range eggs','L',3,540]].map(r=>`
                <div class="row between"><span class="small">${r[0]} <span class="badge">${r[1]}</span> ×${r[2]}</span><span class="mono">฿${r[3]}</span></div>`).join('')}
              <div class="hr"></div>
              <div class="row between"><span>Subtotal</span><span class="mono">฿765</span></div>
              <div class="row between"><span>Service fee</span><span class="mono">฿20</span></div>
              <div class="row between" style="font-weight:700"><span>Total</span><span class="mono">฿785</span></div>
              <button class="btn full">Place order</button>
              ${api('POST /api/orders')}
            </div>
            <div class="surface" style="text-align:center;border:1.5px dashed var(--success)">
              <div class="small mono" style="color:var(--success)">SUCCESS STATE (replaces form)</div>
              <div style="font-size:32px;margin-top:8px">✓</div>
              <div class="h2">Order placed!</div>
              <div class="small mono">ORD-20260601-001</div>
              <div class="row" style="gap:8px;justify-content:center;margin-top:8px"><button class="btn sm">View orders</button><button class="btn ghost sm">Keep shopping</button></div>
            </div>
          </div>
        </div>
      </div>
      ${footerFull}
    `
  });

  // ============== PAGE 8 — My Orders ==============
  pages.push({
    id:'p8', name:'My Orders', auth:'buyer',
    apis:'GET /api/orders?buyer_id=me&status=',
    mobile:`
      ${navBarMobile}
      <div class="h1">My orders</div>
      <div class="tabs"><div class="t active">All</div><div class="t">Confirmed</div><div class="t">Cancelled</div></div>
      <div class="stack-12">
        ${[
          ['ORD-20260601-001','01 Jun 2026','Confirmed','Sat 1 Jun, 09:00–12:00',785,3],
          ['ORD-20260525-014','25 May 2026','Confirmed','Sun 26 May, 13:00–15:00',230,2],
          ['ORD-20260518-007','18 May 2026','Cancelled','Sun 19 May, 09:00–12:00',410,4],
        ].map(o=>`
          <div class="surface stack-8">
            <div class="row between"><span class="mono small">${o[0]}</span><span class="badge" style="${o[2]==='Cancelled'?'color:var(--error);border-color:var(--error)':''}">${o[2]}</span></div>
            <div class="small">${o[1]}</div>
            <div class="small">Pickup: <b>${o[3]}</b></div>
            <div class="row" style="gap:6px">
              ${Array.from({length:Math.min(3,o[5])}).map(()=>`<div class="img-ph" style="width:36px;height:36px;aspect-ratio:1/1">[]</div>`).join('')}
              ${o[5]>3?`<span class="small mono">+${o[5]-3} more</span>`:''}
            </div>
            <div class="row between"><span class="small">Total</span><span class="mono" style="font-weight:700">฿${o[4]}</span></div>
            <button class="btn ghost sm">View details</button>
          </div>`).join('')}
      </div>
      ${api('GET /api/orders?buyer_id=me')}
      ${bottomNav}
    `,
    desktop:`
      ${navBarDesktop}
      <div class="vv-page-pad">
        <div class="row between" style="margin-bottom:12px"><div class="h1">My orders</div><div class="tabs"><div class="t active">All</div><div class="t">Confirmed</div><div class="t">Cancelled</div></div></div>
        <div class="surface" style="padding:0;overflow:hidden">
          <table class="tbl">
            <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Pickup slot</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${[
                ['ORD-20260601-001','01 Jun 2026',3,'Sat 1 Jun, 09:00–12:00',785,'Confirmed'],
                ['ORD-20260525-014','25 May 2026',2,'Sun 26 May, 13:00–15:00',230,'Confirmed'],
                ['ORD-20260518-007','18 May 2026',4,'Sun 19 May, 09:00–12:00',410,'Cancelled'],
                ['ORD-20260510-022','10 May 2026',1,'Sat 11 May, 10:00–12:00',120,'Confirmed'],
              ].map(r=>`
              <tr>
                <td class="mono">${r[0]}</td>
                <td>${r[1]}</td>
                <td>${r[2]} items</td>
                <td>${r[3]}</td>
                <td class="mono">฿${r[4]}</td>
                <td><span class="badge" style="${r[5]==='Cancelled'?'color:var(--error);border-color:var(--error)':''}">${r[5]}</span></td>
                <td><button class="btn ghost sm">View</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="row" style="justify-content:center;margin-top:16px">
          <span class="tag">‹</span><span class="tag" style="background:#111;color:#fff">1</span><span class="tag">2</span><span class="tag">3</span><span class="tag">›</span>
        </div>
        ${api('GET /api/orders?buyer_id=me&amp;status=&amp;page=1')}
        ${callout('JWT required. Orders filtered to current buyer server-side.','🔒 JWT required')}
      </div>
      ${footerFull}
    `
  });

  // ============== PAGE 9 — Seller Dashboard ==============
  pages.push({
    id:'p9', name:'Seller Dashboard', auth:'seller',
    apis:'GET /api/products · GET /api/orders · seller view filters client-side by JWT user id',
    mobile:`
      ${navBarMobile}
      <div class="h1">Seller dashboard</div>
      ${callout('Requires role=seller in JWT claims. Buyer-only accounts see upgrade prompt.','🔒 Auth gate: seller role required')}
      <div class="vv-scroll-x">
        <div class="stat" style="min-width:140px"><div class="k">Listings</div><div class="v">12</div></div>
        <div class="stat" style="min-width:140px"><div class="k">Active</div><div class="v">9</div></div>
        <div class="stat" style="min-width:140px"><div class="k">Expiring &lt;7d</div><div class="v">3</div></div>
        <div class="stat" style="min-width:140px"><div class="k">Sales (30d)</div><div class="v">฿8.4k</div></div>
      </div>
      <div class="tabs"><div class="t active">My listings</div><div class="t">Orders received</div></div>
      <div class="stack-12">
        ${[
          ['Heirloom tomato','M','2026-06-02',180,12,false],
          ['Basil bunch','S','2026-05-18',45,30,true],
          ['Free-range eggs','L','2026-06-04',180,24,false],
        ].map(r=>`
          <div class="surface" style="display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center">
            <div class="img-ph" style="width:56px;aspect-ratio:1/1"></div>
            <div>
              <div style="font-weight:600;font-size:13px">${r[0]}</div>
              <div class="row" style="gap:4px;margin-top:4px"><span class="badge">${r[1]}</span><span class="tag ${r[5]?'danger':''}">⏳ ${r[2]}</span></div>
              <div class="small mono">฿${r[3]} · stock ${r[4]}</div>
            </div>
            <div class="col" style="gap:6px"><button class="btn ghost sm">Edit</button><button class="btn danger sm">🗑</button></div>
          </div>`).join('')}
      </div>
      <div class="fab">+</div>
      ${api('GET /api/products')}
      ${bottomNav}
    `,
    desktop:`
      ${navBarDesktop}
      <div style="display:flex">
        <aside class="side-panel">
          <h4>Seller</h4>
          <div class="check on"><span class="box"></span>Dashboard</div>
          <div class="check"><span class="box"></span>My listings</div>
          <div class="check"><span class="box"></span>Orders</div>
          <div class="check"><span class="box"></span>Settings</div>
        </aside>
        <div style="flex:1;padding:24px">
          <div class="row between" style="margin-bottom:12px"><div class="h1">Seller dashboard</div><button class="btn">+ Add new listing</button></div>
          ${callout('JWT must contain role=seller. Else 403.','🔒 Seller role required')}
          <div class="grid-4" style="margin-top:12px">
            <div class="stat"><div class="k">Total listings</div><div class="v">12</div><div class="d">+2 this week</div></div>
            <div class="stat"><div class="k">Active</div><div class="v">9</div></div>
            <div class="stat"><div class="k">Expiring &lt;7d</div><div class="v" style="color:var(--error)">3</div><div class="d">Action needed</div></div>
            <div class="stat"><div class="k">Sales (30d)</div><div class="v">฿8,420</div></div>
          </div>
          <div class="tabs" style="margin-top:16px"><div class="t active">My listings</div><div class="t">Orders received</div></div>
          <div class="surface" style="padding:0;overflow:hidden;margin-top:12px">
            <table class="tbl">
              <thead><tr><th></th><th>Name</th><th>Size</th><th>Price</th><th>Stock</th><th>Best before</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${[
                  ['Heirloom tomato','M',180,12,'2026-06-02','Active',false],
                  ['Basil bunch','S',45,30,'2026-05-18','Expiring',true],
                  ['Free-range eggs','L',180,24,'2026-06-04','Active',false],
                  ['Wildflower honey','M',320,8,'2027-01-01','Active',false],
                  ['Mint','S',30,18,'2026-05-22','Expiring',true],
                ].map(r=>`
                <tr>
                  <td><div class="img-ph" style="width:48px;height:48px;aspect-ratio:1/1"></div></td>
                  <td><div style="font-weight:600">${r[0]}</div></td>
                  <td><span class="badge">${r[1]}</span></td>
                  <td class="mono">฿${r[2]}</td>
                  <td class="mono">${r[3]}</td>
                  <td><span class="tag ${r[6]?'danger':''}">⏳ ${r[4]}</span></td>
                  <td><span class="badge" style="${r[6]?'color:var(--error);border-color:var(--error)':''}">${r[5]}</span></td>
                  <td><button class="btn ghost sm">Edit</button> <button class="btn danger sm">🗑</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          ${api('GET /api/products')}
        </div>
      </div>
      ${footerFull}
    `
  });

  // ============== PAGE 10 — Create / Edit Listing ==============
  pages.push({
    id:'p10', name:'Create / Edit Listing', auth:'seller',
    apis:'POST /api/products · PUT /api/products/:id',
    mobile:`
      ${navBarMobile}
      <div class="h1">New listing</div>
      <div class="stack-12">
        <div class="input"><label>Product name *</label><div class="field">Heirloom tomato — Sungold</div></div>
        <div class="input"><label>Description</label><div class="field" style="height:64px;align-items:flex-start;padding:8px 10px">Sweet, golden cherry tomatoes…</div></div>
        <div class="grid-2">
          <div class="input"><label>Price (฿) *</label><div class="field">180</div></div>
          <div class="input"><label>Quantity *</label><div class="field">12</div></div>
        </div>
        <div class="grid-2">
          <div class="input"><label>Size *</label><div class="select">M</div></div>
          <div class="input"><label>Category *</label><div class="select">Vegetable</div></div>
        </div>
        <div class="input error">
          <label>Best before *</label>
          <div class="field">2026-05-10 📅</div>
          <div class="help" style="color:var(--error)">Must be a future date</div>
        </div>
        ${callout("size ENUM = ('S','M','L','XL') validated before INSERT INTO products.",'⚡ size ENUM validated before MySQL')}
        ${callout('best_before must be &gt; CURRENT_DATE. Else 422. Products past this date are auto-hidden from /api/products.','⚡ Future-date constraint')}
        <div class="input">
          <label>Photo</label>
          <div class="img-ph upload" style="aspect-ratio:4/3">📷  Tap to upload</div>
        </div>
        <button class="btn full">Save listing</button>
        <button class="btn ghost full">Cancel</button>
      </div>
      ${api('POST /api/products { name, description, price, quantity, size, category, best_before }')}
      ${callout('seller_id pulled from JWT server-side — ignored if present in form body.','⚡ seller_id from JWT — never from form')}
    `,
    desktop:`
      ${navBarDesktop}
      <div class="vv-page-pad">
        <div class="row between" style="margin-bottom:16px"><div class="h1">New listing</div><div class="row"><button class="btn ghost">Cancel</button><button class="btn">Save listing</button></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <div class="stack-12">
            <div class="input"><label>Product name *</label><div class="field">Heirloom tomato — Sungold</div></div>
            <div class="input"><label>Description</label><div class="field" style="height:96px;align-items:flex-start;padding:8px 10px">Sweet, golden cherry tomatoes…</div></div>
            <div class="grid-2">
              <div class="input"><label>Price (฿) *</label><div class="field">180</div></div>
              <div class="input"><label>Quantity *</label><div class="field">12</div></div>
            </div>
            <div class="grid-2">
              <div class="input"><label>Size *</label><div class="select">M</div></div>
              <div class="input"><label>Category *</label><div class="select">Vegetable</div></div>
            </div>
            <div class="input error">
              <label>Best before *</label>
              <div class="field">2026-05-10 📅</div>
              <div class="help" style="color:var(--error)">Must be a future date</div>
            </div>
            ${callout("size ENUM = ('S','M','L','XL') validated before INSERT.",'⚡ size ENUM validated before MySQL')}
            ${callout('seller_id pulled from JWT server-side — never from form body.','⚡ seller_id from JWT')}
          </div>
          <div class="stack-12">
            <div class="input"><label>Photo</label><div class="img-ph upload" style="aspect-ratio:4/3">📷  Drag a file here or click to upload</div></div>
            <div class="surface stack-8">
              <div class="small mono" style="color:var(--ink-3)">LIVE PREVIEW — how buyers will see it</div>
              ${productCard({name:'Heirloom tomato — Sungold',size:'M',exp:'2026-05-10',expDanger:true,price:'฿180'})}
            </div>
            ${api('POST /api/products (JSON)')}
          </div>
        </div>
      </div>
      ${footerFull}
    `
  });

  // ============== PAGE 11 — Admin Dashboard ==============
  pages.push({
    id:'p11', name:'Admin Dashboard', auth:'admin',
    apis:'GET /api/admin/users/stats · GET /api/admin/orders · GET /api/admin/users',
    mobile:`
      ${navBarMobile.replace('🛒','👑')}
      <div class="row" style="gap:6px"><div class="h1">Admin</div><span class="badge" style="background:#111;color:#fff;border-color:#111">ADMIN</span></div>
      ${callout('Requires role=admin in JWT. All other roles → 403.','👑 Admin role required')}
      <div class="vv-scroll-x">
        <div class="stat" style="min-width:140px"><div class="k">Total users</div><div class="v">1,284</div></div>
        <div class="stat" style="min-width:140px"><div class="k">Active listings</div><div class="v">312</div></div>
        <div class="stat" style="min-width:140px"><div class="k">Orders today</div><div class="v">48</div></div>
        <div class="stat" style="min-width:140px"><div class="k">Expiring &lt;7d</div><div class="v" style="color:var(--error)">22</div></div>
      </div>
      <div class="stack-8">
        <button class="btn full ghost">Manage users</button>
        <button class="btn full ghost">Manage pickup slots</button>
        <button class="btn full ghost">View all orders</button>
      </div>
      <div class="h2">Recent orders</div>
      <div class="stack-8">
        ${[
          ['ORD-20260601-001','Somchai J.',785,'Confirmed'],
          ['ORD-20260601-002','Niran P.',310,'Confirmed'],
          ['ORD-20260531-018','Mali T.',520,'Cancelled'],
          ['ORD-20260531-017','Anon B.',180,'Confirmed'],
          ['ORD-20260531-016','Lek S.',240,'Confirmed'],
        ].map(r=>`
          <div class="surface" style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
            <div><div class="mono small">${r[0]}</div><div class="small">${r[1]}</div></div>
            <div class="vv-right"><div class="mono">฿${r[2]}</div><span class="badge" style="${r[3]==='Cancelled'?'color:var(--error);border-color:var(--error)':''}">${r[3]}</span></div>
          </div>`).join('')}
      </div>
      ${api('GET /api/admin/orders?limit=5')}
    `,
    desktop:`
      ${navBarDesktopAdmin}
      <div style="display:flex">
        <aside class="side-panel">
          <h4>Admin</h4>
          <div class="check on"><span class="box"></span>Overview</div>
          <div class="check"><span class="box"></span>Users</div>
          <div class="check"><span class="box"></span>Products</div>
          <div class="check"><span class="box"></span>Pickup slots</div>
          <div class="check"><span class="box"></span>Orders</div>
          <div class="check"><span class="box"></span>Reports</div>
        </aside>
        <div style="flex:1;padding:24px">
          <div class="h1" style="margin-bottom:8px">Overview</div>
          ${callout('Requires role=admin in JWT. All other roles → 403.','👑 Admin role required')}
          <div class="grid-2" style="margin-top:12px;max-width:680px">
            <div class="stat"><div class="k">Total users</div><div class="v">1,284</div><div class="d">+34 this week</div></div>
            <div class="stat"><div class="k">Active listings</div><div class="v">312</div><div class="d">+12 today</div></div>
            <div class="stat"><div class="k">Orders today</div><div class="v">48</div><div class="d">฿18,420 GMV</div></div>
            <div class="stat"><div class="k">Expiring &lt;7d</div><div class="v" style="color:var(--error)">22</div><div class="d">Auto-hide pending</div></div>
          </div>
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:24px">
            <div>
              <div class="h2" style="margin-bottom:8px">Recent orders</div>
              <div class="surface" style="padding:0;overflow:hidden">
                <table class="tbl">
                  <thead><tr><th>Order #</th><th>Buyer</th><th>Total</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    ${[
                      ['ORD-20260601-001','Somchai J.',785,'Confirmed'],
                      ['ORD-20260601-002','Niran P.',310,'Confirmed'],
                      ['ORD-20260531-018','Mali T.',520,'Cancelled'],
                      ['ORD-20260531-017','Anon B.',180,'Confirmed'],
                      ['ORD-20260531-016','Lek S.',240,'Confirmed'],
                    ].map(r=>`<tr><td class="mono small">${r[0]}</td><td>${r[1]}</td><td class="mono">฿${r[2]}</td><td><span class="badge" style="${r[3]==='Cancelled'?'color:var(--error);border-color:var(--error)':''}">${r[3]}</span></td><td><button class="btn ghost sm">View</button></td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
              <div class="h2" style="margin:24px 0 8px">Expiring soon products</div>
              <div class="grid-3">
                ${productCard({name:'Basil bunch',size:'S',exp:'2026-05-18',expDanger:true,price:'฿45'})}
                ${productCard({name:'Mint',size:'S',exp:'2026-05-22',expDanger:true,price:'฿30'})}
                ${productCard({name:'Strawberry',size:'S',exp:'2026-05-19',expDanger:true,price:'฿220'})}
              </div>
            </div>
            <div>
              <div class="h2" style="margin-bottom:8px">New users</div>
              <div class="surface stack-8">
                ${[
                  ['Somchai J.','buyer','2 hr ago'],
                  ['Niran P.','seller','5 hr ago'],
                  ['Mali T.','buyer','yesterday'],
                  ['Lek S.','buyer','yesterday'],
                ].map(r=>`<div class="row between"><div><div style="font-weight:600;font-size:12px">${r[0]}</div><div class="small mono">${r[1]}</div></div><span class="small">${r[2]}</span></div>`).join('')}
              </div>
              ${api('GET /api/admin/users?recent=true')}
            </div>
          </div>
        </div>
      </div>
    `
  });

  // ============== PAGE 12 — Admin Manage Pickup Slots ==============
  pages.push({
    id:'p12', name:'Admin · Manage Pickup Slots', auth:'admin',
    apis:'GET /api/pickup-slots · POST /api/pickup-slots · DELETE /api/pickup-slots/:id',
    mobile:`
      ${navBarMobile.replace('🛒','👑')}
      <div class="h1">Pickup slots</div>
      ${callout('Admin only. Slots are shared resource for all sellers/buyers.','👑 Admin role required')}
      <button class="btn full">+ Add new slot</button>
      <div class="stack-12">
        ${[
          ['Sat 1 Jun 2026','09:00–12:00',10,5],
          ['Sat 1 Jun 2026','13:00–15:00',8,8],
          ['Sun 2 Jun 2026','09:00–12:00',10,3],
        ].map(s=>`
          <div class="surface stack-8">
            <div class="row between"><b>${s[0]}</b><span class="mono">${s[1]}</span></div>
            <div class="row between small"><span>Max ${s[2]} · Booked ${s[3]}</span><span>${s[2]-s[3]} left</span></div>
            <div class="progress"><div class="bar" style="width:${(s[3]/s[2])*100}%"></div></div>
            <button class="btn danger sm" style="align-self:flex-start">Delete</button>
          </div>`).join('')}
      </div>
      <div class="modal-overlay">
        <div class="surface stack-8">
          <div class="h3">Add slot</div>
          <div class="input"><label>Date *</label><div class="field">2026-06-08 📅</div></div>
          <div class="grid-2">
            <div class="input ok"><label>Start *</label><div class="field">09:00</div></div>
            <div class="input ok"><label>End *</label><div class="field">12:00</div></div>
          </div>
          <div class="callout ok" style="background:#F1F8F1"><span class="pin">✓</span><div><span class="lbl">VALIDATION</span>end &gt; start</div></div>
          <div class="callout error"><span class="pin">✗</span><div><span class="lbl">EXAMPLE — INVALID</span>end (08:00) &lt; start (09:00)</div></div>
          <div class="input"><label>Max orders *</label><div class="field">10</div></div>
          <div class="row" style="gap:8px"><button class="btn">Create slot</button><button class="btn ghost">Cancel</button></div>
        </div>
      </div>
      ${api('POST /api/pickup-slots { slot_start, slot_end, max_orders }')}
    `,
    desktop:`
      ${navBarDesktopAdmin}
      <div style="display:flex">
        <aside class="side-panel">
          <h4>Admin</h4>
          <div class="check"><span class="box"></span>Overview</div>
          <div class="check"><span class="box"></span>Users</div>
          <div class="check"><span class="box"></span>Products</div>
          <div class="check on"><span class="box"></span>Pickup slots</div>
          <div class="check"><span class="box"></span>Orders</div>
        </aside>
        <div style="flex:1;padding:24px;display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start">
          <div>
            <div class="row between" style="margin-bottom:8px"><div class="h1">Pickup slots</div></div>
            ${callout('Admin only.','👑 Admin role required')}
            <div class="surface" style="padding:0;overflow:hidden;margin-top:12px">
              <table class="tbl">
                <thead><tr><th>Date</th><th>Time</th><th>Max</th><th>Booked</th><th>Available</th><th></th></tr></thead>
                <tbody>
                  ${[
                    ['Sat 1 Jun 2026','09:00–12:00',10,5],
                    ['Sat 1 Jun 2026','13:00–15:00',8,8],
                    ['Sun 2 Jun 2026','09:00–12:00',10,3],
                    ['Sun 2 Jun 2026','13:00–15:00',8,2],
                    ['Sat 8 Jun 2026','09:00–12:00',12,0],
                  ].map(s=>`
                  <tr>
                    <td>${s[0]}</td>
                    <td class="mono">${s[1]}</td>
                    <td class="mono">${s[2]}</td>
                    <td class="mono">${s[3]}</td>
                    <td><div class="progress" style="width:80px"><div class="bar" style="width:${(s[3]/s[2])*100}%"></div></div></td>
                    <td><button class="btn danger sm">Delete</button></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            ${api('GET /api/pickup-slots')}
          </div>
          <div class="surface stack-8" style="position:sticky;top:8px">
            <div class="h2">Add pickup slot</div>
            <div class="input"><label>Date *</label><div class="field">2026-06-08 📅</div></div>
            <div class="grid-2">
              <div class="input ok"><label>Start *</label><div class="field">09:00</div></div>
              <div class="input ok"><label>End *</label><div class="field">12:00</div></div>
            </div>
            <div class="callout ok" style="background:#F1F8F1"><span class="pin">✓</span><div><span class="lbl">LIVE VALIDATION</span>end &gt; start</div></div>
            <div class="callout error"><span class="pin">✗</span><div><span class="lbl">ERROR EXAMPLE</span>end (08:00) ≤ start (09:00)</div></div>
            <div class="input ok"><label>Max orders *</label><div class="field">10</div><div class="help mono">must be &gt; 0</div></div>
            <div class="row" style="gap:8px"><button class="btn">Create slot</button><button class="btn ghost">Reset</button></div>
            ${api('POST /api/pickup-slots')}
          </div>
        </div>
      </div>
    `
  });

  window.pages = pages;
  window.productCard = productCard;
  window.pills = pills;
