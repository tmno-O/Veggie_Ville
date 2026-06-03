(function () {
  const esc = window.VVEscape || ((value = '') => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch])));

  function ensureBanner() {
    let el = document.getElementById('vv-error-banner');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'vv-error-banner';
    el.className = 'callout error vv-error-banner';
    el.setAttribute('role', 'alert');
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:10001',
      'display:none',
      'align-items:center',
      'gap:12px',
      'margin:0',
      'padding:12px 16px',
      'border-radius:0',
      'box-sizing:border-box'
    ].join(';');
    el.innerHTML = '<span class="pin">!</span><div class="vv-error-banner-text" style="flex:1"></div><button type="button" class="vv-error-banner-close" aria-label="Dismiss" style="background:transparent;border:none;font-size:18px;line-height:1;cursor:pointer;padding:4px 8px">✕</button>';
    document.body.appendChild(el);
    el.querySelector('.vv-error-banner-close').addEventListener('click', dismiss);
    return el;
  }

  function show(message) {
    const el = ensureBanner();
    el.querySelector('.vv-error-banner-text').innerHTML = esc(message);
    el.style.display = 'flex';
  }

  function dismiss() {
    const el = document.getElementById('vv-error-banner');
    if (el) el.style.display = 'none';
  }

  window.VVErrorBanner = { show, dismiss };
})();
