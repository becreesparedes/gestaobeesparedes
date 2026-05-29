/**
 * views/digital.js — Hub Gestão Digital e TIC
 */
import { esc } from '../utils/format.js';

const SECTIONS = [
  { icon:'📚', title:'BiblioNet',               desc:'Catálogo, relatórios, exportações e backups',    folder:'08_Gestão_Digital_e_TIC/02_BiblioNet' },
  { icon:'☁️', title:'SharePoint e Office 365', desc:'Site da BE, bibliotecas e permissões',           folder:'08_Gestão_Digital_e_TIC/03_SharePoint_e_Office365' },
  { icon:'🔒', title:'RGPD',                    desc:'Consentimentos, pedidos e proteção de dados',    folder:'08_Gestão_Digital_e_TIC/05_RGPD_e_Proteção_de_Dados' },
  { icon:'🖥️', title:'Equipamentos',            desc:'Inventário, avarias e manutenção',               folder:'08_Gestão_Digital_e_TIC/01_Equipamentos_e_Manutenção' },
  { icon:'💾', title:'Backups e Segurança',      desc:'Cópias de segurança e registos F17',            folder:'08_Gestão_Digital_e_TIC/04_Backups_e_Segurança' },
  { icon:'🔧', title:'Suporte Técnico',          desc:'Reporte de avarias e pedidos de suporte',       folder:'08_Gestão_Digital_e_TIC/06_Suporte_Técnico' },
];

const BIBLIONET_SUBS = [
  { label:'Configuração',          folder:'08_Gestão_Digital_e_TIC/02_BiblioNet/01_Configuração' },
  { label:'Utilizadores',          folder:'08_Gestão_Digital_e_TIC/02_BiblioNet/02_Utilizadores' },
  { label:'Catálogo',              folder:'08_Gestão_Digital_e_TIC/02_BiblioNet/03_Catálogo' },
  { label:'Relatórios',            folder:'08_Gestão_Digital_e_TIC/02_BiblioNet/04_Relatórios' },
  { label:'Backup e Exportações',  folder:'08_Gestão_Digital_e_TIC/02_BiblioNet/05_Backup_e_Exportações' },
];

const EQUIPAMENTOS_SUBS = [
  { label:'Computadores',    folder:'08_Gestão_Digital_e_TIC/01_Equipamentos_e_Manutenção/01_Computadores' },
  { label:'Impressoras',     folder:'08_Gestão_Digital_e_TIC/01_Equipamentos_e_Manutenção/02_Impressoras' },
  { label:'Tablets',         folder:'08_Gestão_Digital_e_TIC/01_Equipamentos_e_Manutenção/03_Tablets' },
  { label:'Rede e Internet', folder:'08_Gestão_Digital_e_TIC/01_Equipamentos_e_Manutenção/04_Rede_e_Internet' },
  { label:'Avarias',         folder:'08_Gestão_Digital_e_TIC/01_Equipamentos_e_Manutenção/05_Avarias' },
];

const POPS_DIGITAL = ['POP-BKP-01','POP-TIC-01','POP-RED-01','POP-RGPD-01','POP-RGPD-02'];

export function init(container) {
  container.innerHTML = `
  <div class="page-header" style="border-left:4px solid var(--mod-digital)">
    <div class="page-header-icon" aria-hidden="true">💻</div>
    <div class="page-header-info">
      <h2>Gestão Digital</h2>
      <p>BiblioNet, SharePoint, RGPD e equipamentos TIC</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm"
        onclick="_browseMABE('08_Gestão_Digital_e_TIC/02_BiblioNet/05_Backup_e_Exportações')">
        💾 Backups F17
      </button>
    </div>
  </div>
  <div class="pad">

    <!-- Cards secção -->
    <div class="g3" style="margin-bottom:var(--sp-5)">
      ${SECTIONS.map(s => `
        <div class="module-card mc-digital card-hover"
          onclick="_browseMABE('${esc(s.folder)}')"
          role="button" tabindex="0"
          aria-label="${esc(s.title)}"
          onkeydown="if(event.key==='Enter'||event.key===' ')_browseMABE('${esc(s.folder)}')">
          <div class="module-card-icon" aria-hidden="true">${s.icon}</div>
          <div class="module-card-name">${esc(s.title)}</div>
          <div class="module-card-desc">${esc(s.desc)}</div>
        </div>`).join('')}
    </div>

    <!-- Estado do sistema -->
    <div class="sec-hdr mb-3">
      <h3>🔄 Estado do sistema</h3>
      <div class="sec-line"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:var(--sp-5)">
      ${[
        { label:'BiblioNet',            color:'var(--ok)',     status:'Activo' },
        { label:'Backups automáticos',  color:'var(--ok)',     status:'Configurados' },
        { label:'OneDrive / Graph API', color:'var(--ok)',     status:'Activo' },
        { label:'RGPD — conformidade',  color:'var(--warn)',   status:'Revisão anual em setembro' },
      ].map(s => `
        <div style="display:flex;align-items:center;gap:var(--sp-2);
          padding:8px var(--sp-3);background:var(--white);
          border:1px solid var(--grey-200);border-radius:var(--r-sm);font-size:.78rem">
          <span style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0" aria-hidden="true"></span>
          <span style="flex:1;font-weight:500">${esc(s.label)}</span>
          <span style="color:var(--grey-400);font-size:.72rem">${esc(s.status)}</span>
        </div>`).join('')}
    </div>

    <div class="g2">
      <!-- BiblioNet sub-pastas -->
      <div>
        <div class="sec-hdr mb-3"><h3>📚 BiblioNet</h3><div class="sec-line"></div></div>
        <div class="card">
          ${BIBLIONET_SUBS.map(s => `
            <div class="file-item" role="button" tabindex="0"
              onclick="_browseMABE('${esc(s.folder)}')"
              onkeydown="if(event.key==='Enter')_browseMABE('${esc(s.folder)}')"
              aria-label="Abrir ${esc(s.label)}">
              <span class="file-icon" aria-hidden="true">📁</span>
              <span class="file-name">${esc(s.label)}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Equipamentos sub-pastas -->
      <div>
        <div class="sec-hdr mb-3"><h3>🖥️ Equipamentos</h3><div class="sec-line"></div></div>
        <div class="card">
          ${EQUIPAMENTOS_SUBS.map(s => `
            <div class="file-item" role="button" tabindex="0"
              onclick="_browseMABE('${esc(s.folder)}')"
              onkeydown="if(event.key==='Enter')_browseMABE('${esc(s.folder)}')"
              aria-label="Abrir ${esc(s.label)}">
              <span class="file-icon" aria-hidden="true">📁</span>
              <span class="file-name">${esc(s.label)}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- POPs -->
    <div class="sec-hdr mb-3 mt-4"><h3>📋 POPs relacionados</h3><div class="sec-line"></div></div>
    <div class="card">
      ${POPS_DIGITAL.map(code => `
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
