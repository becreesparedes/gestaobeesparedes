/**
 * views/checklists.js — Checklists operacionais interativas
 */
import { getState, setState } from '../core/store.js';
import { saveLocal, addHistory } from '../core/sync.js';
import { showToast }             from '../utils/toast.js';
import { esc }                   from '../utils/format.js';
import CL_DEF                    from '../data/checklists.json' assert { type: 'json' };

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">☑️</div>
    <div class="page-header-info">
      <h2>Checklists Operacionais</h2>
      <p>${CL_DEF.length} checklists · Registo por utilizador e data · Exportação PDF</p>
    </div>
  </div>
  <div class="pad" id="checklists-view"></div>`;
  refresh(container);
}

export function refresh(_container) {
  _render();
}

function _render() {
  const view = document.getElementById('checklists-view');
  if (!view) return;
  const checklist = getState('checklist') ?? {};

  view.innerHTML = CL_DEF.map(cl => {
    const done  = (checklist[cl.code] ?? []).length;
    const total = cl.items.length;
    const pct   = Math.round(done / total * 100);
    const pgCls = pct === 100 ? 'prog-green' : pct > 50 ? 'prog-blue' : 'prog-amber';

    return `
    <div class="card" style="margin-bottom:var(--sp-3)" aria-label="Checklist ${esc(cl.code)}: ${esc(cl.name)}">
      <h3>
        ${esc(cl.code)} — ${esc(cl.name)}
        <span style="margin-left:auto;font-size:.65rem;font-weight:400;color:var(--grey-400)">${esc(cl.freq)}</span>
      </h3>

      <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)">
        <div class="progress" style="flex:1"
          role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
          aria-label="${pct}% concluído">
          <div class="progress-bar ${pgCls}" style="width:${pct}%"></div>
        </div>
        <span style="font-size:.72rem;font-weight:700;white-space:nowrap">${pct}% (${done}/${total})</span>
        <button class="btn-icon" onclick="_resetCL('${esc(cl.code)}')"
          aria-label="Repor checklist ${esc(cl.code)}" title="Repor">↩️</button>
        <button class="btn-icon" onclick="_exportCL('${esc(cl.code)}')"
          aria-label="Exportar ${esc(cl.code)} para PDF" title="Exportar PDF">📄</button>
      </div>

      ${cl.items.map((item, i) => {
        const checked = (checklist[cl.code] ?? []).includes(i);
        return `
        <div class="cl-item" role="checkbox" aria-checked="${checked}" tabindex="0"
          onclick="_toggleCL('${esc(cl.code)}',${i})"
          onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();_toggleCL('${esc(cl.code)}',${i})}">
          <div class="cl-box" aria-hidden="true"></div>
          <span class="cl-label" style="${checked ? 'text-decoration:line-through;color:var(--grey-400)' : ''}">${esc(item)}</span>
        </div>`;
      }).join('')}

      ${pct === 100 ? `
        <div style="background:var(--ok-l);border:1px solid #a7f3d0;border-radius:var(--r-sm);
          padding:var(--sp-2) var(--sp-3);text-align:center;font-size:.78rem;font-weight:700;
          color:var(--ok);margin-top:var(--sp-3)" role="status">
          ✅ Concluída · ${new Date().toLocaleDateString('pt-PT')} · ${esc(getState('user')?.displayName ?? '—')}
        </div>` : ''}
    </div>`;
  }).join('');
}

window._toggleCL = function(key, idx) {
  const cl = getState('checklist') ?? {};
  if (!cl[key]) cl[key] = [];
  const pos = cl[key].indexOf(idx);
  if (pos >= 0) cl[key].splice(pos, 1);
  else {
    cl[key].push(idx);
    const name = CL_DEF.find(c => c.code === key)?.items[idx] ?? '';
    addHistory('Checklist item', name, key);
  }
  setState('checklist', cl);
  saveLocal();
  _render();
};

window._resetCL = function(key) {
  if (!confirm(`Repor checklist ${key}?`)) return;
  const cl = getState('checklist') ?? {};
  cl[key] = [];
  setState('checklist', cl);
  saveLocal();
  _render();
  showToast('↩️ Checklist reposta');
};

window._exportCL = function(key) {
  const cl = CL_DEF.find(c => c.code === key);
  if (!cl) return;
  import('../utils/export-pdf.js').then(m => m.exportChecklistPDF(cl));
};
