/**
 * auth.js — Autenticação Microsoft 365 via PKCE
 * Login, callback, refresh automático, logout, modo demo
 */

import { getState, setState } from './store.js';
import { cacheClear }         from './cache.js';

const SCOPES = 'Files.ReadWrite User.Read offline_access';
const RENEW_BEFORE_MS  = 10 * 60 * 1000;  // renovar 10 min antes
const CHECK_INTERVAL   =  5 * 60 * 1000;  // verificar de 5 em 5 min
const MAX_RETRIES      = 3;

/* ── URI de redireccionamento ── */
export const getRedirectUri = () =>
  location.href.split('?')[0].split('#')[0];

/* ── PKCE ── */
async function _pkce() {
  const raw       = crypto.getRandomValues(new Uint8Array(32));
  const verifier  = btoa(String.fromCharCode(...raw)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const digest    = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return { verifier, challenge };
}

/* ── Guardar tokens ── */
function _saveTokens(data) {
  setState('token', data.access_token);
  localStorage.setItem('be_token',     data.access_token);
  localStorage.setItem('be_token_exp', Date.now() + parseInt(data.expires_in ?? 3600) * 1000);
  if (data.refresh_token) localStorage.setItem('be_refresh', data.refresh_token);
}

/* ── Iniciar login PKCE ── */
export async function startLogin(clientId, tenant = 'common') {
  if (!clientId) throw new Error('Client ID é obrigatório.');
  localStorage.setItem('be_cid', clientId);
  localStorage.setItem('be_tid', tenant);

  const { verifier, challenge } = await _pkce();
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2,'0')).join('');

  sessionStorage.setItem('pkce_v', verifier);
  sessionStorage.setItem('pkce_s', state);

  const p = new URLSearchParams({
    client_id: clientId, response_type: 'code',
    redirect_uri: getRedirectUri(), scope: SCOPES,
    response_mode: 'query', state,
    code_challenge: challenge, code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  location.href = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${p}`;
}

/* ── Processar callback OAuth2 ── */
export async function handleCallback() {
  const p    = new URLSearchParams(location.search);
  const code = p.get('code');
  const err  = p.get('error');
  if (!code && !err) return false;

  history.replaceState({}, '', location.pathname);

  if (err) throw new Error('Microsoft: ' + decodeURIComponent(p.get('error_description') ?? err));
  if (p.get('state') !== sessionStorage.getItem('pkce_s'))
    throw new Error('Erro de segurança (state inválido). Tente novamente.');

  const clientId = localStorage.getItem('be_cid');
  const tenant   = localStorage.getItem('be_tid') ?? 'common';
  const verifier = sessionStorage.getItem('pkce_v');

  const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId, grant_type: 'authorization_code',
      code, redirect_uri: getRedirectUri(),
      code_verifier: verifier, scope: SCOPES,
    }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error_description ?? data.error);
  _saveTokens(data);
  sessionStorage.clear();
  return true;
}

/* ── Renovar access token ── */
export async function refreshAccessToken() {
  if (getState('isRefreshingToken')) return false;
  setState('isRefreshingToken', true);

  const refresh  = localStorage.getItem('be_refresh');
  const clientId = localStorage.getItem('be_cid');
  const tenant   = localStorage.getItem('be_tid') ?? 'common';

  if (!refresh) { setState('isRefreshingToken', false); return false; }

  try {
    const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId, grant_type: 'refresh_token',
        refresh_token: refresh, scope: SCOPES,
      }),
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error_description ?? data.error);
    _saveTokens(data);
    setState('isRefreshingToken', false);
    return true;
  } catch {
    setState('isRefreshingToken', false);
    return false;
  }
}

/* ── Verificação periódica ── */
export async function checkToken() {
  if (getState('demo')) return;
  const exp    = parseInt(localStorage.getItem('be_token_exp') ?? '0');
  const left   = exp - Date.now();
  if (left <= 0 || left < RENEW_BEFORE_MS) {
    const ok = await refreshAccessToken();
    if (!ok) {
      import('../utils/toast.js').then(({ showToast }) =>
        showToast('⚠️ Sessão expirada. Por favor inicie sessão novamente.', 'danger'));
      setTimeout(() => logout(), 2500);
    }
  }
}

export function startTokenMonitor() {
  stopTokenMonitor();
  checkToken();
  setState('tokenRefreshInterval', setInterval(checkToken, CHECK_INTERVAL));
}
export function stopTokenMonitor() {
  const id = getState('tokenRefreshInterval');
  if (id) { clearInterval(id); setState('tokenRefreshInterval', null); }
}

/* ── Modo demo ── */
export function startDemo() {
  setState('demo', true);
  setState('user', { displayName: 'Modo Demonstração', mail: 'demo@be-esp.pt', id: 'demo' });
}

/* ── Logout ── */
export function logout() {
  const cid    = localStorage.getItem('be_cid') ?? '';
  const tenant = localStorage.getItem('be_tid') ?? 'common';
  stopTokenMonitor();
  setState('token', null); setState('user', null); setState('demo', false);
  ['be_token','be_token_exp','be_refresh','be_user'].forEach(k => localStorage.removeItem(k));
  sessionStorage.clear(); cacheClear();
  if (cid) window.open(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(getRedirectUri())}`,
    '_blank', 'noopener,noreferrer'
  );
  setTimeout(() => location.reload(), 600);
}

/* ── Sessão guardada válida ── */
export function getStoredSession() {
  const token = localStorage.getItem('be_token');
  const exp   = parseInt(localStorage.getItem('be_token_exp') ?? '0');
  const user  = JSON.parse(localStorage.getItem('be_user') ?? 'null');
  return (token && exp > Date.now() + 60_000 && user) ? { token, user } : null;
}
