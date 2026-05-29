/**
 * views/dashboard.js — Dashboard central BE-ESP v4
 */
import { getState }          from '../core/store.js';
import { syncNow }           from '../core/sync.js';
import { gChildren }         from '../core/graph.js';
import { esc, fmtDate,
         fmtSize, fileIcon,
         fileExt, fileMabe } from '../utils/format.js';
import { openModal }         from '../utils/modal.js';
import { goView }            from '../main.js';
import { updateBadges }      from '../main.js';
import ALERTS_DEF            from '../data/calendar.json' assert { type: 'json' };

const BE_FOLDER = 'BE-ESP';

/* ═══════════════════════════════
   INIT — chamado uma única vez
═══════════════════════════════ */
export function init(container) {
  container.innerHTML = _scaffold();
  _bindEvents(container);
  refresh(container);
}

/* ═══════════════════════════════
   REFRESH — chamado em goView
═══════════════════════════════ */
export function refresh(_container) {
  _renderKPIs();
  _renderAlertChips();
  _renderPriorityTasks();
  _renderRecentFiles();
  updateBadges();
}

/* ── Scaffolding HTML ── */
function _scaffold() {
  return `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">🏠</div>
    <div class="page-header-info">
      <h2>Dashboard</h2>
      <p>Visão geral em tempo real · OneDrive Microsoft 365 · 2025–2026</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm" id="dash-export-pdf">📄 PDF</button>
      <button class="btn btn-ghost btn-sm" id="dash-sync">🔄 Sync</button>
    </div>
  </div>

  <div class="pad">

    <!-- KPIs -->
    <div class="kpi-grid" id="dash-kpis" role="list" aria-label="Indicadores principais">
      <div class="kpi-card" role="listitem">
        <div class="kpi-val" id="kpi-pastas">—</div>
        <div class="kpi-lbl">Pastas OneDrive</div>
        <div class="kpi-meta kpi-eq" id="kpi-pastas-t">BE-ESP</div>
      </div>
      <div class="kpi-card" role="listitem">
        <div class="kpi-val" id="kpi-docs">—</div>
        <div class="kpi-lbl">Ficheiros estimados</div>
        <div class="kpi-meta kpi-eq" id="kpi-docs-t">—</div>
      </div>
      <div class="kpi-card" role="listitem">
        <div class="kpi-val" id="kpi-tasks">—</div>
        <div class="kpi-lbl">Tarefas pendentes</div>
        <div class="kpi-meta" id="kpi-tasks-t">—</div>
      </div>
      <div class="kpi-card" role="listitem">
        <div class="kpi-val" id="kpi-alerts">—</div>
        <div class="kpi-lbl">Alertas ativos</div>
        <div class="kpi-meta" id="kpi-alerts-t">—</div>
      </div>
    </div>

    <!-- Módulos de acesso rápido -->
    <div class="sec-hdr mb-3 mt-4">
      <h3>🧭 Módulos</h3><div class="sec-line"></div>
    </div>
    <div class="g4" id="dash-modules" style="margin-bottom:var(--sp-5)">
      ${_moduleCards()}
    </div>

    <!-- Tarefas de alta prioridade -->
    <div class="sec-hdr mb-3">
      <h3>📌 Tarefas prioritárias</h3>
      <div class="sec-line"></div>
      <button class="sec-action" onclick="goView('tarefas')">Ver todas →</button>
    </div>
    <div id="dash-tasks" style="margin-bottom:var(--sp-5)"></div>

    <!-- Ficheiros recentes -->
    <div class="sec-hdr mb-3">
      <h3>🕐 Ficheiros recentes no OneDrive</h3>
      <div class="sec-line"></div>
      <button class="sec-action" onclick="goView('ficheiros')">Explorar →</button>
    </div>
    <div class="tbl-scroll">
      <div class="tbl-wrap" id="dash-recent">
        <div style="padding:var(--sp-4)">
          ${_skelRows(6)}
        </div>
      </div>
    </div>

  </div>`;
}

