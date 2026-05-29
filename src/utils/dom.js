/**
 * dom.js — Helpers DOM seguros e utilitários de UI
 */

/**
 * Cria um elemento DOM de forma segura (sem innerHTML)
 * @param {string} tag
 * @param {Object} attrs
 * @param {...(Node|string)} children
 */
export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className')                          e.className = v;
    else if (k === 'dataset')                       Object.assign(e.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    e.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return e;
}

/** Actualiza o estado visual do indicador de sync no header */
export function setSyncStatus(msg, state) {
  const text = document.getElementById('sync-text');
  const dot  = document.getElementById('sync-dot');
  if (text) text.textContent = msg;
  if (dot) {
    dot.className = 'sync-dot';
    if (state === 'syncing') dot.classList.add('syncing');
    if (state === 'error')   dot.classList.add('error');
  }
}

/** Abre/fecha sidebar em mobile */
export function toggleSidebar() {
  const sb      = document.getElementById('sidebar');
  const overlay = document.getElementById('sb-overlay');
  const btn     = document.getElementById('menu-btn');
  if (!sb) return;
  const open = sb.classList.toggle('open');
  overlay?.classList.toggle('show', open);
  btn?.setAttribute('aria-expanded', String(open));
  btn?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

/** Fecha sidebar se estiver aberta */
export function closeSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb?.classList.contains('open')) toggleSidebar();
}

/** Gera um skeleton loader HTML */
export function skeletonRows(n = 5) {
  return Array(n).fill('')
    .map(() => `<div class="skel skel-text" style="width:${40+Math.random()*45}%"></div>`)
    .join('');
}

/** Estado de empty */
export function emptyState(icon, title, desc = '') {
  return `<div class="empty">
    <div class="empty-icon">${icon}</div>
    <h3>${title}</h3>
    ${desc ? `<p>${desc}</p>` : ''}
  </div>`;
}

/** Formata breadcrumb a partir de array [{name,id}] */
export function renderBreadcrumb(items, onClickFn) {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  bc.innerHTML = '';
  items.forEach((item, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep'; sep.textContent = '›';
      bc.appendChild(sep);
    }
    if (i === items.length - 1) {
      const cur = document.createElement('span');
      cur.className = 'bc-current'; cur.textContent = item.name;
      bc.appendChild(cur);
    } else {
      const btn = el('button', {
        className: 'bc-btn',
        'aria-label': 'Navegar para ' + item.name,
        onClick: () => onClickFn(item, i),
      }, item.name);
      bc.appendChild(btn);
    }
  });
}

/** Mostra/esconde elementos por ID */
export const show = id => { const e = document.getElementById(id); if (e) e.style.display = ''; };
export const hide = id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; };

/** Actualiza text content com segurança */
export const setText = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val ?? '—'; };
