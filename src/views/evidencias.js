/**
 * views/evidencias.js — Evidências MABE por domínio (lazy load OneDrive)
 */
import { getState }          from '../core/store.js';
import { gGetByPath,
         gChildren }         from '../core/graph.js';
import { openModal }         from '../utils/modal.js';
import { esc, fmtDate,
         fmtSize, fileIcon } from '../utils/format.js';
import { goView }            from '../main.js';

const BE = 'BE-ESP';
const EV_PASTAS = {
  A: { pasta:'03_Pedagogia_e_Literacias/01_Articulação_Curricular', titulo:'A — Currículo, Literacias e Aprendizagem', cor:'badge-blue', icon:'📚' },
  B: { pasta:'03_Pedagogia_e_Literacias/03_Promoção_da_Leitura',    titulo:'B — Leitura e Literacia',                  cor:'badge-green',icon:'📖' },
  C: { pasta:'03_Pedagogia_e_Literacias/05_Projetos_e_Parcerias',   titulo:'C — Projetos e Parcerias',                 cor:'badge-purple',icon:'🤝' },
  D: { pasta:'07_Avaliação_e_Melhoria/01_MABE',                     titulo:'D — Gestão da Biblioteca Escolar',         cor:'badge-amber', icon:'📊' },
};

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">🗂️</div>
    <div class="page-header-info">
      <h2>Evidências MABE</h2>
      <p>Ficheiros por domínio · Lidos do OneDrive em tempo real</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-upload');
        document.getElementById('up-type').value='EV';window.calcUploadPath?.()">⬆️ Carregar</button>
    </div>
  </div>
  <div class="pad" id="evidencias-view"></div>`;
  refresh(container);
}

export function refresh(_container) { _renderShell(); _loadAll(); }

function _renderShell() {
  const view = document.getElementById('evidencias-view');
  if (!view) return;
  view.innerHTML = Object.entries(EV_PASTAS).map(([dom, cfg]) => `
    <div class="card" style="margin-bottom:var(--sp-4)" aria-label="Evidências domínio ${dom}">
      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3);flex-wrap:wrap">
        <span style="font-size:22px" aria-hidden="true">${cfg.icon}</span>
        <div style="flex:1;min-width:0">
          <h3 style="margin:0">
            <span class="badge ${cfg.cor}" style="margin-right:6px">${dom}</span>${esc(cfg.titulo)}
          </h3>
          <div style="font-size:.65rem;color:var(--grey-400);font-family:var(--font-mono);margin-top:2px">
            📁 ${esc(BE)}/${esc(cfg.pasta)}/
          </div>
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm"
            onclick="_browseMABE('${esc(cfg.pasta)}')"
            aria-label="Explorar pasta domínio ${dom}">📁 Explorar</button>
          <button class="btn btn-primary btn-sm"
            onclick="openModal('modal-upload');
              document.getElementById('up-type').value='EV';
              document.getElementById('up-mabe').value='${dom}';
              window.calcUploadPath?.()"
            aria-label="Adicionar evidência domínio ${dom}">⬆️ Adicionar</button>
        </div>
      </div>
      <div id="ev-dom-${dom}" role="list" aria-label="Ficheiros evidência domínio ${dom}">
        <div style="display:flex;gap:6px;padding:6px 0">
          ${[1,2,3].map(()=>'<div class="skel" style="height:10px;flex:1;border-radius:4px"></div>').join('')}
        </div>
      </div>
    </div>`).join('');
}

async function _loadAll() {
  await Promise.all(Object.entries(EV_PASTAS).map(([dom, cfg]) => _loadDomain(dom, cfg)));
}

async function _loadDomain(dom, cfg) {
  const container = document.getElementById('ev-dom-' + dom);
  if (!container) return;
  try {
    const item  = await gGetByPath(`${BE}/${cfg.pasta}`);
    const ch    = await gChildren(item.id);
    const todos = (ch.value ?? []).filter(f => !f.folder);
    const items = [...todos]
      .sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime))
      .slice(0, 15);

    if (!items.length) {
      container.innerHTML = `<div class="empty" style="padding:var(--sp-3) 0">
        <p>Sem evidências nesta pasta.</p>
        <p style="font-size:.67rem;margin-top:4px">Carregue ficheiros com o botão "Adicionar".</p>
      </div>`;
      return;
    }

    const extra = todos.length > 15
      ? `<div style="font-size:.65rem;color:var(--grey-400);margin-bottom:6px">
          A mostrar 15 de ${todos.length} ·
          <button style="font-size:.65rem;color:var(--info);background:none;border:none;cursor:pointer;padding:0"
            onclick="_browseMABE('${esc(cfg.pasta)}')">ver todos →</button>
         </div>`
      : '';

    container.innerHTML = extra + items.map(f => {
      const dt = fmtDate(f.lastModifiedDateTime);
      return `
      <div class="file-item" role="listitem">
        <span class="file-icon" aria-hidden="true">${fileIcon(f.name)}</span>
        <span class="file-name" title="${esc(f.name)}">${esc(f.name)}</span>
        <span class="file-meta">${fmtSize(f.size)}</span>
        <span class="file-meta" style="min-width:62px;text-align:right">${esc(dt)}</span>
        <div class="file-actions">
          ${f.webUrl && f.webUrl !== '#'
            ? `<button class="btn btn-ghost btn-sm"
                onclick="openFileUrl('${esc(f.webUrl)}','${esc(f.name)}')"
                aria-label="Abrir ${esc(f.name)}">🔗</button>`
            : ''}
        </div>
      </div>`;
    }).join('');
  } catch {
    container.innerHTML = `<div class="empty" style="padding:var(--sp-2) 0">
      <p style="color:var(--warn)">⚠️ Pasta não encontrada no OneDrive.</p>
      <p style="font-size:.67rem;margin-top:4px">Crie <code>${esc(cfg.pasta)}</code> dentro de <code>BE-ESP</code>.</p>
    </div>`;
  }
}
