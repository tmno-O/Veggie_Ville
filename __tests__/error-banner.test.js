/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const bannerSrc = fs.readFileSync(path.resolve(__dirname, '..', 'public', 'error-banner.js'), 'utf8');

beforeAll(() => {
  document.body.innerHTML = '<main id="app-root"><div class="page-content"></div></main>';
  eval('window.VVEscape = (v) => String(v);');
  eval(bannerSrc);
});

test('VVErrorBanner shows a fixed overlay with dismiss control', () => {
  window.VVErrorBanner.show('Unable to load cart: Internal server error');
  const banner = document.getElementById('vv-error-banner');
  expect(banner).not.toBeNull();
  expect(banner.style.position).toBe('fixed');
  expect(Number(banner.style.zIndex)).toBeGreaterThanOrEqual(10001);
  expect(banner.querySelector('.vv-error-banner-text').textContent).toContain('Internal server error');
  banner.querySelector('.vv-error-banner-close').click();
  expect(banner.style.display).toBe('none');
});
