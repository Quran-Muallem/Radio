import { resolveCountry, isArabCountry, RECITERS_CATEGORY } from './countries.js';
import { fold } from './search.js';

// Öffentliche, kostenlose APIs – kein API-Key nötig.
const RB_PRIMARY = 'https://de1.api.radio-browser.info';
// Ausweich-Server derselben offenen Datenbank, falls de1 kurzzeitig nicht antwortet
const RB_MIRRORS = [RB_PRIMARY, 'https://de2.api.radio-browser.info', 'https://fi1.api.radio-browser.info'];
const MP3QURAN = 'https://www.mp3quran.net/api/v3/radios';

// Länder, deren komplette Senderliste geladen und nach religiösen Sendern gefiltert wird.
// Alle übrigen Länder (auch arabische) kommen über die globalen Tag-/Namenssuchen dazu.
export const COUNTRY_SWEEP = ['SA', 'EG', 'TN', 'MA', 'DZ', 'AE', 'KW', 'QA', 'JO', 'PS'];

const RB_SEARCHES = [
  { label: 'Tag „quran“', path: '/json/stations/search?tag=quran&hidebroken=true&limit=1000&order=votes&reverse=true' },
  { label: 'Tag „islam“', path: '/json/stations/search?tag=islam&hidebroken=true&limit=500&order=votes&reverse=true' },
  { label: 'Name „قرآن“', path: `/json/stations/byname/${encodeURIComponent('قرآن')}?hidebroken=true` },
  { label: 'Name „Quran“', path: '/json/stations/byname/Quran?hidebroken=true' },
];

// Erkennt Quran-/Islam-Sender in allgemeinen Länderlisten (Name + Tags, Lateinisch und Arabisch).
// Bewusst ohne das allgemeine Wort „إذاعة“ (= „Radiosender“) und ohne „Rotana“/„Medina“ allein –
// die würden auch Musik- und Nachrichtensender erfassen.
const RELIGIOUS = new RegExp(
  [
    'quran', "qur['’]?an", 'koran', 'coran', '\\bislam', 'zitouna', 'zaitouna', 'zaytuna',
    'makkah', 'mecca', 'mekka', 'madinah', '\\bmadina\\b', 'tarawi', 'taraweeh', 'ruqy', 'roqya',
    'sunnah', '\\bsunna\\b', 'hadith', 'tafsir', 'tafseer', 'tajweed', 'tilawa', 'tarteel', 'adhan', 'azan',
    'rotana\\W*quran',
    'قرآن', 'القرآن', 'القران', 'قران', 'إسلام', 'اسلام', 'الإسلامية', 'الاسلامية', 'الزيتونة',
    'مكة', 'المدينة المنورة', 'تراويح', 'رقية', 'السنة', 'تفسير', 'تلاوة', 'ترتيل', 'تجويد', 'حديث', 'أذكار', 'الأذان',
  ].join('|'),
  'i'
);

const TIMEOUT_MS = 15000;

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
      const data = await fetchJson(base + path);
      if (!Array.isArray(data)) throw new Error('Unerwartetes Format');
      return data;
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
    .replace(/^[\s\-–|:.]+|[\s\-–|:]+$/g, '')
    .trim();
}

