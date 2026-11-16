// localStorage kann (privater Modus, Sandbox, volle Quote) fehlen oder werfen –
// darum ist jeder Zugriff abgesichert und die App funktioniert auch ohne.

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher nicht verfügbar – Einstellung gilt dann nur für diese Sitzung */
  }
}

export const KEYS = {
  favorites: 'quranRadio.favorites.v1',
  volume: 'quranRadio.volume.v1',
  muted: 'quranRadio.muted.v1',
  sort: 'quranRadio.countrySort.v1',
  stationsCache: 'quranRadio.stationsCache.v1', // letzte erfolgreich geladene Senderliste (für Offline)
  lastStation: 'quranRadio.lastStation.v1', // zuletzt gespielter Sender (Wiederherstellung nach App-Neustart)
};
