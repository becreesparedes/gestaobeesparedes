/**
 * modal.js — Sistema de modais acessível
 */

let _lastFocus = null;

export function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  _lastFocus = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    const first = overlay.querySelector('input,select,textarea,button,[tabindex]:not([tabindex="-1"])');
    first?.focus();
  });
}

export function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  _lastFocus?.focus();
  _lastFocus = null;
}

export function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
  _lastFocus?.focus();
  _lastFocus = null;
}

/** Foco em ciclo dentro do modal (Tab / Shift+Tab) */
export function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const modal = document.querySelector('.modal-overlay.open');
  if (!modal) return;
  const focusable = Array.from(
    modal.querySelectorAll('button,input,select,textarea,[tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.disabled && el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first)  { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** Instalar os listeners globais de modal */
export function installModalListeners() {
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeAllModals();
  });
  document.addEventListener('keydown', trapFocus);
}
