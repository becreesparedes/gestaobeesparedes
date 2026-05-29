/**
 * views/relatorios.js — Relatórios anuais com checklist de preparação
 */
import { getState, setState } from '../core/store.js';
import { saveLocal }          from '../core/sync.js';
import { openModal }          from '../utils/modal.js';
import { esc }                from '../utils/format.js';

const RELATORIOS = [
  { cod:'RAA', nome:'Relatório Anual de Atividades', prazo:'30 de junho', urgencia:'danger',
    pop:'POP-RAA-01', pasta:'07_Avaliação_e_Melhoria/05_Relatórios_Anuais', tipo_upload:'RAA',
    desc:'Balanço anual das atividades da BE: empréstimos, PPL, articulação, projetos. Entregue ao Diretor até 30 de junho.',
    cl:['Estatísticas BiblioNet exportadas','Atividades PPL listadas e avaliadas',
      'Sessões de articulação contabilizadas','KPIs calculados e comparados com metas',
      'RAA redigido e revisto','Enviado ao Diretor'] },
  { cod:'MABE', nome:'Relatório de Autoavaliação MABE', prazo:'30 de junho', urgencia:'warn',
    pop:'POP-MAB-01', pasta:'07_Avaliação_e_Melhoria/01_MABE', tipo_upload:'MABE',
    desc:'Autoavaliação nos 4 domínios (A–D) com evidências, pontos fortes, fragilidades e nível atribuído (1–4).',
    cl:['Reunião de equipa realizada','Evidências recolhidas por domínio',
      'Níveis atribuídos e justificados','Plano de Melhoria redigido','Relatório final aprovado'] },
  { cod:'PM', nome:'Plano de Melhoria', prazo:'30 de junho', urgencia:'info',
    pop:'POP-MEL-01', pasta:'07_Avaliação_e_Melhoria/04_Plano_de_Melhoria', tipo_upload:'MABE',
    desc:'Objetivos de melhoria para o próximo ciclo: metas, ações, responsáveis e prazos.',
    cl:['Fragilidades MABE identificadas','Objetivos SMART definidos','Ações e responsáveis atribuídos','PM aprovado pela equipa'] },
  { cod:'PAA', nome:'Plano Anual de Atividades BE', prazo:'30 de setembro', urgencia:'info',
    pop:'POP-PAA-01', pasta:'00_Entrada_e_Ativos/01_Abertura_do_Ano', tipo_upload:'F',
    desc:'Planificação do ano letivo: atividades PPL, articulação curricular, projetos, formação e orçamento.',
    cl:['Diagnóstico do ano anterior consultado','Atividades PPL calendarizadas',
      'Sessões articulação planificadas','Orçamento F02 elaborado','PAA entregue ao Diretor'] },
  { cod:'SIRBE', nome:'Submissão SI-RBE', prazo:'Após RAA', urgencia:'info',
    pop:'POP-RAA-01', pasta:'07_Avaliação_e_Melhoria/05_Relatórios_Anuais', tipo_upload:'RAA',
    desc:'Submissão dos dados anuais no sistema de informação da RBE. Requer credenciais de acesso à plataforma.',
    cl:['RAA finalizado','Dados estatísticos confirmados','Acesso SI-RBE verificado','Submissão efectuada','Confirmação guardada'] },
];

