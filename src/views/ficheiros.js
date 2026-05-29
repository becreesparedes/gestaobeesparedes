/**
 * views/ficheiros.js — Explorador OneDrive
 */
import { getState, setState } from '../core/store.js';
import { gChildren, gCreateFolder,
         gSearch }            from '../core/graph.js';
import { cacheClear }         from '../core/cache.js';
import { addHistory }         from '../core/sync.js';
import { showToast }          from '../utils/toast.js';
import { debounce }           from '../utils/debounce.js';
import { renderBreadcrumb }   from '../utils/dom.js';
import { esc, fmtDate, fmtSize,
         fileIcon, fileExt,
         fileMabe }           from '../utils/format.js';
import { goView }             from '../main.js';

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">📁</div>
    <div class="page-header-info">
      <h2>Explorador OneDrive</h2>
      <p id="cur-folder-name">BE-ESP</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm" id="btn-reload-folder" aria-label="Recarregar">🔄</button>
      <button class="btn btn-ghost btn-sm" id="btn-new-folder">📁 Nova pasta</button>
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-upload')">⬆️ Carregar</button>
    </div>
  </div>

  <nav class="breadcrumb" id="breadcrumb" aria-label="Localização actual"></nav>

  <div class="pad" style="padding-top:var(--sp-2)">
    <div class="search-bar" role="search">
      <label for="file-search" style="display:none">Filtrar ficheiros</label>
      <input class="search-input" id="file-search" placeholder="🔍 Filtrar ficheiros na pasta…"
        aria-label="Filtrar ficheiros na pasta actual">
      <select class="filter-sel" id="file-type-filter" aria-label="Filtrar por tipo">
        <option value="">Todos os tipos</option>
        <option value="folder">📁 Pastas</option>
        <option value=".docx">Word (.docx)</option>
        <option value=".xlsx">Excel (.xlsx)</option>
        <option value=".pdf">PDF</option>
        <option value=".zip">ZIP</option>
      </select>
    </div>
    <div class="tbl-scroll">
      <div class="tbl-wrap" id="files-browser">
        <div style="padding:var(--sp-4)"><div class="skel skel-text"></div><div class="skel skel-text short"></div></div>
      </div>
    </div>
  </div>`;

  _bindEvents(container);
  refresh(container);
}

export function refresh(container) {
  const folderId = getState('currentFolderId') ?? getState('rootId');
  const name     = getState('currentFolderName') ?? 'BE-ESP';
  if (folderId) _loadFolder(folderId, name, !getState('breadcrumb')?.length);
  else _renderItems(getState('currentItems') ?? []);
  _updateHeaderName();
  renderBreadcrumb(getState('breadcrumb') ?? [], _onBreadcrumbClick);
}

/* ── Load folder ── */
async function _loadFolder(folderId, folderName, isRoot = false) {
  const bc = getState('breadcrumb') ?? [];
  if (isRoot || !bc.length) {
    setState('breadcrumb', [{ name: folderName, id: folderId }]);
  } else {
    const idx = bc.findIndex(b => b.id === folderId);
    if (idx >= 0) setState('breadcrumb', bc.slice(0, idx + 1));
    else setState('breadcrumb', [...bc, { name: folderName, id: folderId }]);
  }
  setState('currentFolderId', folderId);
  setState('currentFolderName', folderName);
  _updateHeaderName();
  renderBreadcrumb(getState('breadcrumb'), _onBreadcrumbClick);
  _showSkeleton();

  try {
    let all = [], result = await gChildren(folderId);
    all = [...(result.value ?? [])];
    while (result['@odata.nextLink']) {
      result = await gChildren(folderId, result['@odata.nextLink']);
      all = [...all, ...(result.value ?? [])];
    }
    setState('currentItems', all);
    _renderItems(all);
  } catch (e) {
    document.getElementById('files-browser').innerHTML =
      `<div class="empty"><div class="empty-icon">⚠️</div><h3>Erro ao carregar</h3><p>${esc(e.message)}</p></div>`;
  }
}

/* ── Render tabela de ficheiros ── */
function _renderItems(items) {
  const wrap = document.getElementById('files-browser');
  if (!wrap) return;
  if (!items?.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-icon">📂</div><h3>Pasta vazia</h3></div>`;
    return;
  }
  const sorted = [...items].sort((a, b) => {
    if (a.folder && !b.folder) return -1;
    if (!a.folder && b.folder) return 1;
    return a.name.localeCompare(b.name, 'pt');
  });

  const rows = sorted.map(f => {
    const isDir = !!f.folder;
    const dt    = fmtDate(f.lastModifiedDateTime);
    const sz    = isDir ? (f.folder.childCount ? f.folder.childCount + ' itens' : '—') : fmtSize(f.size);
    const mabe  = fileMabe(f.name);
    return `<tr>
      <td class="td-name" style="max-width:260px">
        <span aria-hidden="true">${fileIcon(f.name, isDir)} </span>
        <span class="truncate" style="display:inline-block;max-width:220px;vertical-align:middle"
          title="${esc(f.name)}">${esc(f.name)}</span>
        ${mabe ? `<span class="badge badge-${mabe}" style="margin-left:4px">${mabe}</span>` : ''}
      </td>
      <td class="td-code">${esc(fileExt(f.name, isDir))}</td>
      <td class="td-muted">${esc(dt)}</td>
      <td class="td-muted">${esc(sz)}</td>
      <td>
        <div style="display:flex;gap:4px">
          ${!isDir && f.webUrl && f.webUrl !== '#'
            ? `<button class="btn btn-ghost btn-sm" onclick="openFileUrl('${esc(f.webUrl)}','${esc(f.name)}')" aria-label="Abrir ${esc(f.name)}">🔗 Abrir</button>`
            : ''}
          <button class="btn btn-ghost btn-sm"
            onclick="_enterFolder('${esc(f.id)}','${esc(f.name)}')"
            aria-label="${isDir ? 'Entrar em ' : 'Ver pasta de '} ${esc(f.name)}">
            ${isDir ? '📂 Entrar' : '📂'}
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <table class="tbl" aria-label="Ficheiros — ${esc(getState('currentFolderName') ?? '')}">
      <thead><tr>
        <th scope="col">Nome</th><th scope="col">Tipo</th>
        <th scope="col">Modificado</th><th scope="col">Tamanho</th>
        <th scope="col">Ações</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── Filtro local ── */
const _filterDebounced = debounce(() => {
  const q    = (document.getElementById('file-search')?.value ?? '').toLowerCase();
  const type = (document.getElementById('file-type-filter')?.value ?? '').toLowerCase();
  const all  = getState('currentItems') ?? [];
  const filt = all.filter(f => {
    const nm = f.name.toLowerCase();
    if (type === 'folder') return !!f.folder;
    return (!q || nm.includes(q)) && (!type || nm.endsWith(type));
  });
  _renderItems(filt);
}, 220);

/* ── Breadcrumb click ── */
function _onBreadcrumbClick(item, idx) {
  const bc = getState('breadcrumb') ?? [];
  _loadFolder(item.id, item.name, idx === 0);
}

/* ── Nova pasta ── */
async function _createFolder() {
  const name = prompt('Nome da nova pasta:');
  if (!name?.trim()) return;
  const safe = name.trim().replace(/[<>:"/\\|?*]/g, '_');
  try {
    const parentId = getState('currentFolderId') ?? getState('rootId');
    await gCreateFolder(parentId, safe);
    cacheClear();
    showToast('📁 Pasta criada: ' + safe, 'ok');
    addHistory('Pasta criada', safe, getState('breadcrumb')?.map(b => b.name).join('/') ?? '');
    await _loadFolder(getState('currentFolderId'), getState('currentFolderName'));
  } catch (e) { showToast('⚠️ Erro: ' + e.message, 'danger'); }
}

function _showSkeleton() {
  const wrap = document.getElementById('files-browser');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:var(--sp-3)">
    ${Array(6).fill('').map(() => `
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--grey-100);align-items:center">
        <div class="skel" style="width:20px;height:20px;border-radius:50%;flex-shrink:0"></div>
        <div style="flex:1"><div class="skel skel-text" style="width:${35+Math.random()*40}%"></div></div>
        <div class="skel" style="width:60px;height:10px"></div>
        <div class="skel" style="width:80px;height:10px"></div>
      </div>`).join('')}
  </div>`;
}

function _updateHeaderName() {
  const el = document.getElementById('cur-folder-name');
  if (el) el.textContent = getState('currentFolderName') ?? 'BE-ESP';
}

function _bindEvents(container) {
  container.querySelector('#btn-reload-folder')?.addEventListener('click', async () => {
    cacheClear();
    await _loadFolder(getState('currentFolderId') ?? getState('rootId'), getState('currentFolderName') ?? 'BE-ESP');
  });
  container.querySelector('#btn-new-folder')?.addEventListener('click', _createFolder);
  container.querySelector('#file-search')?.addEventListener('input', _filterDebounced);
  container.querySelector('#file-type-filter')?.addEventListener('change', _filterDebounced);
}

window._enterFolder = function(id, name) {
  _loadFolder(id, name, false);
};
