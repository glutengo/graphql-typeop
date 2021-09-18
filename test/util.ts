export function normalizeDoc(str) {
  return str.replace(/\n/g,' ').split(/\s+/g).join(' ').trim();
}
