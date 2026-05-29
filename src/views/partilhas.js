/**
 * views/partilhas.js — Ficheiros partilhados comigo (OneDrive)
 */
import { gSharedWithMe }    from '../core/graph.js';
import { esc, fmtDate }     from '../utils/format.js';
import { showToast }        from '../utils/toast.js';

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">🔗</div>
    <div class="page-header-info">
      <h2>Partilhado Comigo</h2>
      <p>Ficheiros e pastas partilhadas pelo OneDrive institucional</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm" id="btn-load-shared">🔄 Atualizar</button>
    </div>
  </div>
  <div class="pad">
    <div class="tbl-scroll">
      <div class="tbl-wrap" id="shared-panel">
        <div style="padding:var(--sp-4)">
          <div class="skel skel-text"></div>
          <div class="skel skel-text short"></div>
        </div>
      </div>
    </div>
  </div>`;
  container.querySelector('#btn-load-shared')?.addEventListener('click', () => _load());
  _load();
}

export function refresh(_container) { _load(); }

async function _load() {
  const wrap = document.getElementById('shared-panel');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:var(--sp-3)">
    ${Array(4).fill('<div class="skel skel-text" style="margin-bottom:8px"></div>').join('')}
  </div>`;
  try {
    const r     = await gSharedWithMe();
    const items = r.value ?? [];
    if (!items.length) {
      wrap.innerHTML = `<div class="empty"><div class="empty-icon">🔗</div>
        <h3>Sem partilhas</h3><p>Nenhum ficheiro foi partilhado consigo.</p></div>`;
      return;
    }
    const rows = items.map(f => {
      const name = f.name ?? f.remoteItem?.name ?? '—';
      const by   = f.remoteItem?.shared?.owner?.user?.displayName ?? '—';
      const dt   = fmtDate(f.lastModifiedDateTime);
      const url  = f.remoteItem?.webUrl ?? f.webUrl ?? '';
      return `<tr>
        <td class="td-name">📄 ${esc(name)}</td>
        <td>${esc(by)}</td>
        <td class="td-muted">${esc(dt)}</td>
        <td>
          ${url ? `<button class="btn btn-ghost btn-sm"
            onclick="openFileUrl('${esc(url)}','${esc(name)}')"
            aria-label="Abrir ${esc(name)}">🔗 Abrir</button>` : '—'}
        </td>
      </tr>`;
    }).join('');
    wrap.innerHTML = `
      <table class="tbl" aria-label="Ficheiros partilhados comigo">
        <thead><tr>
          <th scope="col">Nome</th>
          <th scope="col">Partilhado por</th>
          <th scope="col">Data</th>
          <th scope="col">Ações</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch (e) {
    wrap.innerHTML = `<div class="empty"><p style="color:var(--danger)">${esc(e.message)}</p></div>`;
    showToast('⚠️ Erro ao carregar partilhas: ' + e.message.slice(0,60), 'danger');
  }
}
