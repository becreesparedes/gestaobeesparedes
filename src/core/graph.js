/**
 * graph.js — Camada Microsoft Graph API
 * Queue de pedidos, retry 401/429, cache, upload multipart
 */

import { getState }               from './store.js';
import { cacheGet, cacheSet, TTL } from './cache.js';
import { refreshAccessToken }      from './auth.js';

const BASE = 'https://graph.microsoft.com/v1.0';
const MAX  = 3;

/* ── Queue (máx 5 paralelos) ── */
const Q = { running: 0, max: 5, q: [] };
function _enq(fn) {
  return new Promise((res, rej) => { Q.q.push({ fn, res, rej }); _run(); });
}
function _run() {
  while (Q.running < Q.max && Q.q.length) {
    const { fn, res, rej } = Q.q.shift();
    Q.running++;
    fn().then(r => { Q.running--; res(r); _run(); })
        .catch(e => { Q.running--; rej(e); _run(); });
  }
}

/* ── GET base ── */
export async function gGet(path, retry = 0) {
  if (getState('demo')) return _demoData(path);
  const cached = cacheGet(path);
  if (cached) return cached;

  return _enq(async () => {
    const r = await fetch(BASE + path, {
      headers: { Authorization: 'Bearer ' + getState('token'), Accept: 'application/json' },
    });

    if (r.status === 401) {
      if (retry >= MAX) throw new Error('401: sessão expirada.');
      const ok = await refreshAccessToken();
      if (ok) return gGet(path, retry + 1);
      throw new Error('401: não foi possível renovar a sessão.');
    }
    if (r.status === 429) {
      if (retry >= MAX) throw new Error('429: limite de pedidos.');
      const wait = (parseInt(r.headers.get('Retry-After') ?? '5') + retry * 2) * 1000;
      await new Promise(r => setTimeout(r, wait));
      return gGet(path, retry + 1);
    }
    if (!r.ok) throw new Error(`Graph ${r.status}: ${(await r.text()).slice(0,200)}`);

    const data = await r.json();
    cacheSet(path, data);
    return data;
  });
}

/* ── Helpers ── */
export const gGetByPath = rel =>
  gGet(`/me/drive/root:/${encodeURIComponent(rel)}`);

export async function gChildren(id, next = null) {
  if (getState('demo')) return _demoFolder(id);
  const key = `ch_${id}_${next ?? ''}`;
  const c   = cacheGet(key);
  if (c) return c;
  const url = next
    ? next.replace(BASE, '')
    : `/me/drive/items/${id}/children?$orderby=name&$top=200&$select=id,name,size,folder,file,lastModifiedDateTime,webUrl,parentReference`;
  const d = await gGet(url);
  cacheSet(key, d, TTL.FOLDER);
  return d;
}

export async function gCreateFolder(parentId, name) {
  if (getState('demo')) return { id: 'demo_' + Date.now(), name };
  const r = await fetch(`${BASE}/me/drive/items/${parentId}/children`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getState('token'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, folder: {}, '@microsoft.graph.conflictBehavior': 'rename' }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function gUpload(parentId, filename, file, onProgress) {
  if (getState('demo')) return { id: 'demo_up_' + Date.now() };
  const token = getState('token');

  if (file.size <= 4 * 1024 * 1024) {
    onProgress?.(50, 'A enviar…');
    const r = await fetch(`${BASE}/me/drive/items/${parentId}:/${encodeURIComponent(filename)}:/content`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!r.ok) throw new Error(await r.text());
    onProgress?.(100, 'Concluído');
    return r.json();
  }

  /* Upload de sessão para ficheiros >4 MB */
  const sess = await fetch(`${BASE}/me/drive/items/${parentId}:/${encodeURIComponent(filename)}:/createUploadSession`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'rename', name: filename } }),
  });
  const { uploadUrl } = await sess.json();
  const CS = 10 * 1024 * 1024;
  let start = 0, result;
  while (start < file.size) {
    const end = Math.min(start + CS, file.size);
    const r2  = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Range': `bytes ${start}-${end-1}/${file.size}`, 'Content-Length': String(end-start) },
      body: file.slice(start, end),
    });
    if (r2.status === 200 || r2.status === 201) result = await r2.json();
    onProgress?.(Math.round(end/file.size*100), `${Math.round(end/file.size*100)}%`);
    start = end;
  }
  return result;
}

