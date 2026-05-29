export function fmtSize(b) {
  if (!b) return '—';
  if (b < 1024)        return b + ' B';
  if (b < 1024**2)     return (b/1024).toFixed(1)    + ' KB';
  if (b < 1024**3)     return (b/1024**2).toFixed(1) + ' MB';
  return (b/1024**3).toFixed(2) + ' GB';
}
export function fmtDate(iso, opts = {}) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT', opts);
}
export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT');
}
export function fileIcon(name, isFolder = false) {
  if (isFolder) return '📁';
  const ext = (name?.split('.').pop() ?? '').toLowerCase();
  return ({pdf:'📕',docx:'📝',doc:'📝',xlsx:'📊',xls:'📊',pptx:'📋',
    zip:'🗜️',rar:'🗜️',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',
    mp4:'🎬',mp3:'🎵',html:'🌐',js:'⚙️',json:'⚙️'})[ext] ?? '📄';
}
export function fileExt(name, isFolder = false) {
  if (isFolder) return 'Pasta';
  const ext = name?.split('.').pop() ?? '';
  return ext ? ('.' + ext).toUpperCase() : '—';
}
export function fileMabe(name) {
  if (!name) return '';
  const n = name.toUpperCase();
  if (/^F0[789]|F1[02]|POP-ART|05_ARTIC/.test(n))                         return 'A';
  if (/^F14|PPL|LEITURA|CLUBE|06_PROMO|POP-PPL/.test(n))                   return 'B';
  if (/^F09|EIB|PARCE|PROJ|07_PROJ|POP-PRJ/.test(n))                       return 'C';
  if (/^(POP|CL|KPI|RAA|MABE|PAA|RGPD|BKP|DES|CAT|ACQ|REG|F\d)/.test(n)) return 'D';
  return '';
}
export function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}
export function slugify(str) {
  return (str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_\-]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
}
