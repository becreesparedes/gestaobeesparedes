/**
 * views/pedagogia.js — Hub do módulo Pedagogia e Literacias
 */
import { esc } from '../utils/format.js';
import { goView } from '../main.js';

const SECTIONS = [
  { id:'atividades', icon:'📖', title:'Atividades Pedagógicas',  desc:'Registo com pasta automática no OneDrive',           color:'var(--mod-pedagogia)' },
  { icon:'🎓', title:'Articulação Curricular',  desc:'Departamentos, turmas e planificações conjuntas',  folder:'03_Pedagogia_e_Literacias/01_Articulação_Curricular' },
  { icon:'💡', title:'Literacias',              desc:'Informação, media, digital e leitura',              folder:'03_Pedagogia_e_Literacias/02_Literacias' },
  { icon:'📚', title:'Promoção da Leitura',     desc:'Plano anual, clubes, autores e campanhas',          folder:'03_Pedagogia_e_Literacias/03_Promoção_da_Leitura' },
  { icon:'🤝', title:'Projetos e Parcerias',   desc:'Parcerias internas e externas',                     folder:'03_Pedagogia_e_Literacias/05_Projetos_e_Parcerias' },
];

export function init(container) {
  container.innerHTML = `
  <div class="page-header" style="border-left:4px solid var(--mod-pedagogia)">
    <div class="page-header-icon" aria-hidden="true">🎓</div>
    <div class="page-header-info">
      <h2>Pedagogia e Literacias</h2>
      <p>Articulação curricular, literacias, promoção da leitura e projetos</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-nova-ativ')">+ Nova atividade</button>
    </div>
  </div>
  <div class="pad">
    <div class="g3" style="margin-bottom:var(--sp-5)">
      ${SECTIONS.map(s => `
        <div class="module-card mc-pedagogia card-hover"
          onclick="${s.id ? `goView('${s.id}')` : `_browseMABE('${esc(s.folder)}')`}"
          role="button" tabindex="0"
          aria-label="${esc(s.title)}"
          onkeydown="if(event.key==='Enter'||event.key===' '){${s.id ? `goView('${s.id}')` : `_browseMABE('${esc(s.folder)}')`}}">
          <div class="module-card-icon" aria-hidden="true">${s.icon}</div>
          <div class="module-card-name">${esc(s.title)}</div>
          <div class="module-card-desc">${esc(s.desc)}</div>
        </div>`).join('')}
    </div>

    <!-- Articulação curricular — sub-pastas -->
    <div class="sec-hdr mb-3 mt-4"><h3>🎓 Articulação Curricular</h3><div class="sec-line"></div></div>
    <div class="card" style="margin-bottom:var(--sp-3)">
      ${['01_Departamentos','02_Acompanhamento_de_Turmas','03_Planificações_Conjuntas',
         '04_Sessões_de_Trabalho','05_Instrumentos_de_Articulação'].map(sub => `
        <div class="file-item" role="button" tabindex="0"
          onclick="_browseMABE('03_Pedagogia_e_Literacias/01_Articulação_Curricular/${esc(sub)}')"
          onkeydown="if(event.key==='Enter')_browseMABE('03_Pedagogia_e_Literacias/01_Articulação_Curricular/${esc(sub)}')"
          aria-label="Abrir ${esc(sub.replace(/_/g,' '))}">
          <span class="file-icon" aria-hidden="true">📁</span>
          <span class="file-name">${esc(sub.replace(/^\d+_/, '').replace(/_/g,' '))}</span>
        </div>`).join('')}
    </div>

    <!-- Promoção da leitura — sub-pastas -->
    <div class="sec-hdr mb-3 mt-4"><h3>📚 Promoção da Leitura</h3><div class="sec-line"></div></div>
    <div class="card">
      ${['01_Plano_Anual','02_Clubes_de_Leitura','03_Campanhas_e_Ações',
         '04_Encontros_com_Autores','05_Listas_e_Sugestões_de_Leitura'].map(sub => `
        <div class="file-item" role="button" tabindex="0"
          onclick="_browseMABE('03_Pedagogia_e_Literacias/03_Promoção_da_Leitura/${esc(sub)}')"
          onkeydown="if(event.key==='Enter')_browseMABE('03_Pedagogia_e_Literacias/03_Promoção_da_Leitura/${esc(sub)}')"
          aria-label="Abrir ${esc(sub.replace(/_/g,' '))}">
          <span class="file-icon" aria-hidden="true">📁</span>
          <span class="file-name">${esc(sub.replace(/^\d+_/, '').replace(/_/g,' '))}</span>
        </div>`).join('')}
    </div>
  </div>`;
}

export function refresh() {}
