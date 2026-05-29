/**
 * views/pops.js — Procedimentos Operacionais Padrão
 */
import { gSearch }    from '../core/graph.js';
import { getState }   from '../core/store.js';
import { showToast }  from '../utils/toast.js';
import { debounce }   from '../utils/debounce.js';
import { esc }        from '../utils/format.js';
import POPS           from '../data/pops.json' assert { type: 'json' };

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">📋</div>
    <div class="page-header-info">
      <h2>POPs — Procedimentos Operacionais</h2>
      <p>${POPS.length} procedimentos · Estado, responsável e frequência</p>
    </div>
    <div class="page-header-actions">
      <label for="pop-filter" style="display:none">Filtrar POPs</label>
      <input class="search-input" style="width:180px" id="pop-filter"
        placeholder="🔍 Filtrar…" aria-label="Filtrar lista de POPs">
    </div>
  </div>
  <div class="pad">
    <div class="tbl-scroll">
      <div class="tbl-wrap">
        <table class="tbl" aria-label="Lista de POPs">
          <thead><tr>
            <th scope="col">Código</th>
            <th scope="col">Descrição</th>
            <th scope="col">Área</th>
            <th scope="col">Resp.</th>
            <th scope="col">Frequência</th>
            <th scope="col">MABE</th>
            <th scope="col">Ficheiro</th>
          </tr></thead>
          <tbody id="pops-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>`;

  _render(POPS);
  const inp = container.querySelector('#pop-filter');
  inp?.addEventListener('input', debounce(e => {
    const q = e.target.value.toLowerCase();
    _render(q ? POPS.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q)
    ) : POPS);
  }, 200));
}

export function refresh() {}

function _render(data) {
  const tbody = document.getElementById('pops-tbody');
  if (!tbody) return;
  tbody.innerHTML = data.map(p => `
    <tr>
      <td class="td-code">${esc(p.code)}</td>
      <td class="td-name">${esc(p.name)}</td>
      <td style="font-size:.72rem;color:var(--grey-500)">${esc(p.area)}</td>
      <td>${p.resp.map(r => `<span class="badge badge-${esc(r)}">${esc(r)}</span>`).join(' ')}</td>
      <td style="font-size:.72rem;color:var(--grey-500)">${esc(p.freq)}</td>
      <td><span class="badge badge-${esc(p.mabe)}">${esc(p.mabe)}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm"
          onclick="_openPOP('${esc(p.code)}')"
          aria-label="Abrir ficheiro ${esc(p.code)} no OneDrive">📄 Ver</button>
      </td>
    </tr>`).join('');
}

window._openPOP = async function(code) {
  if (getState('demo')) { showToast(`📋 [Demo] ${code}`); return; }
  try {
    const r = await gSearch(code, getState('rootId'));
    const f = (r.value ?? []).find(x => x.name.includes(code));
    if (f?.webUrl && f.webUrl !== '#') window.openFileUrl(f.webUrl, f.name);
    else showToast(`⚠️ ${code} não encontrado. Verifique a pasta 02_Organização_e_Operação.`, 'warn');
  } catch (e) { showToast('⚠️ ' + e.message, 'danger'); }
};
