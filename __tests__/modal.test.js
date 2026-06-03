/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

// load modal script into jsdom global
const modalSrc = fs.readFileSync(path.resolve(__dirname,'..','public','modal.js'),'utf8');

beforeAll(()=>{
  // provide a minimal DOM
  document.body.innerHTML = '<div id="root"></div>';
  // evaluate modal script
  eval(modalSrc);
});

test('VVModal exposes openModal and closeModal', ()=>{
  expect(window.VVModal).toBeDefined();
  expect(typeof window.VVModal.openModal).toBe('function');
  expect(typeof window.VVModal.closeModal).toBe('function');
});

test('openModal creates backdrop and focuses body', ()=>{
  window.VVModal.openModal('<div id="inner">Hello</div>');
  const backdrop = document.querySelector('.vv-modal-backdrop');
  expect(backdrop).not.toBeNull();
  const modal = backdrop.querySelector('.vv-modal');
  expect(modal).not.toBeNull();
  const body = modal.querySelector('.vv-modal-body');
  expect(body.innerHTML).toContain('Hello');
  // close it
  window.VVModal.closeModal();
  expect(backdrop.style.display).toBe('none');
});

test('openCartModal maps Unauthorized JSON to a friendly login message', () => {
  window.VVModal.openCartModal('{"message":"Unauthorized"}');
  const body = document.querySelector('.vv-modal-body');
  expect(body.textContent).toContain('Please log in to add items.');
  expect(body.textContent).not.toContain('Unauthorized');
  window.VVModal.closeModal();
});
