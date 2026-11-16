// Einheitliche deutsche Ländernamen + Flaggen-Emojis für Filter, Länder-Leiste und Karten.

export const RECITERS_CATEGORY = '24/7 Rezitatoren (MP3Quran)';

// Die 22 Mitgliedsstaaten der Arabischen Liga – werden in der Länder-Leiste zuerst gezeigt
export const ARAB_COUNTRY_CODES = [
  'SA', 'EG', 'TN', 'MA', 'DZ', 'AE', 'KW', 'QA', 'JO', 'PS', 'LB',
  'SY', 'IQ', 'YE', 'OM', 'BH', 'LY', 'SD', 'MR', 'SO', 'DJ', 'KM',
];
const ARAB_SET = new Set(ARAB_COUNTRY_CODES);

export const isArabCountry = (code) => ARAB_SET.has((code || '').toUpperCase());

// Feste deutsche Namen (Vorrang vor Intl, damit sie überall identisch und kurz genug sind)
const GERMAN_NAMES = {
  SA: 'Saudi-Arabien', EG: 'Ägypten', TN: 'Tunesien', MA: 'Marokko', DZ: 'Algerien',
  AE: 'Vereinigte Arabische Emirate', KW: 'Kuwait', QA: 'Katar', JO: 'Jordanien', PS: 'Palästina',
  LB: 'Libanon', SY: 'Syrien', IQ: 'Irak', YE: 'Jemen', OM: 'Oman', BH: 'Bahrain', LY: 'Libyen',
  SD: 'Sudan', MR: 'Mauretanien', SO: 'Somalia', DJ: 'Dschibuti', KM: 'Komoren',
  DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz', TR: 'Türkei', ID: 'Indonesien', MY: 'Malaysia',
  GB: 'Großbritannien', FR: 'Frankreich', US: 'USA', NL: 'Niederlande', BE: 'Belgien',
  PK: 'Pakistan', IN: 'Indien', BD: 'Bangladesch', IR: 'Iran', AF: 'Afghanistan', AL: 'Albanien',
  BA: 'Bosnien und Herzegowina', XK: 'Kosovo', ZA: 'Südafrika', NG: 'Nigeria', SN: 'Senegal',
  CI: 'Elfenbeinküste', ML: 'Mali', MW: 'Malawi', UZ: 'Usbekistan', KZ: 'Kasachstan', AZ: 'Aserbaidschan',
  CA: 'Kanada', AU: 'Australien', SE: 'Schweden', NO: 'Norwegen', DK: 'Dänemark', IT: 'Italien',
  ES: 'Spanien', RU: 'Russland', CN: 'China', SG: 'Singapur', PH: 'Philippinen', TH: 'Thailand',
};

// Englische Namen ohne (gültigen) Ländercode – Fallback
const NAME_MAP = {
  'tunisia': 'TN', 'saudi arabia': 'SA', 'egypt': 'EG', 'germany': 'DE', 'palestine': 'PS',
  'state of palestine': 'PS', 'morocco': 'MA', 'algeria': 'DZ', 'turkey': 'TR', 'türkiye': 'TR',
  'united arab emirates': 'AE', 'the united arab emirates': 'AE', 'kuwait': 'KW', 'qatar': 'QA',
  'jordan': 'JO', 'lebanon': 'LB', 'syria': 'SY', 'syrian arab republic': 'SY', 'iraq': 'IQ',
  'yemen': 'YE', 'oman': 'OM', 'bahrain': 'BH', 'libya': 'LY', 'sudan': 'SD', 'mauritania': 'MR',
  'somalia': 'SO', 'djibouti': 'DJ', 'comoros': 'KM',
};

let displayNames = null;
try {
  displayNames = new Intl.DisplayNames(['de'], { type: 'region' });
} catch {
  displayNames = null;
}

/** Liefert { code, name } – Code in Großbuchstaben, Name auf Deutsch. */
export function resolveCountry(country, countrycode) {
  let code = (countrycode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) code = NAME_MAP[(country || '').trim().toLowerCase()] || '';

  if (code && GERMAN_NAMES[code]) return { code, name: GERMAN_NAMES[code] };
  if (code && displayNames) {
    try {
      const de = displayNames.of(code);
      if (de && de !== code) return { code, name: de };
    } catch {
      /* ungültiger Code */
    }
  }
  const raw = (country || '').trim();
  return { code, name: raw || 'Unbekannt' };
}

// Flaggen-Emoji aus ISO-Code (ohne externe Bilder)
export function flagEmoji(countrycode) {
  const code = (countrycode || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// Anzeige-Symbol für ein Land / die Rezitatoren-Kategorie
export function countryIcon(name, code) {
  if (name === RECITERS_CATEGORY) return '🎧';
  return flagEmoji(code) || '📻';
}
