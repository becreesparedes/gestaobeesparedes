/**
 * views/formularios.js — Formulários F01–F18
 */
import { gSearch }   from '../core/graph.js';
import { getState }  from '../core/store.js';
import { showToast } from '../utils/toast.js';
import { openModal } from '../utils/modal.js';
import { esc }       from '../utils/format.js';
import FORMS         from '../data/forms.json' assert { type: 'json' };

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">📝</div>
    <div class="page-header-info">
      <h2>Formulários</h2>
      <p>F01–F18 · Abrir modelo e carregar preenchido para OneDrive</p>
    </div>
  </div>
  <div class="pad">
    <div class="g3" id="forms-grid"></div>
  </div>`;
  _render();
}

export function refresh() {}

function _render() {
  const grid = document.getElementById('forms-grid');
  if (!grid) return;
  grid.innerHTML = FORMS.map(f => `
    <div class="card">
      <h3 style="justify-content:space-between">
        <span>${esc(f.code)} — ${esc(f.name)}</span>
        <span class="badge badge-${esc(f.mabe)}">${esc(f.mabe)}</span>
      </h3>
      <div class="card-desc">${esc(f.desc)}</div>
      <div style="margin-bottom:var(--sp-3)">
        <span class="badge badge-${esc(f.resp)}">${esc(f.resp)}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm"
          onclick="_openForm('${esc(f.code)}')"
          aria-label="Abrir modelo ${esc(f.code)}">📂 Abrir modelo</button>
        <button class="btn btn-primary btn-sm"
          onclick="_uploadForm('${esc(f.code)}')"
          aria-label="Carregar ${esc(f.code)} preenchido">⬆️ Carregar</button>
      </div>
    </div>`).join('');
}

window._openForm = async function(code) {
  if (getState('demo')) { showToast(`📝 [Demo] ${code}`); return; }
  try {
    const r = await gSearch(code, getState('rootId'));
    const f = (r.value ?? []).find(x => x.name.startsWith(code));
    if (f?.webUrl && f.webUrl !== '#') window.openFileUrl(f.webUrl, f.name);
    else showToast(`⚠️ ${code} não encontrado. Verifique a pasta 09_Formulários_e_Modelos.`, 'warn');
  } catch (e) { showToast('⚠️ ' + e.message, 'danger'); }
};

window._uploadForm = function(code) {
  openModal('modal-upload');
  const t = document.getElementById('up-type'); if (t) t.value = 'F';
  const d = document.getElementById('up-desc'); if (d) d.value = code;
  window.calcUploadPath?.();
};
