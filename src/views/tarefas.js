/**
 * views/tarefas.js — Gestão de tarefas
 */
import { getState, setState } from '../core/store.js';
import { saveLocal, addHistory } from '../core/sync.js';
import { openModal, closeModal }  from '../utils/modal.js';
import { showToast }              from '../utils/toast.js';
import { esc }                    from '../utils/format.js';

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">✅</div>
    <div class="page-header-info">
      <h2>Tarefas</h2>
      <p>Registo com data e utilizador · Guardado localmente</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-new-task')">+ Nova tarefa</button>
    </div>
  </div>
  <div class="pad">
    <div class="g2" style="margin-bottom:var(--sp-4)">
      <div>
        <div class="sec-hdr mb-3"><h3>⚡ Pendentes</h3><div class="sec-line"></div></div>
        <div id="tasks-pending" role="list"></div>
      </div>
      <div>
        <div class="sec-hdr mb-3"><h3>✅ Concluídas</h3><div class="sec-line"></div></div>
        <div id="tasks-done" role="list"></div>
      </div>
    </div>
    <div class="sec-hdr mb-3"><h3>📅 Rotinas mensais</h3><div class="sec-line"></div></div>
    <div id="tasks-monthly" role="list"></div>
  </div>`;
  refresh(container);
}

export function refresh(_container) {
  _renderTasks();
}

function _renderTasks() {
  const all     = getState('tasks') ?? [];
  const pending = all.filter(t => !t.done);
  const done    = all.filter(t =>  t.done).slice(0, 5);

  const elP = document.getElementById('tasks-pending');
  const elD = document.getElementById('tasks-done');
  const elM = document.getElementById('tasks-monthly');
  if (!elP) return;

  elP.innerHTML = pending.length ? pending.map(_taskItem).join('') :
    `<div class="empty"><div class="empty-icon">🎉</div><p>Sem tarefas pendentes!</p></div>`;

  elD.innerHTML = done.length ? done.map(_taskItem).join('') :
    `<div class="empty"><p>Sem tarefas concluídas.</p></div>`;

  const MONTHLY = [
    { title:'Newsletter mensal (POP-COM-01)',     resp:'PB' },
    { title:'Verificar backups BiblioNet (F17)',  resp:'PB' },
    { title:'Registo condições ambientais (F13)', resp:'PB' },
    { title:'Análise estatísticas BiblioNet',     resp:'PB' },
  ];
  elM.innerHTML = MONTHLY.map(t => `
    <div class="task-item" role="listitem">
      <div class="task-info">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-meta"><span class="badge badge-${esc(t.resp)}">${esc(t.resp)}</span></div>
      </div>
      <span class="prio prio-m">Mensal</span>
    </div>`).join('');

  /* actualizar badges no sidebar */
  const sb = document.getElementById('sb-badge-tarefas');
  if (sb) sb.textContent = pending.length;
}

function _taskItem(t) {
  const prioLbl = t.prio === 'h' ? 'Alta' : t.prio === 'm' ? 'Média' : 'Baixa';
  return `
  <div class="task-item" role="listitem">
    <button class="task-check ${t.done ? 'checked' : ''}"
      onclick="_toggleTask(${t.id})"
      aria-label="${t.done ? 'Reabrir' : 'Concluir'}: ${esc(t.title)}"
      aria-pressed="${t.done}"></button>
    <div class="task-info">
      <div class="task-title ${t.done ? 'done' : ''}">${esc(t.title)}</div>
      <div class="task-meta">
        <span>📅 ${esc(t.date || 'Sem prazo')}</span>
        <span class="badge badge-${esc(t.resp)}">${esc(t.resp)}</span>
        ${t.mabe && t.mabe !== '—' ? `<span class="badge badge-${esc(t.mabe)}">${esc(t.mabe)}</span>` : ''}
      </div>
    </div>
    <span class="prio prio-${esc(t.prio)}">${esc(prioLbl)}</span>
    <button class="btn-icon" onclick="_deleteTask(${t.id})"
      aria-label="Eliminar tarefa: ${esc(t.title)}" title="Eliminar">🗑️</button>
  </div>`;
}

/* ── Globais usados inline ── */
window._toggleTask = function(id) {
  const tasks = getState('tasks') ?? [];
  const t     = tasks.find(x => x.id === id);
  if (!t) return;
  t.done   = !t.done;
  t.doneAt = t.done ? new Date().toLocaleString('pt-PT') : null;
  t.doneBy = t.done ? (getState('user')?.displayName ?? '—') : null;
  setState('tasks', tasks);
  saveLocal();
  addHistory(t.done ? 'Tarefa concluída' : 'Tarefa reaberta', t.title);
  showToast(t.done ? '✅ Concluída' : '↩️ Reaberta', t.done ? 'ok' : '');
  _renderTasks();
};

window._deleteTask = function(id) {
  if (!confirm('Eliminar esta tarefa?')) return;
  const tasks = (getState('tasks') ?? []).filter(t => t.id !== id);
  setState('tasks', tasks);
  saveLocal();
  _renderTasks();
  showToast('🗑️ Tarefa eliminada');
};
