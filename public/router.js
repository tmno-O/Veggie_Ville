// public/router.js

const contentRoot = document.getElementById('app-root');

const pageRoute = (pathname) => {
  if (!pathname || pathname === '/') return 'p1';
  const pageId = pathname.replace(/\/?$/, '').split('/').pop();
  
  const routeMap = {
    'browse': 'p2', 'products': 'p3', 'register': 'p4', 'login': 'p5',
    'cart': 'p6', 'checkout': 'p7', 'orders': 'p8', 'seller': 'p9',
    'admin': 'p11'
  };
  
  if (routeMap[pageId]) return routeMap[pageId];
  return pages.some(p => p.id === pageId) ? pageId : 'p1';
};

const renderPage = (pageId) => {
  const page = pages.find(p => p.id === pageId) || pages[0];
  
  contentRoot.innerHTML = `
    <div class="page-content" style="padding: 0; gap: 0;">
      <div class="page-phone">${page.mobile}</div>
      <div class="page-desktop">${page.desktop}</div>
    </div>
  `;
  
  document.title = `Veggie Ville — ${page.name}`;
  window.scrollTo(0, 0);

  // Trigger bindings
  bindData(pageId);
  bindAuth(pageId);
  
  // Restore the cart badge on the newly injected navbar
  if (window.VVBadge) window.VVBadge();
};

const navigate = (path, replace = false) => {
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  renderPage(pageRoute(window.location.pathname));
};

// Global click listener for SPA navigation
document.addEventListener('click', (event) => {
  // Added .btn to the catch list
  const link = event.target.closest('.link, .nav-bar .logo, .bottom-nav .b, .btn');
  if (!link) return;
  
  const text = link.textContent.trim();

  // Strict routing checks so we don't break "Add to cart" or form buttons
  if (text === 'Browse products' || text === 'Browse') {
    event.preventDefault(); navigate('/browse'); return;
  }
  if (text === 'Login' && !link.id?.includes('btn-submit')) {
    event.preventDefault(); navigate('/login'); return;
  }
  if (link.classList.contains('logo')) {
    event.preventDefault(); navigate('/'); return;
  }
});

window.addEventListener('popstate', () => {
  renderPage(pageRoute(window.location.pathname));
});

// ==========================================
// Phase 3: Data Binding
// ==========================================
async function bindData(pageId) {
  if (pageId !== 'p1' && pageId !== 'p2') return;

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const products = await res.json();
    
    const productsHtml = products.map(p => {
      let card = productCard({
        id: p.id,
        name: p.name,
        size: p.size,
        price: `฿${p.price}`,
        exp: p.best_before ? p.best_before.split('T')[0] : 'N/A',
        category: p.category
      });
      
      // Force inject data attributes if the wireframe helper missed them
      if (!card.includes('data-category=')) {
        card = card.replace('class="pcard', `data-id="${p.id}" data-category="${p.category}" class="pcard`);
      }
      return card;
    }).join('');

    if (pageId === 'p1') {
      const mobileGrid = document.querySelector('.page-phone .stack-12');
      const desktopGrid = document.querySelector('.page-desktop .grid-4');
      if (mobileGrid) mobileGrid.innerHTML = productsHtml;
      if (desktopGrid) desktopGrid.innerHTML = productsHtml;
    } 
    else if (pageId === 'p2') {
      const mobileGrid = document.querySelectorAll('.page-phone .grid-2')[1]; 
      const desktopGrid = document.querySelector('.page-desktop .grid-3');
      if (mobileGrid) mobileGrid.innerHTML = productsHtml;
      if (desktopGrid) desktopGrid.innerHTML = productsHtml;
    }
  } catch (err) {
    console.error("Data binding failed:", err);
  }
}

// ==========================================
// Phase 4: Authentication
// ==========================================
async function bindAuth(pageId) {
  if (pageId !== 'p5') return; 

  const bindForm = (layoutType) => {
    const loginBtn = document.getElementById(`btn-submit-login-${layoutType}`);
    if (!loginBtn) return;

    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById(`login-email-${layoutType}`).value;
      const password = document.getElementById(`login-pass-${layoutType}`).value;

      try {
        await window.VVAuth.login(email, password);
        navigate('/'); 
      } catch (err) {
        alert("Login failed: " + err.message);
      }
    });
  };

  bindForm('mobile');
  bindForm('desktop');
}

// Initial load
renderPage(pageRoute(window.location.pathname));