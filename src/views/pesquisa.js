/**
 * views/pesquisa.js — Pesquisa global OneDrive
 */
import { getState }         from '../core/store.js';
import { gSearch }          from '../core/graph.js';
import { addHistory }       from '../core/sync.js';
import { showToast }        from '../utils/toast.js';
import { debounce }         from '../utils/debounce.js';
import { esc, fmtDate,
         fileMabe, fileIcon } from '../utils/format.js';

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">🔍</div>
    <div class="page-header-info">
      <h2>Pesquisa Global</h2>
      <p>Ctrl+K · Em todos os ficheiros do OneDrive BE-ESP</p>
    </div>
  </div>
  <div class="pad">
    <div class="search-bar" role="search" aria-label="Pesquisa global" style="margin-bottom:var(--sp-4)">
      <label for="search-global-q" style="display:none">Pesquisar</label>
      <input class="search-input" id="search-global-q" style="flex:2"
        placeholder="Nome, tipo, POP, formulário, domínio MABE…"
        aria-label="Termos de pesquisa">
      <select class="filter-sel" id="search-domain" aria-label="Filtrar por domínio MABE">
        <option value="">Todos os domínios</option>
        <option value="A">A — Currículo</option>
        <option value="B">B — Leitura</option>
        <option value="C">C — Projetos</option>
        <option value="D">D — Gestão</option>
      </select>
      <button class="btn btn-primary" id="btn-search">🔍 Pesquisar</button>
    </div>
    <div id="search-results" aria-live="polite">
      <div class="empty">
        <div class="empty-icon">🔍</div>
        <h3>Pesquisa global</h3>
        <p>Escreva um termo e prima Enter ou clique em Pesquisar.</p>
      </div>
    </div>
  </div>`;
  _bindEvents(container);
}

export function refresh(container) {
  const q = container.querySelector('#search-global-q');
  if (q) q.focus();
}

function _bindEvents(container) {
  const inp = container.querySelector('#search-global-q');
  const btn = container.querySelector('#btn-search');
  btn?.addEventListener('click', () => _doSearch(container));
  inp?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); _doSearch(container); }
  });
}

async function _doSearch(container) {
  const q      = (container.querySelector('#search-global-q')?.value ?? '').trim();
  const domain = (container.querySelector('#search-domain')?.value ?? '');
  const results = container.querySelector('#search-results') ?? document.getElementById('search-results');
  if (!q) { showToast('⚠️ Escreva um termo para pesquisar', 'warn'); return; }

  results.innerHTML = `<div style="padding:var(--sp-3)">
    ${Array(4).fill('<div class="skel skel-text" style="margin-bottom:10px"></div>').join('')}
  </div>`;

  try {
    const r     = await gSearch(q, getState('rootId'));
    let items   = r.value ?? [];
    if (domain) items = items.filter(f => fileMabe(f.name) === domain);

    if (!items.length) {
      results.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div><h3>Sem resultados</h3><p>Tente outros termos de pesquisa.</p></div>`;
      return;
    }

    const rows = items.map(f => {
      const mabe   = fileMabe(f.name);
      const dt     = fmtDate(f.lastModifiedDateTime);
      const folder = (f.parentReference?.path ?? '').split('BE-ESP').pop() || '/';
      return `<tr>
        <td class="td-name">${esc(fileIcon(f.name))} ${esc(f.name)}
          ${mabe ? `<span class="badge badge-${mabe}" style="margin-left:4px">${mabe}</span>` : ''}
        </td>
        <td class="td-code" style="max-width:160px;overflow:hidden;text-overflow:ellipsis">${esc(folder)}</td>
        <td class="td-muted">${esc(dt)}</td>
        <td>
          ${f.webUrl && f.webUrl !== '#'
            ? `<button class="btn btn-ghost btn-sm" onclick="openFileUrl('${esc(f.webUrl)}','${esc(f.name)}')" aria-label="Abrir ${esc(f.name)}">🔗 Abrir</button>`
            : '—'}
        </td>
      </tr>`;
    }).join('');

    results.innerHTML = `
      <div class="sec-hdr mb-3">
        <h3>${items.length} resultado(s) para "${esc(q)}"</h3>
        <div class="sec-line"></div>
      </div>
      <div class="tbl-scroll">
        <div class="tbl-wrap">
          <table class="tbl" aria-label="Resultados de pesquisa">
            <thead><tr>
              <th scope="col">Ficheiro</th><th scope="col">Pasta</th>
              <th scope="col">Modificado</th><th scope="col">Ações</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    addHistory('Pesquisa global', q);
  } catch (e) { showToast('⚠️ Erro: ' + e.message, 'danger'); }
}
