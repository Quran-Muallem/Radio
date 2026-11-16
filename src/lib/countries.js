// Einheitliche, deutsche Ländernamen für den Filter.
// Radio-Browser liefert teils offizielle Langformen („The United States Of America",
// „State Of Palestine", „Türkiye") – darum zuerst über den ISO-Code normalisieren.

export const RECITERS_CATEGORY = '24/7 Rezitatoren';

// Ausdrücklich gewünschte Zuordnungen (englischer Name -> Deutsch)
const NAME_MAP = {
  'tunisia': 'Tunesien',
  'saudi arabia': 'Saudi-Arabien',
  'egypt': 'Ägypten',
  'germany': 'Deutschland',
  'palestine': 'Palästina',
  'state of palestine': 'Palästina',
  'palestinian territory': 'Palästina',
  'morocco': 'Marokko',
  'algeria': 'Algerien',
  'turkey': 'Türkei',
  'türkiye': 'Türkei',
  'turkiye': 'Türkei',
  'united arab emirates': 'VAE',
  'the united arab emirates': 'VAE',
  'kuwait': 'Kuwait',
  'jordan': 'Jordanien',
  'lebanon': 'Libanon',
  'libya': 'Libyen',
  'iraq': 'Irak',
  'syria': 'Syrien',
  'syrian arab republic': 'Syrien',
  'yemen': 'Jemen',
  'oman': 'Oman',
  'qatar': 'Katar',
  'bahrain': 'Bahrain',
  'sudan': 'Sudan',
  'indonesia': 'Indonesien',
  'malaysia': 'Malaysia',
  'pakistan': 'Pakistan',
  'india': 'Indien',
  'bangladesh': 'Bangladesch',
  'iran': 'Iran',
  'islamic republic of iran': 'Iran',
  'the united states of america': 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  'the united kingdom of great britain and northern ireland': 'Großbritannien',
  'united kingdom': 'Großbritannien',
  'france': 'Frankreich',
  'netherlands': 'Niederlande',
  'the netherlands': 'Niederlande',
  'australia': 'Australien',
  'canada': 'Kanada',
};

// Kurzformen, die Intl.DisplayNames anders (länger) ausgeben würde
const CODE_OVERRIDES = {
  AE: 'VAE',
  US: 'USA',
  GB: 'Großbritannien',
  PS: 'Palästina',
  TR: 'Türkei',
  SA: 'Saudi-Arabien',
};

let displayNames = null;
try {
  displayNames = new Intl.DisplayNames(['de'], { type: 'region' });
} catch {
  displayNames = null;
}

export function normalizeCountry(country, countrycode) {
  const code = (countrycode || '').trim().toUpperCase();
  if (code && CODE_OVERRIDES[code]) return CODE_OVERRIDES[code];

  const key = (country || '').trim().toLowerCase();
  if (key && NAME_MAP[key]) return NAME_MAP[key];

  if (code.length === 2 && displayNames) {
    try {
      const de = displayNames.of(code);
      if (de && de !== code) return de;
    } catch {
      /* ungültiger Code – weiter unten Fallback */
    }
  }
  if (country && country.trim()) return country.trim();
  return 'Unbekannt';
}

// Flaggen-Emoji aus ISO-Code (ohne externe Bilder)
export function flagEmoji(countrycode) {
  const code = (countrycode || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
