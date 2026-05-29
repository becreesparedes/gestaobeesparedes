/**
 * views/calendario.js — Calendário anual Set–Jun
 */
import { getState, setState } from '../core/store.js';
import { saveLocal }          from '../core/sync.js';
import { openModal,
         closeModal }         from '../utils/modal.js';
import { showToast }          from '../utils/toast.js';
import { esc }                from '../utils/format.js';
import CAL_DATA               from '../data/calendar.json' assert { type: 'json' };

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">📅</div>
    <div class="page-header-info">
      <h2>Calendário Anual</h2>
      <p>Set 2025 – Jun 2026 · Atividades, prazos e rotinas</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-new-event')">+ Evento</button>
    </div>
  </div>
  <div class="pad" id="cal-view"></div>`;
  refresh(container);
}

export function refresh(container) {
  const el = container.querySelector('#cal-view') ?? document.getElementById('cal-view');
  if (!el) return;
  const custom = getState('events') ?? [];

  el.innerHTML = CAL_DATA.map(m => {
    const custom_m = custom.filter(e => e.mes === m.mes);
    const total    = m.items.length + custom_m.length;
    return `
    <div class="cal-month" aria-label="Mês de ${esc(m.mes)}">
      <div class="cal-head" style="background:${m.cor};color:${m.brd}">
        📅 ${esc(m.mes)}
        <span style="font-size:.68rem;font-weight:400;opacity:.7">(${total} evento${total !== 1 ? 's' : ''})</span>
      </div>
      ${m.items.map(i => `
        <div class="cal-ev">
          <span class="badge badge-${esc(i.m)}" aria-label="Domínio ${esc(i.m)}">${esc(i.m)}</span>
          <span style="flex:1">${esc(i.t)}</span>
          <span class="badge badge-${esc(i.r.split(' ')[0])}">${esc(i.r)}</span>
        </div>`).join('')}
      ${custom_m.map(e => `
        <div class="cal-ev" style="background:var(--ok-l)">
          <span class="badge badge-green">+</span>
          <span style="flex:1">⭐ ${esc(e.title)}</span>
          <span class="badge badge-${esc(e.resp)}">${esc(e.resp)}</span>
          <button class="btn-icon" style="padding:2px 5px;font-size:11px;margin-left:4px"
            onclick="_removeEvent('${esc(e.title)}')"
            aria-label="Remover evento ${esc(e.title)}">✕</button>
        </div>`).join('')}
    </div>`;
  }).join('');
}

window._removeEvent = function(title) {
  const events = (getState('events') ?? []).filter(e => e.title !== title);
  setState('events', events);
  saveLocal();
  const c = document.getElementById('view-calendario');
  if (c) refresh({ querySelector: sel => c.querySelector(sel) });
  showToast('🗑️ Evento removido');
};
