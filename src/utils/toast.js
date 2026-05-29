/**
 * toast.js — Notificações não bloqueantes
 */
let _timer = null;

export function showToast(msg, type = '', ms = 3400) {
  const el   = document.getElementById('toast');
  const live = document.getElementById('aria-live');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'toast show' + (type ? ' ' + type : '');
  if (live) live.textContent = msg;
  clearTimeout(_timer);
  _timer = setTimeout(() => {
    el.classList.remove('show');
    if (live) live.textContent = '';
  }, ms);
}