/* ── Cards dos módulos ── */
function _moduleCards() {
  const mods = [
    { id:'gestao',       icon:'📚', name:'Gestão Documental',     desc:'Aquisição, tratamento, conservação e desbaste',    cls:'mc-gestao'       },
    { id:'utilizadores', icon:'👥', name:'Utilizadores e Serviços',desc:'Registo, empréstimos, apoio e ocorrências',        cls:'mc-utilizadores' },
    { id:'pedagogia',    icon:'🎓', name:'Pedagogia e Literacias', desc:'Articulação, literacias, leitura e projetos',      cls:'mc-pedagogia'    },
    { id:'avaliacao',    icon:'📊', name:'Avaliação e Melhoria',   desc:'MABE, KPIs, plano de melhoria e relatórios',      cls:'mc-avaliacao'    },
    { id:'comunicacao',  icon:'📣', name:'Comunicação e Imagem',   desc:'Newsletter, redes sociais e identidade visual',   cls:'mc-comunicacao'  },
    { id:'digital',      icon:'💻', name:'Gestão Digital',         desc:'BiblioNet, SharePoint, RGPD e equipamentos',      cls:'mc-digital'      },
    { id:'arquivo',      icon:'🗃️', name:'Arquivo Histórico',     desc:'Anos letivos fechados e documentos finais',       cls:'mc-arquivo'      },
    { id:'ficheiros',    icon:'📁', name:'Explorador OneDrive',    desc:'Navegar e gerir ficheiros e pastas BE-ESP',       cls:'mc-gestao'       },
  ];
  return mods.map(m => `
    <div class="module-card card-hover ${m.cls}" onclick="goView('${esc(m.id)}')"
      role="button" tabindex="0" aria-label="Ir para ${esc(m.name)}"
      onkeydown="if(event.key==='Enter'||event.key===' ')goView('${esc(m.id)}')">
      <div class="module-card-icon" aria-hidden="true">${m.icon}</div>
      <div class="module-card-name">${esc(m.name)}</div>
      <div class="module-card-desc">${esc(m.desc)}</div>
    </div>`).join('');
}

/* ── KPIs ── */
function _renderKPIs() {
  const items    = getState('currentItems') ?? [];
  const tasks    = getState('tasks')        ?? [];
  const folders  = items.filter(i => i.folder).length;
  const estDocs  = items.reduce((s,f) => s + (f.folder?.childCount ?? 1), 0);
  const pending  = tasks.filter(t => !t.done).length;
  const alerts   = _countAlerts();

  _setKPI('kpi-pastas',  folders || items.length, 'pastas BE-ESP', 'kpi-eq');
  _setKPI('kpi-docs',    estDocs + '+', 'ficheiros estimados', 'kpi-eq');
  _setKPI('kpi-tasks',   pending, pending > 3 ? '❗ Ação necessária' : '✅ OK', pending > 3 ? 'kpi-dn' : 'kpi-up');
  _setKPI('kpi-alerts',  alerts,  alerts  > 0 ? '⚠️ Ver alertas'    : '✅ Tudo OK', alerts > 0 ? 'kpi-dn' : 'kpi-up');
}

function _setKPI(id, val, meta, cls) {
  const v = document.getElementById(id);
  const t = document.getElementById(id + '-t');
  if (v) v.textContent = val;
  if (t) { t.textContent = meta; t.className = 'kpi-meta ' + cls; }
}

/* ── Chips de alerta ── */
function _renderAlertChips() {
  /* já renderizado pelo main.js / updateBadges */
}

