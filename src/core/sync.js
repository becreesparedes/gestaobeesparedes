/**
 * sync.js — Sincronização OneDrive + persistência local
 */

import { getState, setState } from './store.js';
import { gGetByPath, gChildren, gGetMe } from './graph.js';
import { cacheClear } from './cache.js';
import { showToast }  from '../utils/toast.js';
import { setSyncStatus } from '../utils/dom.js';

const BE_FOLDER   = 'BE-ESP';
const LOCAL_KEY   = 'be_local_v4';
const HISTORY_MAX = 300;

/* ══════════════════════════════
   PERSISTÊNCIA LOCAL
══════════════════════════════ */
export function saveLocal() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({
      tasks:       getState('tasks'),
      events:      getState('events'),
      checklist:   getState('checklist'),
      history:     getState('history'),
      atividades:  getState('atividades'),
      kpiValues:   getState('kpiValues'),
      newsletter:  getState('newsletter'),
      ocorrencias: getState('ocorrencias'),
      lastSync:    getState('lastSync'),
    }));
  } catch (e) { console.warn('saveLocal:', e.message); }
}

export function loadLocal() {
  try {
    const d = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}');
    setState('tasks',       d.tasks       ?? _defaultTasks());
    setState('events',      d.events      ?? []);
    setState('checklist',   d.checklist   ?? {});
    setState('history',     d.history     ?? []);
    setState('atividades',  d.atividades  ?? _defaultAtividades());
    setState('kpiValues',   d.kpiValues   ?? {});
    setState('newsletter',  d.newsletter  ?? []);
    setState('ocorrencias', d.ocorrencias ?? []);
    if (d.lastSync) setState('lastSync', new Date(d.lastSync));
  } catch {
    setState('tasks', _defaultTasks());
    setState('atividades', _defaultAtividades());
  }
}

export function verifyIntegrity() {
  const checks = [
    ['tasks',      _defaultTasks,      v => Array.isArray(v)],
    ['events',     () => [],           v => Array.isArray(v)],
    ['history',    () => [],           v => Array.isArray(v)],
    ['atividades', _defaultAtividades, v => Array.isArray(v)],
    ['checklist',  () => ({}),         v => v && typeof v === 'object' && !Array.isArray(v)],
    ['kpiValues',  () => ({}),         v => v && typeof v === 'object' && !Array.isArray(v)],
  ];
  let repaired = false;
  for (const [key, def, ok] of checks) {
    if (!ok(getState(key))) { setState(key, def()); repaired = true; }
  }
  if (repaired) saveLocal();
  return repaired;
}

/* ══════════════════════════════
   HISTÓRICO
══════════════════════════════ */
export function addHistory(action, doc = '', folder = '') {
  const h = getState('history') ?? [];
  h.unshift({
    dt:     new Date().toLocaleString('pt-PT'),
    user:   getState('user')?.displayName ?? '—',
    action, doc, folder,
  });
  if (h.length > HISTORY_MAX) h.pop();
  setState('history', h);
  saveLocal();
}

