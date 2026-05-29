/**
 * cache.js — Cache em memória com TTL
 */
const _c = new Map();

export const TTL = {
  FOLDER: 30_000,
  SEARCH: 60_000,
  ITEM:  120_000,
};

export const cacheGet    = k => { const e = _c.get(k); if (!e || Date.now() > e.exp) { _c.delete(k); return null; } return e.data; };
export const cacheSet    = (k, data, ms = TTL.ITEM) => _c.set(k, { data, exp: Date.now() + ms });
export const cacheDelete = k  => _c.delete(k);
export const cacheClear  = () => _c.clear();
export const cacheSize   = () => { const now = Date.now(); let n = 0; for (const [k,e] of _c) { if (now <= e.exp) n++; else _c.delete(k); } return n; };
