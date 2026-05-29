/**
 * views/comunicacao.js — Hub Comunicação e Imagem
 */
import { getState, setState } from '../core/store.js';
import { saveLocal, addHistory } from '../core/sync.js';
import { openModal }             from '../utils/modal.js';
import { showToast }             from '../utils/toast.js';
import { esc, fmtDate }          from '../utils/format.js';

const SECTIONS = [
  { icon:'📋', title:'Plano de Comunicação',   desc:'Públicos, canais, calendário e mensagens',        folder:'06_Comunicação_e_Imagem/01_Plano_de_Comunicação' },
  { icon:'📰', title:'Newsletter e Notícias',  desc:'Edições mensais e arquivo',                       folder:'06_Comunicação_e_Imagem/02_Newsletter_e_Notícias' },
  { icon:'📱', title:'Redes Sociais',           desc:'Plano editorial, publicações e métricas',         folder:'06_Comunicação_e_Imagem/03_Redes_Sociais' },
  { icon:'🎨', title:'Identidade Visual',       desc:'Templates, cores, logótipo e sinalética',        folder:'06_Comunicação_e_Imagem/04_Identidade_Visual' },
  { icon:'🌐', title:'Website e Páginas Digitais', desc:'Site da BE, SharePoint e páginas escolares',  folder:'06_Comunicação_e_Imagem/05_Website_e_Páginas_Digitais' },
  { icon:'📢', title:'Campanhas e Divulgação', desc:'Cartazes, flyers e comunicação externa',          folder:'06_Comunicação_e_Imagem/06_Campanhas_e_Divulgação' },
];

const REDES_SUBS = [
  { label:'Plano Editorial',       folder:'06_Comunicação_e_Imagem/03_Redes_Sociais/01_Plano_Editorial' },
  { label:'Imagens Autorizadas',   folder:'06_Comunicação_e_Imagem/03_Redes_Sociais/02_Imagens_Autorizadas' },
  { label:'Padrões de Publicação', folder:'06_Comunicação_e_Imagem/03_Redes_Sociais/03_Padrões_de_Publicação' },
  { label:'Arquivo de Publicações',folder:'06_Comunicação_e_Imagem/03_Redes_Sociais/04_Arquivo_de_Publicações' },
  { label:'Métricas de Impacto',   folder:'06_Comunicação_e_Imagem/03_Redes_Sociais/05_Métricas_de_Impacto' },
];

export function init(container) {
  container.innerHTML = `
  <div class="page-header" style="border-left:4px solid var(--mod-comunicacao)">
    <div class="page-header-icon" aria-hidden="true">📣</div>
    <div class="page-header-info">
      <h2>Comunicação e Imagem</h2>
      <p>Plano de comunicação, newsletter, redes sociais e identidade visual</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-newsletter')">📣 Nova publicação</button>
    </div>
  </div>
  <div class="pad">

    <!-- Cards de secção -->
    <div class="g3" style="margin-bottom:var(--sp-5)">
      ${SECTIONS.map(s => `
        <div class="module-card mc-comunicacao card-hover"
          onclick="_browseMABE('${esc(s.folder)}')"
          role="button" tabindex="0"
          aria-label="${esc(s.title)}"
          onkeydown="if(event.key==='Enter'||event.key===' ')_browseMABE('${esc(s.folder)}')">
          <div class="module-card-icon" aria-hidden="true">${s.icon}</div>
          <div class="module-card-name">${esc(s.title)}</div>
          <div class="module-card-desc">${esc(s.desc)}</div>
        </div>`).join('')}
    </div>

    <!-- Registo de publicações -->
    <div class="sec-hdr mb-3">
      <h3>📰 Registo de publicações</h3>
      <div class="sec-line"></div>
      <button class="sec-action" onclick="openModal('modal-newsletter')">+ Nova →</button>
    </div>
    <div id="nl-list" style="margin-bottom:var(--sp-5)"></div>

    <!-- Redes Sociais sub-pastas -->
    <div class="sec-hdr mb-3 mt-4">
      <h3>📱 Redes Sociais — sub-pastas</h3>
      <div class="sec-line"></div>
    </div>
    <div class="card" style="margin-bottom:var(--sp-3)">
      ${REDES_SUBS.map(s => `
        <div class="file-item" role="button" tabindex="0"
          onclick="_browseMABE('${esc(s.folder)}')"
          onkeydown="if(event.key==='Enter')_browseMABE('${esc(s.folder)}')"
          aria-label="Abrir ${esc(s.label)}">
          <span class="file-icon" aria-hidden="true">📁</span>
          <span class="file-name">${esc(s.label)}</span>
          <span class="file-meta" style="font-family:var(--font-mono);font-size:.62rem">
            ${esc(s.folder.split('/').pop())}
          </span>
        </div>`).join('')}
    </div>

    <!-- POP relacionado -->
    <div class="sec-hdr mb-3 mt-4">
      <h3>📋 Procedimento associado</h3>
      <div class="sec-line"></div>
    </div>
    <div class="card">
      <div class="file-item">
        <span class="file-icon" aria-hidden="true">📋</span>
        <span class="file-name td-code">POP-COM-01</span>
        <span class="file-meta">Newsletter mensal da BE · Mensal (out–jun)</span>
        <button class="btn btn-ghost btn-sm" onclick="_openPOP('POP-COM-01')"
          aria-label="Abrir POP-COM-01">📄 Ver</button>
      </div>
    </div>
  </div>`;

  _renderNL();
}

export function refresh(_container) { _renderNL(); }

function _renderNL() {
  const el = document.getElementById('nl-list');
  if (!el) return;
  const nl = (getState('newsletter') ?? []).slice(0, 10);
  if (!nl.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📰</div>
      <p>Sem publicações registadas. Clique em "+ Nova" para começar.</p></div>`;
    return;
  }
  el.innerHTML = `
    <div class="tbl-scroll">
      <div class="tbl-wrap">
        <table class="tbl" aria-label="Registo de publicações">
          <thead><tr>
            <th scope="col">Título</th>
            <th scope="col">Tipo</th>
            <th scope="col">Data</th>
            <th scope="col">Registado por</th>
            <th scope="col">Ações</th>
          </tr></thead>
          <tbody>
            ${nl.map(n => `<tr>
              <td class="td-name">${esc(n.titulo)}</td>
              <td><span class="badge badge-info">${esc(n.tipo)}</span></td>
              <td class="td-muted">${esc(fmtDate(n.data))}</td>
              <td class="td-muted">${esc(n.createdAt ?? '—')}</td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="_deleteNL(${n.id})"
                  aria-label="Eliminar publicação ${esc(n.titulo)}">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

window._deleteNL = function(id) {
  if (!confirm('Eliminar esta publicação?')) return;
  const nl = (getState('newsletter') ?? []).filter(n => n.id !== id);
  setState('newsletter', nl);
  saveLocal();
  _renderNL();
  showToast('🗑️ Publicação eliminada');
};
