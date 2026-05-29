/**
 * views/avaliacao.js — Hub do módulo Avaliação e Melhoria
 */
import { esc } from '../utils/format.js';
import { goView } from '../main.js';

const SECTIONS = [
  { id:'mabe',       icon:'🏆', title:'MABE',              desc:'Autoavaliação, domínios A–D e evidências'      },
  { id:'kpi',        icon:'📈', title:'Indicadores KPI',   desc:'15 indicadores MABE actualizados e exportáveis' },
  { id:'evidencias', icon:'🗂️', title:'Evidências',        desc:'Ficheiros por domínio directamente do OneDrive' },
  { id:'relatorios', icon:'📑', title:'Relatórios',        desc:'RAA, MABE, SI-RBE com checklists de preparação' },
];

const FOLDERS = [
  { label:'MABE — Domínio A',    folder:'07_Avaliação_e_Melhoria/01_MABE/01_Domínio_A' },
  { label:'MABE — Domínio B',    folder:'07_Avaliação_e_Melhoria/01_MABE/02_Domínio_B' },
  { label:'MABE — Domínio C',    folder:'07_Avaliação_e_Melhoria/01_MABE/03_Domínio_C' },
  { label:'MABE — Domínio D',    folder:'07_Avaliação_e_Melhoria/01_MABE/04_Domínio_D' },
  { label:'Relatório Final MABE',folder:'07_Avaliação_e_Melhoria/01_MABE/05_Relatório_Final' },
  { label:'Indicadores e Stats', folder:'07_Avaliação_e_Melhoria/02_Indicadores_e_Stats' },
  { label:'Dashboard',           folder:'07_Avaliação_e_Melhoria/03_Dashboard' },
  { label:'Plano de Melhoria',   folder:'07_Avaliação_e_Melhoria/04_Plano_de_Melhoria' },
  { label:'Relatórios Anuais',   folder:'07_Avaliação_e_Melhoria/05_Relatórios_Anuais' },
  { label:'Questionários e Evidências', folder:'07_Avaliação_e_Melhoria/06_Questionários_e_Evidências' },
];

export function init(container) {
  container.innerHTML = `
  <div class="page-header" style="border-left:4px solid var(--mod-avaliacao)">
    <div class="page-header-icon" aria-hidden="true">📊</div>
    <div class="page-header-info">
      <h2>Avaliação e Melhoria</h2>
      <p>MABE, indicadores, plano de melhoria e relatórios anuais</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm" onclick="goView('kpi')">📈 KPIs</button>
      <button class="btn btn-primary btn-sm" onclick="goView('mabe')">🏆 MABE</button>
    </div>
  </div>
  <div class="pad">

    <!-- Cards de navegação -->
    <div class="g4" style="margin-bottom:var(--sp-5)">
      ${SECTIONS.map(s => `
        <div class="module-card mc-avaliacao card-hover"
          onclick="goView('${esc(s.id)}')"
          role="button" tabindex="0"
          aria-label="Ir para ${esc(s.title)}"
          onkeydown="if(event.key==='Enter'||event.key===' ')goView('${esc(s.id)}')">
          <div class="module-card-icon" aria-hidden="true">${s.icon}</div>
          <div class="module-card-name">${esc(s.title)}</div>
          <div class="module-card-desc">${esc(s.desc)}</div>
        </div>`).join('')}
    </div>

    <!-- Prazos críticos -->
    <div class="sec-hdr mb-3">
      <h3>⏱ Prazos críticos</h3><div class="sec-line"></div>
    </div>
    <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-5)">
      ${[
        { label:'PAA-BE até 30/set', badge:'badge-info',   icon:'📋' },
        { label:'RAA até 30/jun',    badge:'badge-red',    icon:'📑' },
        { label:'MABE até 30/jun',   badge:'badge-amber',  icon:'🏆' },
        { label:'SI-RBE após RAA',   badge:'badge-info',   icon:'💻' },
      ].map(p => `
        <div class="alert alert-${p.badge === 'badge-red' ? 'danger' : p.badge === 'badge-amber' ? 'warn' : 'info'}"
          style="flex:1;min-width:160px;cursor:default">
          <div class="alert-icon" aria-hidden="true">${p.icon}</div>
          <div class="alert-body">
            <div class="alert-title">${esc(p.label)}</div>
          </div>
        </div>`).join('')}
    </div>

    <!-- Pastas OneDrive -->
    <div class="sec-hdr mb-3">
      <h3>📁 Pastas OneDrive — 07_Avaliação_e_Melhoria</h3>
      <div class="sec-line"></div>
    </div>
    <div class="card">
      ${FOLDERS.map(f => `
        <div class="file-item" role="button" tabindex="0"
          onclick="_browseMABE('${esc(f.folder)}')"
          onkeydown="if(event.key==='Enter')_browseMABE('${esc(f.folder)}')"
          aria-label="Abrir pasta ${esc(f.label)}">
          <span class="file-icon" aria-hidden="true">📁</span>
          <span class="file-name">${esc(f.label)}</span>
          <span class="file-meta" style="font-family:var(--font-mono);font-size:.62rem">
            ${esc(f.folder.split('/').pop())}
          </span>
        </div>`).join('')}
    </div>
  </div>`;
}

export function refresh() {}
