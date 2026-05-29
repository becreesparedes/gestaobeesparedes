/**
 * views/gestao.js — Hub do módulo Gestão Documental
 */
import { esc } from '../utils/format.js';
import { goView } from '../main.js';

const SECTIONS = [
  { id:'pops',       icon:'📋', title:'POPs',                     desc:'38 Procedimentos Operacionais Padrão',        color:'var(--mod-gestao)' },
  { id:'formularios',icon:'📝', title:'Formulários F01–F18',       desc:'Modelos prontos a usar e carregar',           color:'var(--mod-gestao)' },
  { id:'checklists', icon:'☑️', title:'Checklists',               desc:'Abertura, encerramento, desbaste e mais',    color:'var(--mod-gestao)' },
  { id:'ficheiros',  icon:'📁', title:'Explorador OneDrive',       desc:'Navegar nas pastas 02 a 04',                  color:'var(--mod-gestao)' },
  { id:'criticos',   icon:'⚡', title:'Documentos Críticos',       desc:'Acesso rápido aos ficheiros mais importantes',color:'var(--mod-gestao)' },
];

const SUBSECTIONS = [
  { title:'Gestão Documental', items:[
    { label:'Aquisição',         folder:'02_Organização_e_Operação/01_Gestão_Documental/01_Aquisição' },
    { label:'Registo e Inventário', folder:'02_Organização_e_Operação/01_Gestão_Documental/02_Registo_e_Inventário' },
    { label:'Catalogação',       folder:'02_Organização_e_Operação/01_Gestão_Documental/04_Catalogação' },
    { label:'Classificação CDU', folder:'02_Organização_e_Operação/01_Gestão_Documental/05_Classificação_CDU' },
    { label:'Desbaste',          folder:'02_Organização_e_Operação/01_Gestão_Documental/09_Desbaste' },
  ]},
  { title:'Recursos e Coleção', items:[
    { label:'PDC — Política de Desenvolvimento', folder:'04_Recursos_e_Coleção/01_Política_de_Desenvolvimento_da_Coleção' },
    { label:'Tratamento Técnico',                folder:'04_Recursos_e_Coleção/03_Tratamento_Técnico' },
    { label:'Conservação e Preservação',         folder:'04_Recursos_e_Coleção/04_Conservação_e_Preservação' },
    { label:'Desbaste',                          folder:'04_Recursos_e_Coleção/05_Desbaste' },
    { label:'RED e Repositório Digital',         folder:'04_Recursos_e_Coleção/06_RED_e_Repositório_Digital' },
  ]},
];

export function init(container) {
  container.innerHTML = `
  <div class="page-header mod-gestao" style="border-left:4px solid var(--mod-gestao)">
    <div class="page-header-icon" aria-hidden="true">📚</div>
    <div class="page-header-info">
      <h2>Gestão Documental</h2>
      <p>Aquisição, tratamento técnico, conservação e desbaste</p>
    </div>
  </div>
  <div class="pad">
    <div class="g3" style="margin-bottom:var(--sp-5)">
      ${SECTIONS.map(s => `
        <div class="module-card mc-gestao card-hover"
          onclick="goView('${esc(s.id)}')"
          role="button" tabindex="0"
          aria-label="Ir para ${esc(s.title)}"
          onkeydown="if(event.key==='Enter'||event.key===' ')goView('${esc(s.id)}')">
          <div class="module-card-icon" aria-hidden="true">${s.icon}</div>
          <div class="module-card-name">${esc(s.title)}</div>
          <div class="module-card-desc">${esc(s.desc)}</div>
        </div>`).join('')}
    </div>
    ${SUBSECTIONS.map(sec => `
      <div class="sec-hdr mb-3 mt-4">
        <h3>${esc(sec.title)}</h3><div class="sec-line"></div>
      </div>
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
  </div>`;
}

export function refresh() {}
