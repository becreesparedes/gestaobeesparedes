/**
 * views/alertas.js — Alertas e prazos anuais
 */
import { esc, fmtDate } from '../utils/format.js';
import { goView }       from '../main.js';

const ALERT_RULES = [
  { id:'bkp',      title:'Backup BiblioNet',             desc:'Verificar backup mensal (F17 / POP-BKP-01)',      type:'warn',   monthly:true, day:5,  month:null },
  { id:'insp1',    title:'Inspeção semestral fundo S1',   desc:'CL04 / F12 — outubro/novembro',                  type:'warn',   month:10 },
  { id:'insp2',    title:'Inspeção semestral fundo S2',   desc:'CL04 / F12 — abril/maio',                        type:'warn',   month:4  },
  { id:'desbaste', title:'Desbaste anual',                desc:'F04 / POP-DES-01 — março a maio',                type:'info',   month:3  },
  { id:'mabe',     title:'Autoavaliação MABE',            desc:'POP-MAB-01 — maio/junho',                        type:'warn',   month:5  },
  { id:'raa',      title:'RAA — prazo 30 de junho',       desc:'POP-RAA-01 — elaborar e entregar ao Diretor',    type:'danger', month:6  },
  { id:'paa',      title:'PAA-BE — prazo 30 setembro',    desc:'POP-PAA-01 — elaborar e entregar',               type:'info',   month:9  },
  { id:'qsat',     title:'Questionários de satisfação',   desc:'QA, QD, QDi — aplicar em maio',                  type:'info',   month:5  },
  { id:'rgpd',     title:'Revisão anual RGPD',            desc:'Verificar conformidade e atualizar registos',     type:'info',   month:9  },
];

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">🔔</div>
    <div class="page-header-info">
      <h2>Alertas e Prazos</h2>
      <p>Backups, RGPD, inspeções e prazos anuais da biblioteca escolar</p>
    </div>
  </div>
  <div class="pad" id="alerts-panel"></div>`;
  refresh(container);
}

export function refresh(container) {
  const panel = container.querySelector('#alerts-panel') ?? document.getElementById('alerts-panel');
  if (!panel) return;

  const m       = new Date().getMonth() + 1;
  const d       = new Date().getDate();
  const active  = ALERT_RULES.filter(r =>
    r.monthly ? d <= (r.day ?? 5) + 5 : r.month && Math.abs(m - r.month) <= 1
  );

  const allPrazos = ALERT_RULES.filter(r => r.month).map(r => `
    <div style="display:flex;align-items:center;gap:var(--sp-2);padding:8px var(--sp-3);
      background:var(--white);border:1px solid var(--grey-200);
      border-radius:var(--r-sm);margin-bottom:5px;font-size:.78rem">
      <span class="badge badge-${r.type === 'danger' ? 'red' : r.type === 'warn' ? 'amber' : 'info'}">
        Mês ${r.month}
      </span>
      <div style="flex:1">
        <strong>${esc(r.title)}</strong>
        <span style="color:var(--grey-500);font-size:.72rem"> — ${esc(r.desc)}</span>
      </div>
    </div>`).join('');

  panel.innerHTML = active.length
    ? `<div class="sec-hdr mb-3"><h3>⚠️ Alertas ativos este mês</h3><div class="sec-line"></div></div>
       ${active.map(_alertCard).join('')}
       <div class="sec-hdr mt-4 mb-3"><h3>📅 Todos os prazos anuais</h3><div class="sec-line"></div></div>
       ${allPrazos}`
    : `<div class="empty"><div class="empty-icon">✅</div>
         <h3>Sem alertas ativos</h3>
         <p>Todos os prazos estão sob controlo.</p>
       </div>
       <div class="sec-hdr mt-4 mb-3"><h3>📅 Prazos anuais</h3><div class="sec-line"></div></div>
       ${allPrazos}`;
}

function _alertCard(a) {
  const icon = a.type === 'danger' ? '🚨' : a.type === 'warn' ? '⚠️' : 'ℹ️';
  return `
  <div class="alert alert-${a.type}" role="listitem" tabindex="0"
    onclick="goView('tarefas')"
    onkeydown="if(event.key==='Enter')goView('tarefas')">
    <div class="alert-icon" aria-hidden="true">${icon}</div>
    <div class="alert-body">
      <div class="alert-title">${esc(a.title)}</div>
      <div class="alert-desc">${esc(a.desc)}</div>
    </div>
  </div>`;
}
