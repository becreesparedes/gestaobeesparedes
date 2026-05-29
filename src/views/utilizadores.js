/**
 * views/utilizadores.js — Hub do módulo Utilizadores e Serviços
 */
import { esc } from '../utils/format.js';

const SECTIONS = [
  { icon:'👤', title:'Registo',    desc:'Alunos, docentes, não docentes e outros utilizadores', folder:'05_Utilizadores_e_Serviços/01_Registo_de_Utilizadores' },
  { icon:'📗', title:'Empréstimos',desc:'Domiciliário, sala de aula e interbibliotecas',         folder:'05_Utilizadores_e_Serviços/02_Empréstimo_Domiciliário'  },
  { icon:'🔍', title:'Apoio',      desc:'Pesquisa, estudo e atendimento individual',             folder:'02_Organização_e_Operação/03_Serviços_de_Referência'    },
  { icon:'⚠️', title:'Ocorrências',desc:'Reclamações, atrasos, danos e extravios',              folder:'05_Utilizadores_e_Serviços/06_Reclamações_e_Ocorrências' },
];

const SUBSECTIONS = [
  { title:'Empréstimo Domiciliário', items:[
    { label:'Regras Gerais',          folder:'05_Utilizadores_e_Serviços/02_Empréstimo_Domiciliário/01_Regras_Gerais' },
    { label:'Prazos',                 folder:'05_Utilizadores_e_Serviços/02_Empréstimo_Domiciliário/02_Prazos' },
    { label:'Renovações',             folder:'05_Utilizadores_e_Serviços/02_Empréstimo_Domiciliário/03_Renovações' },
    { label:'Atrasos',                folder:'05_Utilizadores_e_Serviços/02_Empréstimo_Domiciliário/04_Atrasos' },
    { label:'Extravio e Danos',       folder:'05_Utilizadores_e_Serviços/02_Empréstimo_Domiciliário/05_Extravio_e_Danos' },
  ]},
  { title:'Outros Serviços', items:[
    { label:'Sala de Aula',           folder:'05_Utilizadores_e_Serviços/03_Empréstimo_Sala_de_Aula' },
    { label:'Interbibliotecas',       folder:'05_Utilizadores_e_Serviços/04_Empréstimo_Interbibliotecas' },
    { label:'Atendimento e Apoio',    folder:'05_Utilizadores_e_Serviços/05_Atendimento_e_Apoio' },
  ]},
];

export function init(container) {
  container.innerHTML = `
  <div class="page-header" style="border-left:4px solid var(--mod-utilizadores)">
    <div class="page-header-icon" aria-hidden="true">👥</div>
    <div class="page-header-info">
      <h2>Utilizadores e Serviços</h2>
      <p>Registo, empréstimos, apoio e ocorrências</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-emprestimo')">📗 Novo empréstimo</button>
    </div>
  </div>
  <div class="pad">
    <div class="g4" style="margin-bottom:var(--sp-5)">
      ${SECTIONS.map(s => `
        <div class="module-card mc-utilizadores card-hover"
          onclick="_browseMABE('${esc(s.folder)}')"
          role="button" tabindex="0"
          aria-label="${esc(s.title)}"
          onkeydown="if(event.key==='Enter'||event.key===' ')_browseMABE('${esc(s.folder)}')">
          <div class="module-card-icon" aria-hidden="true">${s.icon}</div>
          <div class="module-card-name">${esc(s.title)}</div>
          <div class="module-card-desc">${esc(s.desc)}</div>
        </div>`).join('')}
    </div>
    ${SUBSECTIONS.map(sec => `
      <div class="sec-hdr mb-3 mt-4"><h3>${esc(sec.title)}</h3><div class="sec-line"></div></div>
      <div class="card" style="margin-bottom:var(--sp-3)">
        ${sec.items.map(item => `
          <div class="file-item" role="button" tabindex="0"
            onclick="_browseMABE('${esc(item.folder)}')"
            onkeydown="if(event.key==='Enter')_browseMABE('${esc(item.folder)}')"
            aria-label="Abrir pasta ${esc(item.label)}">
            <span class="file-icon" aria-hidden="true">📁</span>
            <span class="file-name">${esc(item.label)}</span>
            <span class="file-meta" style="font-family:var(--font-mono);font-size:.62rem">${esc(item.folder.split('/').pop())}</span>
          </div>`).join('')}
      </div>`).join('')}

    <!-- POPs relacionados -->
    <div class="sec-hdr mb-3 mt-4"><h3>📋 POPs relacionados</h3><div class="sec-line"></div></div>
    <div class="card">
      ${['POP-UTI-01','POP-EMP-01','POP-DEV-01','POP-REN-01','POP-ATR-01','POP-EXT-01','POP-ESA-01','POP-EIB-01','POP-REF-01'].map(code => `
        <div class="file-item">
          <span class="file-icon" aria-hidden="true">📋</span>
          <span class="file-name td-code">${esc(code)}</span>
          <button class="btn btn-ghost btn-sm" onclick="_openPOP('${esc(code)}')"
            aria-label="Abrir ${esc(code)}">📄 Ver</button>
        </div>`).join('')}
    </div>
  </div>`;
}

export function refresh() {}
