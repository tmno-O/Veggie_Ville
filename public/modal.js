(function(){
  const esc = window.VVEscape || ((value = '') => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch])));

  function decodeHtmlEntities(str) {
    const t = document.createElement('textarea');
    t.innerHTML = str;
    return t.value;
  }

  function friendlyApiMessage(raw) {
    let s = decodeHtmlEntities(String(raw ?? '').trim());
    try {
      const parsed = JSON.parse(s);
      if (parsed && parsed.message === 'Unauthorized') return 'Please log in to add items.';
      if (parsed && typeof parsed.message === 'string') return parsed.message;
    } catch (_) {}
    if (s === 'Unauthorized') return 'Please log in to add items.';
    return s;
  }

  function createModal(){
    let existingBackdrop = document.querySelector('.vv-modal-backdrop');
    if(existingBackdrop) return existingBackdrop;
    const modal = document.createElement('div'); modal.className='vv-modal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.style.display='none';
    modal.innerHTML = `
      <div class="vv-modal-content" style="background:#fff;padding:18px;border-radius:10px;max-width:520px;width:calc(100% - 32px);box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <button class="vv-modal-close" aria-label="Close dialog" style="float:right">✕</button>
        <div class="vv-modal-body" tabindex="-1"></div>
        <div style="margin-top:12px;text-align:right"><button class="vv-modal-ok">OK</button></div>
      </div>`;
    const backdrop = document.createElement('div'); backdrop.className='vv-modal-backdrop'; backdrop.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.4);display:none;z-index:10000;align-items:center;justify-content:center;padding:24px';
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', e=>{ if(e.target===backdrop) { VVModal.closeModal(); } });
    modal.querySelector('.vv-modal-close').addEventListener('click', ()=>VVModal.closeModal());
    modal.querySelector('.vv-modal-ok').addEventListener('click', ()=>VVModal.closeModal());
    return backdrop;
  }

  let lastFocused = null;
  const VVModal = {
    friendlyApiMessage,
    openCartModal(message) {
      return this.openModal(
        `<div style="font-weight:700;margin-bottom:8px">Failed to add to cart</div>` +
        `<div style="color:#333;margin-bottom:8px">${esc(friendlyApiMessage(message))}</div>`
      );
    },
    openModal(html){
      if (typeof html === 'string' && html.includes('Failed to add to cart')) {
        html = html.replace(
          /(<div style="color:#333;margin-bottom:8px">)([\s\S]*?)(<\/div>)/,
          (_, pre, raw, post) => pre + esc(friendlyApiMessage(raw)) + post
        );
      }
      const backdrop = createModal();
      const modal = backdrop.querySelector('.vv-modal');
      const body = modal.querySelector('.vv-modal-body');
      body.innerHTML = html;
      backdrop.style.display = 'flex';
      modal.style.display = 'block';
      lastFocused = document.activeElement;
      setTimeout(()=>{ body.focus(); }, 10);
      function trap(e){
        if(e.key==='Escape') { VVModal.closeModal(); }
        if(e.key!=='Tab') return;
        const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if(!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length-1];
        if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
        else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
      }
      modal._trap = trap;
      document.addEventListener('keydown', trap);
      return { backdrop, modal };
    },
    closeModal(){
      const backdrop = document.querySelector('.vv-modal-backdrop');
      if(!backdrop) return;
      const modal = backdrop.querySelector('.vv-modal');
      document.removeEventListener('keydown', modal._trap);
      modal.style.display='none'; backdrop.style.display='none';
      if(lastFocused && typeof lastFocused.focus==='function') lastFocused.focus();
    }
  };

  window.VVModal = VVModal;
  if(typeof module !== 'undefined' && module.exports){ module.exports = VVModal; }
})();
