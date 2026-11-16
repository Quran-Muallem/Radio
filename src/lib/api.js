import { normalizeCountry, RECITERS_CATEGORY } from './countries.js';

// Öffentliche, kostenlose APIs – kein API-Key nötig.
const RB_PRIMARY = 'https://de1.api.radio-browser.info';
// Ausweich-Server derselben offenen Datenbank, falls de1 kurzzeitig nicht antwortet
const RB_MIRRORS = [RB_PRIMARY, 'https://de2.api.radio-browser.info', 'https://fi1.api.radio-browser.info'];

export const SOURCES = {
  worldwide: '/json/stations/search?tag=quran&hidebroken=true&order=votes&reverse=true',
  zitouna: '/json/stations/byname/Zitouna?hidebroken=true',
  mp3quran: 'https://mp3quran.net/api/v3/radios?language=eng',
};

const TIMEOUT_MS = 12000;

async function fetchJson(url, { timeout = TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Radio-Browser: erst de1, bei Ausfall die Spiegelserver
async function fetchRadioBrowser(path) {
  let lastErr;
  for (const base of RB_MIRRORS) {
    try {
      return await fetchJson(base + path);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

const isHttps = (u) => typeof u === 'string' && u.trim().toLowerCase().startsWith('https://');

export function cleanName(name) {
  return (name || '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–|:]+|[\s\-–|:]+$/g, '')
    .trim();
}

function dedupeKey(name) {
  return cleanName(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function fromRadioBrowser(s) {
  const url = (s.url_resolved && s.url_resolved.trim()) || (s.url && s.url.trim()) || '';
  return {
    id: `rb-${s.stationuuid}`,
    source: 'radio-browser',
    uuid: s.stationuuid,
    name: cleanName(s.name) || 'Unbenannter Sender',
    url,
    favicon: isHttps(s.favicon) ? s.favicon : '',
    homepage: isHttps(s.homepage) ? s.homepage : '',
    country: normalizeCountry(s.country, s.countrycode),
    countrycode: (s.countrycode || '').toUpperCase(),
    tags: (s.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4),
    codec: s.codec || '',
    bitrate: Number(s.bitrate) || 0,
    hls: s.hls === 1 || /\.m3u8(\?|$)/i.test(url),
    votes: Number(s.votes) || 0,
    language: s.language || '',
  };
}

function fromMp3Quran(r) {
  const url = (r.url || '').trim();
  return {
    id: `mq-${r.id}`,
    source: 'mp3quran',
    uuid: null,
    name: cleanName(r.name).replace(/^Radio\s+/i, '') || 'Rezitation',
    url,
    favicon: '',
    homepage: 'https://mp3quran.net',
    country: RECITERS_CATEGORY,
    countrycode: '',
    tags: ['24/7'],
    codec: 'MP3',
    bitrate: 0,
    hls: /\.m3u8(\?|$)/i.test(url),
    votes: 0,
    language: '',
  };
}

/**
 * Lädt alle drei Quellen parallel. Ein Ausfall einer Quelle blockiert die anderen nicht.
 * Rückgabe: { stations, errors: [{source, message}], counts: {source: n} }
 */
export async function loadAllStations() {
  const [worldwide, zitouna, mp3] = await Promise.allSettled([
    fetchRadioBrowser(SOURCES.worldwide),
    fetchRadioBrowser(SOURCES.zitouna),
    fetchJson(SOURCES.mp3quran),
  ]);

  const errors = [];
  const counts = { worldwide: 0, zitouna: 0, mp3quran: 0 };

  const zitounaList =
    zitouna.status === 'fulfilled' && Array.isArray(zitouna.value)
      ? zitouna.value.filter((s) => (s.countrycode || '').toUpperCase() === 'TN').map(fromRadioBrowser)
      : [];
  if (zitouna.status === 'rejected') errors.push({ source: 'Radio Zitouna (Tunesien)', message: String(zitouna.reason?.message || zitouna.reason) });

  const worldwideList =
    worldwide.status === 'fulfilled' && Array.isArray(worldwide.value) ? worldwide.value.map(fromRadioBrowser) : [];
  if (worldwide.status === 'rejected') errors.push({ source: 'Radio-Browser (weltweit)', message: String(worldwide.reason?.message || worldwide.reason) });

  const mp3List =
    mp3.status === 'fulfilled' && Array.isArray(mp3.value?.radios) ? mp3.value.radios.map(fromMp3Quran) : [];
  if (mp3.status === 'rejected') errors.push({ source: 'MP3Quran (Rezitatoren)', message: String(mp3.reason?.message || mp3.reason) });

  // Reihenfolge: Zitouna-Boost zuerst (gewinnt bei Duplikaten), dann weltweit, dann Rezitatoren
  const seenUrls = new Set();
  const seenNames = new Set();
  const stations = [];

  const add = (list, bucket) => {
    for (const st of list) {
      if (!isHttps(st.url)) continue; // nur HTTPS – verhindert Mixed-Content-Blockaden
      const urlKey = st.url.toLowerCase().replace(/\/+$/, '').replace(/[?#].*$/, '');
      const nameKey = `${st.country}::${dedupeKey(st.name)}`;
      if (seenUrls.has(urlKey) || seenNames.has(nameKey)) continue;
      seenUrls.add(urlKey);
      seenNames.add(nameKey);
      stations.push(st);
      counts[bucket] += 1;
    }
  };

  add(zitounaList, 'zitouna');
  add(worldwideList, 'worldwide');
  add(mp3List, 'mp3quran');

  return { stations, errors, counts };
}

// Fire-and-Forget: Klick-Statistik der offenen Radio-Browser-Datenbank unterstützen
export function reportClick(station) {
  if (station?.source !== 'radio-browser' || !station.uuid) return;
  try {
    fetch(`${RB_PRIMARY}/json/url/${encodeURIComponent(station.uuid)}`, { keepalive: true }).catch(() => {});
  } catch {
    /* bewusst ignoriert */
  }
}
