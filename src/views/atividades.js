/**
 * views/atividades.js — Registo de atividades pedagógicas
 */
import { getState, setState } from '../core/store.js';
import { saveLocal, addHistory } from '../core/sync.js';
import { openModal }             from '../utils/modal.js';
import { showToast }             from '../utils/toast.js';
import { debounce }              from '../utils/debounce.js';
import { esc, fmtDate }          from '../utils/format.js';

const TIPO_ICON = { PPL:'📖', Articulação:'🎓', Projeto:'🤝',
  'Clube Leitura':'📚', Exposição:'🖼️', Formação:'🏫', Outro:'📋' };
const TIPO_BADGE = { PPL:'badge-green', Articulação:'badge-blue',
  Projeto:'badge-purple', 'Clube Leitura':'badge-green',
  Exposição:'badge-purple', Formação:'badge-amber', Outro:'badge-grey' };

let _sort = 'data_desc';

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">📖</div>
    <div class="page-header-info">
      <h2>Atividades</h2>
      <p>Registo com pasta automática no OneDrive</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-nova-ativ')">+ Nova</button>
    </div>
  </div>
  <div class="pad">
    <div class="search-bar" role="search">
      <label for="ativ-search" style="display:none">Filtrar atividades</label>
      <input class="search-input" id="ativ-search" placeholder="🔍 Filtrar…"
        aria-label="Filtrar atividades por nome">
      <select class="filter-sel" id="ativ-tipo" aria-label="Filtrar por tipo">
        <option value="">Todas</option>
        <option>PPL</option><option>Articulação</option><option>Projeto</option>
        <option>Clube Leitura</option><option>Exposição</option><option>Formação</option>
      </select>
      <select class="filter-sel" id="ativ-sort" aria-label="Ordenar">
        <option value="data_desc">↓ Data</option>
        <option value="data_asc">↑ Data</option>
        <option value="nome">A–Z</option>
        <option value="part_desc">Participantes ↓</option>
      </select>
    </div>
    <div id="ativ-view"></div>
  </div>`;

  container.querySelector('#ativ-search')?.addEventListener('input', debounce(() => _render(container), 220));
  container.querySelector('#ativ-tipo')?.addEventListener('change', () => _render(container));
  container.querySelector('#ativ-sort')?.addEventListener('change', e => { _sort = e.target.value; _render(container); });
  refresh(container);
}

export function refresh(container) { _render(container); }

function _render(container) {
  const el = document.getElementById('ativ-view');
  if (!el) return;

  const q    = (document.getElementById('ativ-search')?.value ?? '').toLowerCase().trim();
  const tipo = (document.getElementById('ativ-tipo')?.value   ?? '').trim();
  const all  = getState('atividades') ?? [];

  let lista = all.filter(a =>
    (!q    || a.nome.toLowerCase().includes(q) || (a.desc ?? '').toLowerCase().includes(q)) &&
    (!tipo || a.tipo === tipo)
  );

  lista = [...lista].sort((a, b) => {
    if (_sort === 'data_desc')  return new Date(b.data ?? 0) - new Date(a.data ?? 0);
    if (_sort === 'data_asc')   return new Date(a.data ?? 0) - new Date(b.data ?? 0);
    if (_sort === 'nome')       return (a.nome ?? '').localeCompare(b.nome ?? '', 'pt');
    if (_sort === 'part_desc')  return (b.part ?? 0) - (a.part ?? 0);
    return 0;
  });

  if (!all.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📖</div>
      <h3>Sem atividades registadas</h3>
      <p>Clique em "+ Nova" para registar a primeira atividade.</p></div>`;
    return;
  }
  if (!lista.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>
      <h3>Sem resultados</h3><p>Tente outros termos de pesquisa.</p></div>`;
    return;
  }

  /* KPIs rápidos */
  const totalPart = all.reduce((s, a) => s + (a.part ?? 0), 0);
  const kpis = `
    <div class="kpi-grid" style="margin-bottom:var(--sp-4)">
      <div class="kpi-card"><div class="kpi-val">${all.length}</div><div class="kpi-lbl">Atividades</div></div>
      <div class="kpi-card"><div class="kpi-val">${totalPart}</div><div class="kpi-lbl">Participantes</div></div>
      <div class="kpi-card"><div class="kpi-val">${lista.length}</div><div class="kpi-lbl">Filtradas</div></div>
      <div class="kpi-card"><div class="kpi-val">${new Set(all.map(a => a.tipo)).size}</div><div class="kpi-lbl">Tipos</div></div>
    </div>`;

  const cards = lista.map(a => {
    const icon  = TIPO_ICON[a.tipo]  ?? '📋';
    const badge = TIPO_BADGE[a.tipo] ?? 'badge-grey';
    const dt    = fmtDate(a.data);
    return `
    <div class="card" style="margin-bottom:var(--sp-2)" role="article" aria-label="Atividade: ${esc(a.nome)}">
      <div style="display:flex;align-items:flex-start;gap:var(--sp-3);flex-wrap:wrap">
        <span style="font-size:22px;flex-shrink:0;margin-top:2px" aria-hidden="true">${icon}</span>
        <div style="flex:1;min-width:180px">
          <div style="font-weight:700;font-size:.88rem;color:var(--brand);margin-bottom:3px">${esc(a.nome)}</div>
          ${a.desc ? `<div style="font-size:.72rem;color:var(--grey-500);margin-bottom:6px;line-height:1.4">${esc(a.desc)}</div>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <span class="badge ${badge}">${esc(a.tipo)}</span>
            <span style="font-size:.67rem">📅 ${esc(dt)}</span>
            ${a.pub  ? `<span style="font-size:.67rem">👥 ${esc(a.pub)}</span>` : ''}
            ${a.part ? `<span style="font-size:.67rem">🔢 ${a.part} participantes</span>` : ''}
            ${a.createdBy ? `<span style="font-size:.62rem;color:var(--grey-400)">por ${esc(a.createdBy)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;flex-shrink:0">
          ${a.pasta ? `<button class="btn btn-ghost btn-sm" onclick="_browseMABE('03_Pedagogia_e_Literacias/04_Atividades_Pedagógicas/${esc(a.pasta)}')"
            aria-label="Ver pasta de ${esc(a.nome)}">📁 Pasta</button>` : ''}
          <button class="btn btn-ghost btn-sm"
            onclick="openModal('modal-upload');document.getElementById('up-type').value='AT';
              document.getElementById('up-desc').value='${esc((a.nome ?? '').slice(0,20).replace(/'/g,''))}';
              window.calcUploadPath?.()"
            aria-label="Carregar relatório de ${esc(a.nome)}">⬆️</button>
          <button class="btn btn-danger btn-sm" onclick="_deleteAtiv(${a.id})"
            aria-label="Eliminar ${esc(a.nome)}">🗑️</button>
        </div>
      </div>
      ${a.pasta ? `<div style="margin-top:6px;font-size:.62rem;font-family:var(--font-mono);
        color:var(--info);opacity:.7">📁 BE-ESP/03_Pedagogia_e_Literacias/04_Atividades_Pedagógicas/${esc(a.pasta)}/</div>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = kpis + cards;
  if (lista.length < all.length) {
    el.innerHTML += `<div style="text-align:center;padding:var(--sp-2);font-size:.72rem;color:var(--grey-400)">
      ${lista.length} de ${all.length} atividades</div>`;
  }
}

window._deleteAtiv = function(id) {
  const a = (getState('atividades') ?? []).find(x => x.id === id);
  if (!a) return;
  if (!confirm(`Eliminar "${a.nome}"?\n\nA pasta no OneDrive NÃO será eliminada.`)) return;
  setState('atividades', (getState('atividades') ?? []).filter(x => x.id !== id));
  saveLocal();
  addHistory('Atividade eliminada', a.nome);
  showToast('🗑️ Atividade eliminada');
  _render(document.getElementById('view-atividades'));
};
