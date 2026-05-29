/**
 * export-xlsx.js — Exportações Excel com SheetJS
 */
import { getState }   from '../core/store.js';
import { addHistory } from '../core/sync.js';
import { showToast }  from './toast.js';

const ESCOLA = 'Escola Secundária de Paredes';
const ANO    = '2025–2026';

function _getXLSX() {
  if (!window.XLSX) { showToast('⚠️ SheetJS não carregado', 'danger'); return null; }
  return window.XLSX;
}

function _wbNew()    { return _getXLSX()?.utils.book_new(); }
function _aoa(rows)  { return _getXLSX()?.utils.aoa_to_sheet(rows); }
function _append(wb, ws, name) { _getXLSX()?.utils.book_append_sheet(wb, ws, name); }

/** Exporta KPIs (3 folhas: KPIs, Atividades, Tarefas) */
export async function exportKpiXLSX() {
  const XLSX = _getXLSX(); if (!XLSX) return;
  const wb   = XLSX.utils.book_new();
  const now  = new Date().toLocaleDateString('pt-PT');
  const user = getState('user')?.displayName ?? '—';
  const kpiValues = getState('kpiValues') ?? {};

  /* Folha 1 — KPIs */
  let KPI_DATA = [];
  try { KPI_DATA = (await import('../data/kpi.json', { assert: { type: 'json' } })).default; } catch {}
  const kpiRows = [
    [`BE-ESP — Dashboard KPI · ${ESCOLA}`],
    [`Ano letivo: ${ANO} · Gerado em: ${now} · Por: ${user}`], [],
    ['Domínio','Indicador','Meta','Valor Atual','Unidade','Estado','Fonte'],
  ];
  ['A','B','C','D'].forEach(dom => {
    KPI_DATA.filter(k => k.mabe === dom).forEach(k => {
      const v = kpiValues[k.nome] ?? '';
      kpiRows.push([dom, k.nome, k.meta, v, k.und, v ? '✓ Preenchido' : 'Não preenchido', k.fonte]);
    });
    kpiRows.push([]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(kpiRows);
  ws1['!cols'] = [{wch:10},{wch:40},{wch:14},{wch:14},{wch:14},{wch:18},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws1, 'KPIs');

  /* Folha 2 — Atividades */
  const ativRows = [[`BE-ESP — Atividades · ${ANO}`],[],
    ['Nome','Tipo','Data','Público-alvo','Participantes','Pasta OneDrive','Registado por']];
  (getState('atividades') ?? []).forEach(a =>
    ativRows.push([a.nome, a.tipo, a.data ? new Date(a.data).toLocaleDateString('pt-PT') : '—',
      a.pub ?? '—', a.part ?? 0, a.pasta ? `BE-ESP/03_Pedagogia_e_Literacias/${a.pasta}` : '—',
      a.createdBy ?? '—']));
  const ws2 = XLSX.utils.aoa_to_sheet(ativRows);
  ws2['!cols'] = [{wch:40},{wch:16},{wch:12},{wch:20},{wch:14},{wch:50},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Atividades');

  /* Folha 3 — Tarefas */
  const taskRows = [[`BE-ESP — Tarefas · ${ANO}`],[],
    ['Título','Prioridade','Prazo','Responsável','MABE','Estado','Concluída por','Data conclusão']];
  (getState('tasks') ?? []).forEach(t =>
    taskRows.push([t.title, t.prio==='h'?'Alta':t.prio==='m'?'Média':'Baixa',
      t.date??'—', t.resp??'—', t.mabe??'—', t.done?'Concluída':'Pendente',
      t.doneBy??'—', t.doneAt??'—']));
  const ws3 = XLSX.utils.aoa_to_sheet(taskRows);
  ws3['!cols'] = [{wch:50},{wch:12},{wch:12},{wch:12},{wch:8},{wch:12},{wch:20},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Tarefas');

  const fname = `BE-ESP_KPI_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fname);
  addHistory('Exportação Excel', fname);
  showToast('📊 KPIs exportados em Excel (3 folhas)', 'ok');
}

/** Exporta histórico */
export function exportHistoryXLSX() {
  const XLSX = _getXLSX(); if (!XLSX) return;
  const wb   = XLSX.utils.book_new();

  const rows = [
    [`BE-ESP — Histórico de Atividade · ${ESCOLA}`],
    [`Gerado em: ${new Date().toLocaleString('pt-PT')} · ${getState('user')?.displayName ?? '—'}`], [],
    ['Data/Hora','Utilizador','Ação','Documento','Pasta'],
  ];
  (getState('history') ?? []).forEach(h =>
    rows.push([h.dt??'—', h.user??'—', h.action??'—', h.doc??'—', h.folder??'—']));

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:20},{wch:22},{wch:28},{wch:40},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws, 'Histórico');

  /* Folha de resumo por acção */
  const counts = (getState('history') ?? []).reduce((m,h) => { m[h.action]=(m[h.action]??0)+1; return m; }, {});
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['Ação','Ocorrências'],
    ...Object.entries(counts).sort((a,b) => b[1]-a[1]),
  ]);
  ws2['!cols'] = [{wch:32},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumo');

  const fname = `BE-ESP_Historico_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fname);
  addHistory('Exportação Excel', fname);
  showToast(`📊 Histórico exportado (${(getState('history')??[]).length} registos)`, 'ok');
}
