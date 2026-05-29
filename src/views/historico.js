/**
 * views/historico.js — Histórico de actividade
 */
import { getState, setState } from '../core/store.js';
import { saveLocal }          from '../core/sync.js';
import { showToast }          from '../utils/toast.js';
import { esc }                from '../utils/format.js';

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">🕐</div>
    <div class="page-header-info">
      <h2>Histórico de Atividade</h2>
      <p>Todas as acções com data, hora e utilizador</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm" id="hist-export">📊 Exportar</button>
      <button class="btn btn-danger btn-sm" id="hist-clear">🗑️ Limpar</button>
    </div>
  </div>
  <div class="pad">
    <div class="tbl-scroll">
      <div class="tbl-wrap">
        <table class="tbl" aria-label="Histórico de actividade">
          <thead><tr>
            <th scope="col">Data/Hora</th>
            <th scope="col">Utilizador</th>
            <th scope="col">Acção</th>
            <th scope="col">Documento</th>
            <th scope="col">Pasta</th>
          </tr></thead>
          <tbody id="hist-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>`;
  container.querySelector('#hist-export')?.addEventListener('click', () =>
    import('../utils/export-xlsx.js').then(m => m.exportHistoryXLSX()));
  container.querySelector('#hist-clear')?.addEventListener('click', () => {
    if (!confirm('Limpar todo o histórico?\n\nEsta acção não pode ser desfeita.')) return;
    setState('history', []);
    saveLocal();
    _render();
    showToast('🗑️ Histórico limpo');
  });
  refresh(container);
}

export function refresh(_container) { _render(); }

function _render() {
  const tbody = document.getElementById('hist-tbody');
  if (!tbody) return;
  const hist = getState('history') ?? [];
  if (!hist.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--grey-400);padding:var(--sp-5)">
      Sem registos de actividade.</td></tr>`;
    return;
  }
  tbody.innerHTML = hist.slice(0, 200).map(h => {
    const respBadge = h.user && h.user.length <= 3
      ? `<span class="badge badge-${esc(h.user)}">${esc(h.user)}</span>`
      : `<span class="badge badge-info" style="font-size:.6rem">${esc(h.user ?? '—')}</span>`;
    return `<tr>
      <td class="td-muted" style="white-space:nowrap">${esc(h.dt ?? '—')}</td>
      <td>${respBadge}</td>
      <td style="font-weight:500">${esc(h.action ?? '—')}</td>
      <td class="td-code" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
        title="${esc(h.doc)}">${esc(h.doc || '—')}</td>
      <td class="td-muted" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
        title="${esc(h.folder)}">${esc(h.folder || '—')}</td>
    </tr>`;
  }).join('');
}