/* ══════════════════════════════
   SINCRONIZAÇÃO ONEDRIVE
══════════════════════════════ */
export async function syncNow() {
  if (!navigator.onLine && !getState('demo')) {
    setSyncStatus('Offline — cache local', 'error');
    return;
  }
  setSyncStatus('A sincronizar…', 'syncing');

  try {
    /* 1. Utilizador (só se não estiver em cache) */
    if (!getState('user') && !getState('demo')) {
      const me = await gGetMe();
      const user = { displayName: me.displayName, mail: me.mail ?? me.userPrincipalName, id: me.id };
      setState('user', user);
      localStorage.setItem('be_user', JSON.stringify(user));
    }

    /* 2. Pasta raiz BE-ESP */
    let rootId;
    if (!getState('demo')) {
      try {
        const r = await gGetByPath(BE_FOLDER);
        rootId  = r.id;
      } catch {
        const r = await import('./graph.js').then(m => m.gGet('/me/drive/root'));
        rootId  = r.id;
        showToast('⚠️ Pasta BE-ESP não encontrada. A mostrar raiz do OneDrive.', 'warn');
      }
    } else {
      rootId = 'demo_root';
    }
    setState('rootId', rootId);

    /* 3. Filhos de primeiro nível */
    const ch = await gChildren(rootId);
    setState('currentItems',    ch.value ?? []);
    setState('currentFolderId', rootId);
    setState('currentFolderName', BE_FOLDER);
    setState('breadcrumb', [{ name: BE_FOLDER, id: rootId }]);

    /* 4. Registar sincronização */
    const now = new Date();
    setState('lastSync', now);
    const ts  = now.toLocaleTimeString('pt-PT');
    setSyncStatus('Sincronizado · ' + ts, 'ok');

    const sbSync = document.getElementById('sb-sync');
    if (sbSync) sbSync.textContent = ts;
    const pSync = document.getElementById('p-sync');
    if (pSync) pSync.textContent = now.toLocaleString('pt-PT');

    saveLocal();
    addHistory('Sincronização OneDrive', '', BE_FOLDER);
    showToast('✅ OneDrive sincronizado' + (getState('demo') ? ' (demo)' : ''));

  } catch (e) {
    setSyncStatus('Erro: ' + e.message.slice(0,50), 'error');
    showToast('⚠️ Sync: ' + e.message.slice(0,80), 'danger');
  }
}

/* ══════════════════════════════
   DADOS PADRÃO
══════════════════════════════ */
export function _defaultTasks() {
  return [
    { id:1, title:'Notificar utilizadores com atrasos (POP-ATR-01)', prio:'h', date:'2026-05-30', resp:'AO', mabe:'D', done:false },
    { id:2, title:'Preparar Semana da Leitura',                      prio:'h', date:'2026-06-02', resp:'PB', mabe:'B', done:false },
    { id:3, title:'Verificar backup BiblioNet (F17)',                 prio:'h', date:'2026-06-01', resp:'PB', mabe:'D', done:false },
    { id:4, title:'Rever sugestões de aquisição (F03)',               prio:'m', date:'2026-05-30', resp:'PB', mabe:'D', done:false },
    { id:5, title:'Atualizar website e redes sociais',                prio:'m', date:'2026-05-29', resp:'DC', mabe:'D', done:false },
    { id:6, title:'Reunião de arranque da equipa + F15',              prio:'l', date:'2026-09-01', resp:'PB', mabe:'D', done:true  },
  ];
}

export function _defaultAtividades() {
  return [
    { id:1, nome:'Exposição Temática — Outubro',  tipo:'Exposição',   data:'2025-10-15', pub:'Toda a escola', part:0,   pasta:'AT_2025-10_EXP_Exposicao_Tematica',  createdAt:'2025-10-15' },
    { id:2, nome:'Hora do Conto — Novembro',       tipo:'PPL',         data:'2025-11-20', pub:'1.º e 2.º ciclo', part:60, pasta:'AT_2025-11_PPL_Hora_do_Conto',     createdAt:'2025-11-20' },
    { id:3, nome:'Articulação 8.º Português',      tipo:'Articulação', data:'2026-01-14', pub:'8.º ano',       part:28,  pasta:'AT_2026-01_ART_8A_Portugues',        createdAt:'2026-01-14' },
    { id:4, nome:'Dia Mundial do Livro',           tipo:'PPL',         data:'2026-04-23', pub:'Toda a escola', part:120, pasta:'AT_2026-04_PPL_Dia_Mundial_Livro',    createdAt:'2026-04-23' },
    { id:5, nome:'Semana da Leitura',              tipo:'PPL',         data:'2026-05-05', pub:'Toda a escola', part:200, pasta:'AT_2026-05_PPL_Semana_Leitura',       createdAt:'2026-05-05' },
  ];
}