/* ── Tarefas de alta prioridade ── */
function _renderPriorityTasks() {
  const el = document.getElementById('dash-tasks');
  if (!el) return;
  const hi = (getState('tasks') ?? []).filter(t => !t.done && t.prio === 'h').slice(0, 5);
  if (!hi.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">✅</div><p>Sem tarefas de alta prioridade.</p></div>`;
    return;
  }
  el.innerHTML = hi.map(t => `
    <div class="task-item">
      <div class="task-info">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-meta">
          <span>📅 ${esc(t.date || 'Sem prazo')}</span>
          <span class="badge badge-${esc(t.resp)}">${esc(t.resp)}</span>
          ${t.mabe && t.mabe !== '—' ? `<span class="badge badge-${esc(t.mabe)}">${esc(t.mabe)}</span>` : ''}
        </div>
      </div>
      <span class="prio prio-h">Alta</span>
    </div>`).join('');
}

/* ── Ficheiros recentes ── */
function _renderRecentFiles() {
  const wrap = document.getElementById('dash-recent');
  if (!wrap) return;
  const recent = [...(getState('currentItems') ?? [])]
    .sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime))
    .slice(0, 10);
  if (!recent.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-icon">🔄</div><p>A sincronizar… clique em Sync.</p></div>`;
    return;
  }
  const rows = recent.map(f => {
    const isDir = !!f.folder;
    const dt    = fmtDate(f.lastModifiedDateTime);
    const mabe  = fileMabe(f.name);
    return `<tr>
      <td class="td-name">
        <span aria-hidden="true">${fileIcon(f.name, isDir)} </span>${esc(f.name)}
        ${mabe ? `<span class="badge badge-${mabe}" style="margin-left:4px">${mabe}</span>` : ''}
      </td>
      <td class="td-code">${esc(fileExt(f.name, isDir))}</td>
      <td class="td-muted">${esc(dt)}</td>
      <td>
        <div style="display:flex;gap:4px">
          ${!isDir && f.webUrl ? `<button class="btn btn-ghost btn-sm" onclick="openFileUrl('${esc(f.webUrl)}','${esc(f.name)}')" aria-label="Abrir ${esc(f.name)}">🔗</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="navToFolder('${esc(f.id)}','${esc(f.name)}')" aria-label="Ver ${esc(f.name)}">📂</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <table class="tbl" aria-label="Ficheiros recentes">
      <thead><tr>
        <th scope="col">Nome</th><th scope="col">Tipo</th>
        <th scope="col">Modificado</th><th scope="col">Ações</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── Bind events ── */
function _bindEvents(container) {
  container.querySelector('#dash-sync')?.addEventListener('click', () => {
    syncNow().then(() => refresh(container));
  });
  container.querySelector('#dash-export-pdf')?.addEventListener('click', () => {
    import('../utils/export-pdf.js').then(m => m.exportDashboardPDF());
  });
}

/* ── Helpers ── */
function _countAlerts() {
  const m = new Date().getMonth() + 1;
  const RULES = [
    { monthly:true,  day:5  },
    { month:10 },{ month:4 },{ month:3 },{ month:5 },
    { month:6 },{ month:9 },{ month:5 },{ month:9 },
  ];
  return RULES.filter(r => r.monthly
    ? new Date().getDate() <= (r.day ?? 5) + 5
    : r.month && Math.abs(m - r.month) <= 1
  ).length;
}

function _skelRows(n) {
  return Array(n).fill('')
    .map(() => `<div class="skel skel-text" style="width:${40+Math.random()*45}%;margin-bottom:8px"></div>`)
    .join('');
}

/* expor funções usadas inline nos botões */
window.openFileUrl = function(url, name) {
  if (!url || url === '#') return;
  const a = Object.assign(document.createElement('a'),
    { href: url, target: '_blank', rel: 'noopener noreferrer' });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  import('../core/sync.js').then(m => m.addHistory('Ficheiro aberto', name));
};
window.navToFolder = function(id, name) {
  import('../core/store.js').then(({ setState }) => {
    setState('currentFolderId', id);
    setState('currentFolderName', name);
  });
  goView('ficheiros');
};
