/**
 * views/mabe.js — Domínios MABE com autoavaliação
 */
import { getState }   from '../core/store.js';
import { gGetByPath } from '../core/graph.js';
import { openModal }  from '../utils/modal.js';
import { showToast }  from '../utils/toast.js';
import { esc }        from '../utils/format.js';
import { goView }     from '../main.js';
import MABE_DEF       from '../data/mabe.json' assert { type: 'json' };

const BE = 'BE-ESP';

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">🏆</div>
    <div class="page-header-info">
      <h2>Domínios MABE</h2>
      <p>Autoavaliação · Evidências · RBE 2018 · Ciclo 2025–2026</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm" id="mabe-export-pdf">📄 Exportar</button>
    </div>
  </div>
  <div class="pad" id="mabe-view"></div>`;
  container.querySelector('#mabe-export-pdf')?.addEventListener('click', () =>
    import('../utils/export-pdf.js').then(m => m.exportKpiPDF?.()));
  refresh(container);
}

export function refresh(_container) { _render(); }

function _render() {
  const view = document.getElementById('mabe-view');
  if (!view) return;

  /* Ciclo MABE */
  const ciclo = `
    <div class="card" style="margin-bottom:var(--sp-4)">
      <h3>📌 Ciclo MABE — 2 anos (RBE 2018)</h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2);margin-top:var(--sp-2)">
        ${[
          ['ANO 1 · SET','Diagnóstico + PM','var(--info-l)','var(--info)'],
          ['ANO 1 · JUN','Relatório Execução','var(--ok-l)','var(--ok)'],
          ['ANO 2 · OUT–MAI','Execução + Evidências','var(--mod-pedagogia-l)','var(--mod-pedagogia)'],
          ['ANO 2 · MAI–JUN','Avaliação + RAA + novo PM','var(--warn-l)','var(--warn)'],
        ].map(([n,l,bg,c]) => `
          <div style="background:${bg};border-radius:var(--r-sm);padding:var(--sp-2);text-align:center">
            <div style="font-size:.65rem;font-weight:800;color:${c}">${n}</div>
            <div style="font-size:.7rem;color:${c};margin-top:2px">${l}</div>
          </div>`).join('')}
      </div>
    </div>`;

  const domains = MABE_DEF.map(d => {
    const COLOR = {
      A: { bg:'var(--info-l)',            text:'var(--info)',          border:'#bfdbfe' },
      B: { bg:'var(--ok-l)',              text:'var(--ok)',            border:'#a7f3d0' },
      C: { bg:'var(--mod-pedagogia-l)',   text:'var(--mod-pedagogia)', border:'#ddd6fe' },
      D: { bg:'var(--warn-l)',            text:'var(--warn)',          border:'#fde68a' },
    }[d.domain];

    return `
    <div class="mabe-card mabe-${d.domain}" style="border-color:${COLOR.border}40">
      <div class="mabe-header">
        <span class="mabe-letter" aria-hidden="true">${d.domain}</span>
        <div>
          <div class="mabe-title">${esc(d.title)}</div>
          <div class="mabe-sub">${d.subs.map(esc).join(' · ')}</div>
        </div>
      </div>
      <div class="mabe-body">
        <div class="g2">
          <div>
            <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;
              color:var(--grey-400);margin-bottom:var(--sp-2)">POPs e Formulários</div>
            ${d.pops.map(p => `<div style="font-size:.75rem;padding:2px 0">• ${esc(p)}</div>`).join('')}
            ${d.forms.map(f => `<div style="font-size:.75rem;padding:2px 0">• ${esc(f)}</div>`).join('')}
            <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;
              color:var(--grey-400);margin:var(--sp-2) 0 var(--sp-1)">Pasta OneDrive</div>
            <div style="font-family:var(--font-mono);font-size:.68rem;color:var(--info)">
              📁 ${esc(BE)}/${esc(d.folder)}/
            </div>
          </div>
          <div>
            <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;
              color:var(--grey-400);margin-bottom:var(--sp-2)">KPIs</div>
            ${d.kpi.map(k => `<div style="font-size:.75rem;padding:2px 0">• ${esc(k)}</div>`).join('')}
            <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;
              color:var(--grey-400);margin:var(--sp-2) 0 var(--sp-1)">Níveis 1–4</div>
            ${d.levels.map((l,i) => `
              <div style="font-size:.7rem;padding:2px 0;display:flex;gap:5px">
                <span style="background:${COLOR.bg};color:${COLOR.text};font-weight:800;
                  border-radius:3px;padding:0 4px;flex-shrink:0">${i+1}</span>${esc(l)}
              </div>`).join('')}
          </div>
        </div>
        <div style="margin-top:var(--sp-3);padding-top:var(--sp-2);
          border-top:1px solid var(--grey-200);display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="goView('evidencias')"
            aria-label="Ver evidências domínio ${d.domain}">🗂️ Evidências</button>
          <button class="btn btn-ghost btn-sm"
            onclick="openModal('modal-upload');
              document.getElementById('up-mabe').value='${d.domain}';
              window.calcUploadPath?.()"
            aria-label="Carregar evidência domínio ${d.domain}">⬆️ Carregar</button>
          <button class="btn btn-ghost btn-sm"
            onclick="_browseMABE('${esc(d.folder)}')"
            aria-label="Ver pasta ${esc(d.folder)}">📁 Ver pasta</button>
        </div>
      </div>
    </div>`;
  }).join('');

  view.innerHTML = ciclo + domains;
}

window._browseMABE = async function(pasta) {
  try {
    const r = await gGetByPath(`${BE}/${pasta}`);
    import('../core/store.js').then(({ setState }) => {
      setState('currentFolderId', r.id);
      setState('currentFolderName', pasta.split('/').pop());
    });
    goView('ficheiros');
  } catch { showToast(`⚠️ Pasta "${pasta.split('/').pop()}" não encontrada no OneDrive.`, 'warn'); }
};
