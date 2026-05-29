/**
 * views/arquivo.js — Arquivo Histórico por ano letivo
 */
import { esc } from '../utils/format.js';

const ANOS = [
  { folder:'10_Arquivo_Histórico/01_2023-2024', label:'2023–2024',
    subs:['01_Planeamento','02_Atividades','03_Relatórios','04_Evidências','05_Comunicação'] },
  { folder:'10_Arquivo_Histórico/02_2024-2025', label:'2024–2025', subs:[] },
  { folder:'10_Arquivo_Histórico/03_2025-2026', label:'2025–2026 (ano actual)', subs:[] },
];

const FECHADOS = [
  { label:'Normativos',           folder:'10_Arquivo_Histórico/04_Documentos_Fechados/01_Normativos' },
  { label:'Projetos Encerrados',  folder:'10_Arquivo_Histórico/04_Documentos_Fechados/02_Projetos_Encerrados' },
  { label:'Relatórios Finalizados', folder:'10_Arquivo_Histórico/04_Documentos_Fechados/03_Relatórios_Finalizados' },
  { label:'Evidências Arquivadas',folder:'10_Arquivo_Histórico/04_Documentos_Fechados/04_Evidências_Arquivadas' },
  { label:'Arquivo Administrativo',folder:'10_Arquivo_Histórico/04_Documentos_Fechados/05_Arquivo_Administrativo' },
];

export function init(container) {
  container.innerHTML = `
  <div class="page-header" style="border-left:4px solid var(--mod-arquivo)">
    <div class="page-header-icon" aria-hidden="true">🗃️</div>
    <div class="page-header-info">
      <h2>Arquivo Histórico</h2>
      <p>Anos letivos fechados · Documentos finais · Evidências arquivadas</p>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-ghost btn-sm"
        onclick="_browseMABE('10_Arquivo_Histórico')">
        📁 Ver tudo
      </button>
    </div>
  </div>
  <div class="pad">

    <!-- Anos letivos -->
    <div class="sec-hdr mb-3">
      <h3>📅 Anos letivos</h3>
      <div class="sec-line"></div>
    </div>
    <div class="g3" style="margin-bottom:var(--sp-5)">
      ${ANOS.map(a => `
        <div class="card card-hover" onclick="_browseMABE('${esc(a.folder)}')"
          role="button" tabindex="0"
          aria-label="Arquivo ${esc(a.label)}"
          onkeydown="if(event.key==='Enter'||event.key===' ')_browseMABE('${esc(a.folder)}')">
          <div style="font-size:20px;margin-bottom:var(--sp-2)" aria-hidden="true">🗃️</div>
          <div style="font-weight:700;font-size:.9rem;color:var(--brand);margin-bottom:4px">
            Ano letivo ${esc(a.label)}
          </div>
          <div class="card-desc">Documentos fechados deste ano letivo</div>
          ${a.subs.length ? `
            <div style="margin-top:var(--sp-2);border-top:1px solid var(--grey-200);padding-top:var(--sp-2)">
              ${a.subs.map(sub => `
                <div style="font-size:.7rem;color:var(--grey-500);padding:2px 0;display:flex;align-items:center;gap:4px">
                  <span aria-hidden="true">📁</span>
                  ${esc(sub.replace(/^\d+_/,'').replace(/_/g,' '))}
                </div>`).join('')}
            </div>` : ''}
        </div>`).join('')}
    </div>

    <!-- Documentos fechados -->
    <div class="sec-hdr mb-3">
      <h3>📂 Documentos Fechados</h3>
      <div class="sec-line"></div>
    </div>
    <div class="card" style="margin-bottom:var(--sp-4)">
      ${FECHADOS.map(f => `
        <div class="file-item" role="button" tabindex="0"
          onclick="_browseMABE('${esc(f.folder)}')"
          onkeydown="if(event.key==='Enter')_browseMABE('${esc(f.folder)}')"
          aria-label="Abrir ${esc(f.label)}">
          <span class="file-icon" aria-hidden="true">📁</span>
          <span class="file-name">${esc(f.label)}</span>
          <span class="file-meta" style="font-family:var(--font-mono);font-size:.62rem">
            ${esc(f.folder.split('/').pop())}
          </span>
        </div>`).join('')}
    </div>

    <!-- Atas e relatórios finais -->
    <div class="sec-hdr mb-3">
      <h3>📑 Atas e Relatórios Finais</h3>
      <div class="sec-line"></div>
    </div>
    <div class="card">
      <div class="file-item" role="button" tabindex="0"
        onclick="_browseMABE('10_Arquivo_Histórico/05_Atas_e_Relatórios_Finais')"
        onkeydown="if(event.key==='Enter')_browseMABE('10_Arquivo_Histórico/05_Atas_e_Relatórios_Finais')"
        aria-label="Abrir Atas e Relatórios Finais">
        <span class="file-icon" aria-hidden="true">📁</span>
        <span class="file-name">Atas e Relatórios Finais</span>
        <span class="file-meta" style="font-family:var(--font-mono);font-size:.62rem">
          05_Atas_e_Relatórios_Finais
        </span>
      </div>
    </div>

    <!-- Nota de rodapé -->
    <div style="margin-top:var(--sp-5);padding:var(--sp-4);background:var(--grey-100);
      border-radius:var(--r);border:1px solid var(--grey-200);font-size:.75rem;
      color:var(--grey-500);line-height:1.6">
      <strong style="color:var(--brand)">ℹ️ Política de arquivo:</strong>
      No final de cada ano letivo, os documentos são movidos para a pasta
      correspondente em <code>10_Arquivo_Histórico</code>. O ano actual
      (<code>03_2025-2026</code>) é usado durante o ano para guardar
      documentos em progresso que serão arquivados em junho.
    </div>
  </div>`;
}

export function refresh() {}