export async function gSearch(q, folderId = null) {
  if (getState('demo')) return _demoSearch(q);
  const esc    = (q ?? '').replace(/'/g, "''");
  const params = `?$top=50&$select=id,name,size,folder,file,lastModifiedDateTime,webUrl,parentReference`;
  const base   = folderId
    ? `/me/drive/items/${folderId}/search(q='${esc}')${params}`
    : `/me/drive/root/search(q='${esc}')${params}`;
  return gGet(base);
}

export const gSharedWithMe = () =>
  getState('demo')
    ? Promise.resolve({ value: [] })
    : gGet('/me/drive/sharedWithMe?$top=50&$select=id,name,remoteItem,lastModifiedDateTime');

export const gGetMe = () =>
  gGet('/me?$select=displayName,mail,userPrincipalName,id');

/* ── Dados demo ── */
const DEMO_ROOT = [
  { id:'df00', name:'00_Entrada_e_Ativos',          folder:{childCount:5},  lastModifiedDateTime:'2026-05-01T08:00:00Z', size:0, webUrl:'#' },
  { id:'df01', name:'01_Governança_e_Normativos',   folder:{childCount:12}, lastModifiedDateTime:'2026-01-15T09:00:00Z', size:0, webUrl:'#' },
  { id:'df02', name:'02_Organização_e_Operação',    folder:{childCount:18}, lastModifiedDateTime:'2026-04-20T10:00:00Z', size:0, webUrl:'#' },
  { id:'df03', name:'03_Pedagogia_e_Literacias',    folder:{childCount:20}, lastModifiedDateTime:'2026-04-22T15:00:00Z', size:0, webUrl:'#' },
  { id:'df04', name:'04_Recursos_e_Coleção',        folder:{childCount:19}, lastModifiedDateTime:'2026-03-10T11:00:00Z', size:0, webUrl:'#' },
  { id:'df05', name:'05_Utilizadores_e_Serviços',   folder:{childCount:14}, lastModifiedDateTime:'2026-05-02T09:00:00Z', size:0, webUrl:'#' },
  { id:'df06', name:'06_Comunicação_e_Imagem',      folder:{childCount:14}, lastModifiedDateTime:'2026-04-28T17:00:00Z', size:0, webUrl:'#' },
  { id:'df07', name:'07_Avaliação_e_Melhoria',      folder:{childCount:17}, lastModifiedDateTime:'2026-04-28T17:00:00Z', size:0, webUrl:'#' },
  { id:'df08', name:'08_Gestão_Digital_e_TIC',      folder:{childCount:14}, lastModifiedDateTime:'2026-03-15T14:00:00Z', size:0, webUrl:'#' },
  { id:'df09', name:'09_Formulários_e_Modelos',     folder:{childCount:15}, lastModifiedDateTime:'2026-04-01T10:00:00Z', size:0, webUrl:'#' },
  { id:'df10', name:'10_Arquivo_Histórico',         folder:{childCount:18}, lastModifiedDateTime:'2025-07-10T16:00:00Z', size:0, webUrl:'#' },
];
const DEMO_FILES = [
  { id:'ff1', name:'MP-BE-ESP_2026.pdf',          file:{mimeType:'application/pdf'}, lastModifiedDateTime:'2026-01-15T09:00:00Z', size:245000, webUrl:'#', parentReference:{path:'/BE-ESP/01_Governança_e_Normativos'} },
  { id:'ff2', name:'PAA-BE_2025-2026.docx',       file:{}, lastModifiedDateTime:'2025-09-28T14:30:00Z', size:89000,  webUrl:'#', parentReference:{path:'/BE-ESP/00_Entrada_e_Ativos'} },
  { id:'ff3', name:'Dashboard_KPI_2025-2026.xlsx',file:{}, lastModifiedDateTime:'2026-04-28T17:00:00Z', size:123000, webUrl:'#', parentReference:{path:'/BE-ESP/07_Avaliação_e_Melhoria'} },
  { id:'ff4', name:'POP-ART-01_Articulacao.docx', file:{}, lastModifiedDateTime:'2026-01-05T08:00:00Z', size:56000,  webUrl:'#', parentReference:{path:'/BE-ESP/02_Organização_e_Operação'} },
  { id:'ff5', name:'F07_8A_Portugues_Mai.docx',   file:{}, lastModifiedDateTime:'2026-04-10T10:15:00Z', size:34000,  webUrl:'#', parentReference:{path:'/BE-ESP/09_Formulários_e_Modelos'} },
];
function _demoData(path) {
  if (path.includes('/me?')) return Promise.resolve({ displayName:'Maria João Ferreira (Demo)', mail:'mj.ferreira@esparedes.pt', id:'demo' });
  return Promise.resolve({ value: [] });
}
function _demoFolder(id) {
  return Promise.resolve({ value: id === 'demo_root' ? DEMO_ROOT : DEMO_FILES.slice(0,3) });
}
function _demoSearch(q) {
  return Promise.resolve({ value: [...DEMO_ROOT,...DEMO_FILES].filter(f => f.name.toLowerCase().includes(q.toLowerCase())) });
}