// Normalisierte Stream-URL für die Duplikat-Erkennung:
// ohne Schema, ohne Query/Hash, ohne abschließenden Slash; bekannte Spiegel-Hosts zusammengeführt
export function normalizeStreamUrl(url) {
  return (url || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .replace(/^(www\.|backup\.)(qurango\.net)/, '$2');
}

function searchText(st) {
  return fold([st.name, st.nameAlt, st.country, st.countrycode, st.tags.join(' '), st.language].join(' '));
}

function fromRadioBrowser(s) {
  const url = (s.url_resolved && s.url_resolved.trim()) || (s.url && s.url.trim()) || '';
  const { code, name: country } = resolveCountry(s.country, s.countrycode);
  const st = {
    id: `rb-${s.stationuuid}`,
    source: 'radio-browser',
    uuid: s.stationuuid,
    name: cleanName(s.name) || 'Unbenannter Sender',
    nameAlt: '',
    url,
    favicon: isHttps(s.favicon) ? s.favicon : '',
    homepage: isHttps(s.homepage) ? s.homepage : '',
    country,
    countrycode: code,
    region: isArabCountry(code) ? 'arab' : 'world',
    tags: (s.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6),
    codec: s.codec || '',
    bitrate: Number(s.bitrate) || 0,
    hls: s.hls === 1 || /\.m3u8?(\?|$)/i.test(url),
    votes: Number(s.votes) || 0,
    language: s.language || '',
  };
  st.search = searchText(st);
  return st;
}

// MP3Quran: arabischer Originalname als Titel, englischer Name als Untertitel
function fromMp3Quran(ar, en) {
  const url = ((ar && ar.url) || (en && en.url) || '').trim();
  const arName = cleanName(ar?.name);
  const enName = cleanName(en?.name).replace(/^Radio\s+/i, '');
  const st = {
    id: `mq-${(ar || en).id}`,
    source: 'mp3quran',
    uuid: null,
    name: arName || enName || 'Rezitation',
    nameAlt: arName && enName && arName !== enName ? enName : '',
    url,
    favicon: '',
    homepage: 'https://mp3quran.net',
    country: RECITERS_CATEGORY,
    countrycode: '',
    region: 'reciters',
    tags: ['24/7'],
    codec: 'MP3',
    bitrate: 0,
    hls: /\.m3u8?(\?|$)/i.test(url),
    votes: 0,
    language: 'ar',
  };
  st.search = searchText(st);
  return st;
}

/**
 * Lädt alle Quellen parallel (Promise.allSettled) – ein Ausfall blockiert die anderen nicht.
 * Rückgabe: { stations, errors: [{source, message}], stats }
 */
export async function loadAllStations() {
  const jobs = [
    { label: 'MP3Quran (arabisch)', kind: 'mq', run: () => fetchJson(`${MP3QURAN}?language=ar`) },
    { label: 'MP3Quran (englisch)', kind: 'mq', run: () => fetchJson(`${MP3QURAN}?language=eng`) },
    // Länderlisten zuerst: so behalten z. B. Radio Zitouna oder Makkah ihr Land bei Duplikaten
    ...COUNTRY_SWEEP.map((cc) => ({
      label: `Länderliste ${cc}`,
      kind: 'country',
      run: () => fetchRadioBrowser(`/json/stations/bycountrycodeexact/${cc}?hidebroken=true`),
    })),
    ...RB_SEARCHES.map((s) => ({ label: s.label, kind: 'search', run: () => fetchRadioBrowser(s.path) })),
  ];

  const results = await Promise.allSettled(jobs.map((j) => j.run()));

  const errors = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') errors.push({ source: jobs[i].label, message: String(r.reason?.message || r.reason) });
  });

  // MP3Quran: arabische und englische Liste über die ID zusammenführen
  const [mqAr, mqEn] = results.slice(0, 2).map((r) => (r.status === 'fulfilled' && Array.isArray(r.value?.radios) ? r.value.radios : []));
  const enById = new Map(mqEn.map((r) => [r.id, r]));
  const arIds = new Set(mqAr.map((r) => r.id));
  const mp3Stations = [
    ...mqAr.map((r) => fromMp3Quran(r, enById.get(r.id))),
    ...mqEn.filter((r) => !arIds.has(r.id)).map((r) => fromMp3Quran(null, r)),
  ];

  const rbStations = [];
  results.slice(2).forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const job = jobs[i + 2];
    for (const raw of r.value) {
      if (job.kind === 'country' && !RELIGIOUS.test(`${raw.name || ''} ${raw.tags || ''}`)) continue;
      rbStations.push(fromRadioBrowser(raw));
    }
  });

  // Nur HTTPS, Duplikate über die normalisierte Stream-URL entfernen.
  // Reihenfolge: MP3Quran zuerst (Spiegel derselben Rezitatoren-Streams landen so in der Rezitatoren-Kategorie),
  // dann Länderlisten, dann globale Suchen.
  const seen = new Set();
  const stations = [];
  for (const st of [...mp3Stations, ...rbStations]) {
    if (!isHttps(st.url)) continue;
    const key = normalizeStreamUrl(st.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    stations.push(st);
  }

  // Reihenfolge für „Alle Sender“: arabische Länder (nach Beliebtheit), Rezitatoren, dann weltweit
  const byVotes = (a, b) => b.votes - a.votes;
  const ordered = [
    ...stations.filter((s) => s.region === 'arab').sort(byVotes),
    ...stations.filter((s) => s.region === 'reciters'),
    ...stations.filter((s) => s.region === 'world').sort(byVotes),
  ];

  return { stations: ordered, errors };
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