const _open = {};

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">📑</div>
    <div class="page-header-info">
      <h2>Relatórios Anuais</h2>
      <p>RAA, MABE, SI-RBE · Checklists de preparação e exportação</p>
    </div>
  </div>
  <div class="pad" id="relatorios-view"></div>`;
  refresh(container);
}

export function refresh(_container) { _render(); }

function _render() {
  const view = document.getElementById('relatorios-view');
  if (!view) return;
  const checklist = getState('checklist') ?? {};
  const urg = { danger:'badge-red', warn:'badge-amber', info:'badge-info' };

  view.innerHTML = `
    <div class="alert alert-info" style="margin-bottom:var(--sp-4)" role="note">
      <div class="alert-icon" aria-hidden="true">📑</div>
      <div class="alert-body">
        <div class="alert-title">Documentos de prestação de contas</div>
        <div class="alert-desc">Clique em "Checklist de preparação" para acompanhar o progresso de cada documento.</div>
      </div>
    </div>
    ${RELATORIOS.map(r => {
      const clKey = 'rel_cl_' + r.cod;
      const done  = (checklist[clKey] ?? []).length;
      const total = r.cl.length;
      const pct   = Math.round(done / total * 100);
      const pgCls = pct === 100 ? 'prog-green' : pct > 0 ? 'prog-blue' : 'prog-amber';
      const isOpen = !!_open[r.cod];
      return `
      <div class="card" style="margin-bottom:var(--sp-3)">
        <div style="display:flex;align-items:flex-start;gap:var(--sp-3);flex-wrap:wrap">
          <div style="flex:1;min-width:200px">
            <h3 style="margin-bottom:var(--sp-2)">
              <span class="badge badge-grey" style="margin-right:6px">${esc(r.cod)}</span>
              ${esc(r.nome)}
              <span class="badge ${urg[r.urgencia]}" style="margin-left:6px">⏱ ${esc(r.prazo)}</span>
            </h3>
            <div class="card-desc" style="margin-bottom:var(--sp-2)">${esc(r.desc)}</div>
            <div style="font-size:.67rem;color:var(--grey-400);margin-bottom:var(--sp-2)">
              <span class="badge badge-info">${esc(r.pop)}</span>
              &nbsp;📁 <code style="font-size:.62rem">${esc('BE-ESP/' + r.pasta)}/</code>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--sp-2);flex-shrink:0">
            <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm"
                onclick="_browseMABE('${esc(r.pasta)}')"
                aria-label="Ver pasta ${esc(r.pasta)}">📁 Pasta</button>
              <button class="btn btn-primary btn-sm"
                onclick="openModal('modal-upload');
                  document.getElementById('up-type').value='${esc(r.tipo_upload)}';
                  window.calcUploadPath?.()"
                aria-label="Carregar ${esc(r.nome)}">⬆️ Carregar</button>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <div class="progress" style="width:80px"
                role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar ${pgCls}" style="width:${pct}%"></div>
              </div>
              <span style="font-size:.65rem;color:var(--grey-400);white-space:nowrap">${done}/${total}</span>
            </div>
          </div>
        </div>

        <button class="btn btn-ghost btn-sm"
          style="margin-top:var(--sp-2);width:100%;text-align:left;justify-content:flex-start"
          onclick="_toggleRelCL('${esc(r.cod)}')"
          aria-expanded="${isOpen}" aria-controls="rel-cl-${esc(r.cod)}">
          ${isOpen ? '▾' : '▸'} Checklist de preparação
        </button>

        <div id="rel-cl-${esc(r.cod)}" style="display:${isOpen ? 'block' : 'none'};margin-top:var(--sp-2)">
          ${r.cl.map((item, i) => {
            const checked = (checklist[clKey] ?? []).includes(i);
            return `
            <div class="cl-item" role="checkbox" aria-checked="${checked}" tabindex="0"
              onclick="_toggleRelItem('${esc(r.cod)}','${esc(clKey)}',${i})"
              onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();_toggleRelItem('${esc(r.cod)}','${esc(clKey)}',${i})}">
              <div class="cl-box" aria-hidden="true"></div>
              <span class="cl-label" style="${checked?'text-decoration:line-through;color:var(--grey-400)':''}">${esc(item)}</span>
            </div>`;
          }).join('')}
          ${pct === 100 ? `
            <div style="background:var(--ok-l);border:1px solid #a7f3d0;border-radius:var(--r-sm);
              padding:var(--sp-2) var(--sp-3);text-align:center;font-size:.75rem;
              font-weight:700;color:var(--ok);margin-top:var(--sp-2)" role="status">
              ✅ Pronto para entregar
            </div>` : ''}
        </div>
      </div>`;
    }).join('')}`;
}

window._toggleRelCL = function(cod) {
  _open[cod] = !_open[cod];
  _render();
};

window._toggleRelItem = function(cod, clKey, idx) {
  const cl = getState('checklist') ?? {};
  if (!cl[clKey]) cl[clKey] = [];
  const pos = cl[clKey].indexOf(idx);
  if (pos >= 0) cl[clKey].splice(pos, 1);
  else cl[clKey].push(idx);
  setState('checklist', cl);
  saveLocal();
  _render();
};
