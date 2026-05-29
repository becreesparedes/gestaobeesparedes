/**
 * store.js — Estado global reactivo BE-ESP v4
 * Observable simples sem dependências externas
 */

const _state = {
  // Sessão
  token:    null,
  user:     null,
  demo:     false,
  // OneDrive
  rootId:          null,
  currentFolderId: null,
  currentFolderName: 'BE-ESP',
  currentItems:    [],
  breadcrumb:      [],
  lastSync:        null,
  // Dados locais
  tasks:      [],
  events:     [],
  checklist:  {},
  history:    [],
  atividades: [],
  kpiValues:  {},
  // Módulos extra
  newsletter: [],
  ocorrencias: [],
  // UI
  activeView:   'dashboard',
  activeModule: 'dashboard',
  // Sistema
  isRefreshingToken:   false,
  tokenRefreshInterval: null,
};

const _subs = new Map(); // key → Set<fn>

/** Lê um valor do estado */
export const getState = k => _state[k];

/** Define um valor e notifica subscritores */
export function setState(key, value) {
  _state[key] = value;
  _subs.get(key)?.forEach(fn => fn(value));
}

/** Actualiza parcialmente um objecto no estado */
export function patchState(key, patch) {
  setState(key, { ...(_state[key] ?? {}), ...patch });
}

/** Subscreve a alterações de uma chave. Retorna unsubscribe */
export function subscribe(key, fn) {
  if (!_subs.has(key)) _subs.set(key, new Set());
  _subs.get(key).add(fn);
  return () => _subs.get(key).delete(fn);
}

/** Snapshot imutável para debug */
export const snapshot = () => ({ ..._state });
