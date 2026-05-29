/**
 * views/criticos.js — Documentos críticos de acesso rápido
 */
import { getState }   from '../core/store.js';
import { gSearch }    from '../core/graph.js';
import { showToast }  from '../utils/toast.js';
import { esc }        from '../utils/format.js';
import CRITICOS       from '../data/criticos.json' assert { type: 'json' };

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">⚡</div>
    <div class="page-header-info">
      <h2>Documentos Críticos</h2>
      <p>Acesso rápido aos documentos mais importantes da BE-ESP</p>
    </div>
  </div>
  <div class="pad" id="criticos-panel"></div>`;
  refresh(container);
}

export function refresh(_container) { _render(); }

function _render() {
  const panel = document.getElementById('criticos-panel');
  if (!panel) return;
  const prioLbl = { h:'Alta prioridade', m:'Consulta frequente', l:'Registo periódico' };
  const prioBdg = { h:'badge-red', m:'badge-amber', l:'badge-info' };

  panel.innerHTML = `
    <div class="alert alert-info" style="margin-bottom:var(--sp-4)" role="note">
      <div class="alert-icon" aria-hidden="true">⚡</div>
      <div class="alert-body">
        <div class="alert-title">Acesso rápido</div>
        <div class="alert-desc">Clique em "Pesquisar" para encontrar e abrir directamente no OneDrive,
          ou em "Pasta" para navegar.</div>
      </div>
    </div>
    <div class="g2">
      ${CRITICOS.map(d => `
        <div class="card" id="crit-card-${esc(d.code)}">
          <div style="display:flex;align-items:flex-start;gap:var(--sp-2);margin-bottom:var(--sp-2)">
            <span style="font-size:22px;flex-shrink:0" aria-hidden="true">${d.icon}</span>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:.82rem;color:var(--brand);margin-bottom:3px">${esc(d.name)}</div>
              <span class="badge ${prioBdg[d.prio]}" style="font-size:.6rem">${esc(prioLbl[d.prio])}</span>
            </div>
          </div>
          <div class="card-desc" style="margin-bottom:var(--sp-2)">${esc(d.desc)}</div>
          <div style="font-size:.65rem;color:var(--grey-400);margin-bottom:var(--sp-3);font-family:var(--font-mono)">
            📁 ${esc(d.folder)}/
          </div>
          <div id="crit-status-${esc(d.code)}" style="font-size:.68rem;margin-bottom:6px;min-height:16px"></div>
          <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" id="crit-btn-${esc(d.code)}"
              onclick="_searchCritico('${esc(d.code)}')"
              aria-label="Pesquisar e abrir ${esc(d.name)}">🔍 Abrir</button>
            <button class="btn btn-ghost btn-sm"
              onclick="_browseMABE('${esc(d.folder)}')"
              aria-label="Ver pasta ${esc(d.folder)}">📁 Pasta</button>
          </div>
        </div>`).join('')}
    </div>`;
}

window._searchCritico = async function(code) {
  const def    = CRITICOS.find(d => d.code === code);
  if (!def) return;
  const btn    = document.getElementById('crit-btn-' + code);
  const status = document.getElementById('crit-status-' + code);
  if (btn)    { btn.disabled = true; btn.textContent = '⏳ A pesquisar…'; }
  if (status) { status.textContent = ''; }

  if (getState('demo')) {
    await new Promise(r => setTimeout(r, 500));
    if (btn)    { btn.disabled = false; btn.textContent = '🔍 Abrir'; }
    if (status) status.innerHTML = `<span style="color:var(--ok)">✅ [Demo] ${esc(def.name)}</span>`;
    showToast('🔍 [Demo] ' + code);
    return;
  }

  try {
    const r     = await gSearch(code, getState('rootId'));
    const items = (r.value ?? []).filter(x => !x.folder && x.name.toLowerCase().includes(code.toLowerCase()));
    const f     = items.sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime))[0];
    if (f?.webUrl && f.webUrl !== '#') {
      if (status) status.innerHTML = `<span style="color:var(--ok)">✅ ${esc(f.name)}</span>`;
      window.openFileUrl(f.webUrl, f.name);
    } else {
      if (status) status.innerHTML = `<span style="color:var(--warn)">⚠️ Não encontrado em <em>${esc(def.folder)}</em></span>`;
      showToast('⚠️ ' + code + ' não encontrado. Verifique a pasta.', 'warn');
    }
  } catch (e) {
    if (status) status.innerHTML = `<span style="color:var(--danger)">❌ ${esc(e.message.slice(0,50))}</span>`;
    showToast('⚠️ Erro: ' + e.message.slice(0, 60), 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔍 Abrir'; }
  }
};
