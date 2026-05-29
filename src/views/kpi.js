/**
 * views/kpi.js — Indicadores de desempenho KPI
 */
import { getState, setState } from '../core/store.js';
import { saveLocal, addHistory } from '../core/sync.js';
import { showToast }             from '../utils/toast.js';
import { openModal }             from '../utils/modal.js';
import { esc }                   from '../utils/format.js';
import KPI_DATA                  from '../data/kpi.json' assert { type: 'json' };

export function init(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-icon" aria-hidden="true">📈</div>
    <div class="page-header-info">
      <h2>Indicadores KPI</h2>
      <p>Dashboard de desempenho · Actualização manual ou via Excel</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm" id="kpi-export-xlsx">📊 Excel</button>
      <button class="btn btn-ghost btn-sm" id="kpi-export-pdf">📄 PDF</button>
    </div>
  </div>
  <div class="pad" id="kpi-view"></div>`;
  _bindEvents(container);
  refresh(container);
}

export function refresh(_container) { _render(); }

function _render() {
  const view = document.getElementById('kpi-view');
  if (!view) return;
  const vals = getState('kpiValues') ?? {};
  const filled = KPI_DATA.filter(k => vals[k.nome] && vals[k.nome] !== '—').length;

  view.innerHTML = `
    <div class="alert alert-info" style="margin-bottom:var(--sp-4)" role="note">
      <div class="alert-icon" aria-hidden="true">ℹ️</div>
      <div class="alert-body">
        <div class="alert-title">Actualização dos KPIs</div>
        <div class="alert-desc">${filled} de ${KPI_DATA.length} indicadores preenchidos.
          Introduza os valores manualmente ou carregue o Excel do BiblioNet.</div>
      </div>
    </div>
    <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-4);flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="openModal('modal-upload');
        document.getElementById('up-type').value='F'">⬆️ Importar Excel</button>
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('kpi-export-xlsx')?.click()">📊 Exportar Excel</button>
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('kpi-export-pdf')?.click()">📄 Exportar PDF</button>
    </div>
    ${['A','B','C','D'].map(dom => {
      const grupo = KPI_DATA.filter(k => k.mabe === dom);
      return `
      <div class="sec-hdr mb-3 mt-4">
        <h3><span class="badge badge-${dom}" style="font-size:.75rem;margin-right:6px">${dom}</span>Domínio ${dom}</h3>
        <div class="sec-line"></div>
      </div>
      <div class="tbl-scroll" style="margin-bottom:var(--sp-4)">
        <div class="tbl-wrap">
          <table class="tbl" aria-label="KPIs domínio ${dom}">
            <thead><tr>
              <th scope="col">Indicador</th>
              <th scope="col">Meta</th>
              <th scope="col">Valor atual</th>
              <th scope="col">Estado</th>
              <th scope="col">Fonte</th>
            </tr></thead>
            <tbody>
              ${grupo.map((k, ki) => {
                const v = vals[k.nome] ?? '—';
                const preenchido = v !== '—' && v !== '';
                return `<tr>
                  <td class="td-name">${esc(k.nome)}</td>
                  <td class="td-code">${esc(k.meta)}</td>
                  <td>
                    <label for="kpi_${dom}_${ki}" style="display:none">Valor de ${esc(k.nome)}</label>
                    <input type="text" id="kpi_${dom}_${ki}"
                      value="${esc(v)}"
                      style="border:1.5px solid var(--grey-200);border-radius:var(--r-sm);
                        padding:3px 8px;font-size:.75rem;width:90px;font-family:var(--font)"
                      aria-label="Valor de ${esc(k.nome)}"
                      onchange="_updateKPI(this,'${esc(k.nome)}')">
                    <span style="font-size:.65rem;color:var(--grey-400)">${esc(k.und)}</span>
                  </td>
                  <td>
                    <span class="badge ${preenchido ? 'badge-ok' : 'badge-amber'}">
                      ${preenchido ? '✓ Preenchido' : 'Não preenchido'}
                    </span>
                  </td>
                  <td class="td-muted">${esc(k.fonte)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }).join('')}`;
}

function _bindEvents(container) {
  container.querySelector('#kpi-export-xlsx')?.addEventListener('click', () =>
    import('../utils/export-xlsx.js').then(m => m.exportKpiXLSX()));
  container.querySelector('#kpi-export-pdf')?.addEventListener('click', () =>
    import('../utils/export-pdf.js').then(m => m.exportKpiPDF()));
}

window._updateKPI = function(input, nome) {
  const val  = input.value.replace(/[<>'"]/g,'').trim();
  input.value = val;
  const vals = getState('kpiValues') ?? {};
  vals[nome] = val;
  setState('kpiValues', vals);
  saveLocal();
  addHistory('KPI actualizado', nome);
  showToast('✅ Guardado', 'ok');
};
