/**
 * export-pdf.js — Exportações PDF com jsPDF
 */
import { getState }    from '../core/store.js';
import { addHistory }  from '../core/sync.js';
import { showToast }   from './toast.js';

const ESCOLA  = 'Escola Secundária de Paredes';
const APP_VER = 'BE-ESP v4';
const ANO     = '2025–2026';

function _getjsPDF() {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) { showToast('⚠️ jsPDF não carregado', 'danger'); return null; }
  return jsPDF;
}

function _header(doc, title, sub) {
  doc.setFillColor(26, 39, 68);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 10);
  doc.setFontSize(8);  doc.setFont('helvetica', 'normal');
  doc.text(sub ?? `${ESCOLA} · ${ANO}`, 14, 17);
  doc.text(new Date().toLocaleString('pt-PT'), 196, 17, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  return 30;
}

function _footer(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`${APP_VER} · ${ESCOLA}`, 14, 292);
    doc.text(`Página ${i} de ${pages}`, 196, 292, { align: 'right' });
    doc.setTextColor(0);
  }
}

function _checkPage(doc, y, needed = 12) {
  if (y + needed > 282) { doc.addPage(); return 16; }
  return y;
}

function _sectionTitle(doc, text, y) {
  doc.setFillColor(219, 234, 254);
  doc.rect(14, y - 4, 182, 7, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 39, 68);
  doc.text(text, 16, y);
  doc.setTextColor(0); doc.setFont('helvetica', 'normal');
  return y + 8;
}

/** Exporta o dashboard */
export function exportDashboardPDF() {
  const jsPDF = _getjsPDF(); if (!jsPDF) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = _header(doc, 'Dashboard — Visão Geral');

  /* KPIs */
  y = _sectionTitle(doc, 'Indicadores Principais', y);
  const kpis = [
    { l: 'Pastas OneDrive',   v: document.getElementById('kpi-pastas')?.textContent  ?? '—' },
    { l: 'Ficheiros estimados', v: document.getElementById('kpi-docs')?.textContent   ?? '—' },
    { l: 'Tarefas pendentes',  v: document.getElementById('kpi-tasks')?.textContent   ?? '—' },
    { l: 'Alertas ativos',     v: document.getElementById('kpi-alerts')?.textContent  ?? '—' },
  ];
  kpis.forEach((k, i) => {
    const x = 14 + i * 46;
    doc.setFillColor(249, 250, 251); doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, y, 44, 18, 2, 2, 'FD');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 39, 68);
    doc.text(String(k.v), x + 22, y + 9, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(75, 85, 99);
    doc.text(k.l, x + 22, y + 15, { align: 'center' });
    doc.setTextColor(0);
  });
  y += 24;

  /* Tarefas pendentes */
  const tasks = (getState('tasks') ?? []).filter(t => !t.done);
  y = _checkPage(doc, y, 14);
  y = _sectionTitle(doc, `Tarefas Pendentes (${tasks.length})`, y);
  if (!tasks.length) {
    doc.setFontSize(9); doc.text('✅ Sem tarefas pendentes.', 16, y); y += 8;
  } else {
    tasks.slice(0, 10).forEach(t => {
      y = _checkPage(doc, y, 9);
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(`• ${t.title}`, 16, y, { maxWidth: 140 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(75, 85, 99);
      doc.text(`${t.date ?? 'Sem prazo'} · ${t.resp}`, 162, y, { align: 'right' });
      doc.setTextColor(0); y += 8;
    });
  }

  /* Ficheiros recentes */
  const recent = [...(getState('currentItems') ?? [])]
    .sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime))
    .slice(0, 12);
  y = _checkPage(doc, y, 14);
  y = _sectionTitle(doc, 'Ficheiros Recentes no OneDrive', y);
  doc.setFillColor(243, 244, 246); doc.rect(14, y - 3, 182, 6, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(75, 85, 99);
  doc.text('Nome', 16, y); doc.text('Modificado', 168, y, { align: 'right' });
  doc.setTextColor(0); doc.setFont('helvetica', 'normal'); y += 5;
  recent.forEach(f => {
    y = _checkPage(doc, y, 7);
    const dt = f.lastModifiedDateTime ? new Date(f.lastModifiedDateTime).toLocaleDateString('pt-PT') : '—';
    doc.setFontSize(7);
    doc.text((f.folder ? '📁 ' : '📄 ') + f.name.slice(0, 68), 16, y);
    doc.text(dt, 192, y, { align: 'right' });
    doc.setDrawColor(229, 231, 235); doc.line(14, y + 1.5, 196, y + 1.5);
    y += 6;
  });

  _footer(doc);
  const fname = `BE-ESP_Dashboard_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fname);
  addHistory('Exportação PDF', fname);
  showToast('📄 Dashboard exportado em PDF', 'ok');
}

/** Exporta lista de KPIs */
export function exportKpiPDF() {
  const jsPDF = _getjsPDF(); if (!jsPDF) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = _header(doc, 'Indicadores KPI');

  const kpiValues = getState('kpiValues') ?? {};

  ['A','B','C','D'].forEach(dom => {
    y = _checkPage(doc, y, 16);
    y = _sectionTitle(doc, `Domínio ${dom}`, y);
    doc.setFillColor(243, 244, 246); doc.rect(14, y - 3, 182, 6, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(75, 85, 99);
    doc.text('Indicador', 16, y); doc.text('Meta', 118, y); doc.text('Valor', 140, y); doc.text('Estado', 174, y);
    doc.setTextColor(0); doc.setFont('helvetica', 'normal'); y += 5;

    import('../data/kpi.json', { assert: { type: 'json' } })
      .then(({ default: KPI_DATA }) => {
        KPI_DATA.filter(k => k.mabe === dom).forEach(k => {
          const v = kpiValues[k.nome] ?? '—';
          y = _checkPage(doc, y, 8);
          doc.setFontSize(7.5);
          doc.text(k.nome.slice(0, 52), 16, y);
          doc.text(k.meta, 118, y);
          doc.setFont('helvetica', 'bold'); doc.text(v, 140, y);
          doc.setFont('helvetica', 'normal');
          if (v !== '—') { doc.setTextColor(22, 163, 74); doc.text('✓', 176, y); }
          else            { doc.setTextColor(146, 64, 14); doc.text('∅', 176, y); }
          doc.setTextColor(0);
          doc.setDrawColor(229, 231, 235); doc.line(14, y + 1.5, 196, y + 1.5);
          y += 6;
        });
      });
    y += 4;
  });

  _footer(doc);
  const fname = `BE-ESP_KPI_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fname);
  addHistory('Exportação PDF', fname);
  showToast('📄 KPIs exportados em PDF', 'ok');
}

/** Exporta uma checklist */
export function exportChecklistPDF(cl) {
  const jsPDF = _getjsPDF(); if (!jsPDF) return;
  const doc  = new jsPDF();
  const done = getState('checklist')?.[cl.code] ?? [];

  doc.setFontSize(14); doc.text(`${cl.code} — ${cl.name}`, 14, 20);
  doc.setFontSize(10); doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')} · ${getState('user')?.displayName ?? '—'}`, 14, 29);
  let y = 44;
  cl.items.forEach((item, i) => {
    doc.setFontSize(11);
    doc.text(`${done.includes(i) ? '[✓]' : '[ ]'} ${item}`, 16, y);
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
  });
  const fname = `${cl.code}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fname);
  showToast('📄 PDF exportado', 'ok');
}
