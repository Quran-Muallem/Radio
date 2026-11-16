// Suche, die Arabisch und Lateinisch gleichermaßen versteht.
//  - Arabisch: Vokalzeichen/Tatweel entfernen, Alef-, Ta-marbuta-, Ya-Varianten vereinheitlichen
//    (so findet „القران“ auch „القرآن“)
//  - Lateinisch: Groß/Klein, Akzente, ß
//  - Schreibvarianten-Gruppen: „Afasy“ findet „Alafasi“ und „العفاسي“, „Makkah“ findet „مكة“ usw.

export function fold(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // lateinische Akzente
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // arabische Vokalzeichen
    .replace(/ـ/g, '') // Tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ß/g, 'ss')
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Jede Gruppe: verschiedene Schreibweisen desselben Begriffs (Lateinisch + Arabisch)
const ALIAS_GROUPS = [
  ['quran', 'koran', 'coran', 'quraan', 'kuran', 'قران', 'القران'],
  ['makkah', 'makka', 'mecca', 'mekka', 'mekkah', 'مكه', 'مكه المكرمه'],
  ['madinah', 'madina', 'medina', 'medinah', 'المدينه', 'المدينه المنوره'],
  ['zitouna', 'zaitouna', 'zaytuna', 'zeitouna', 'zaytouna', 'الزيتونه', 'زيتونه'],
  ['afasy', 'afasi', 'alafasy', 'alafasi', 'el afasy', 'العفاسي', 'عفاسي', 'مشاري'],
  ['sudais', 'sudaes', 'alsudais', 'alsudaes', 'السديس'],
  ['shuraim', 'shuraym', 'alshuraim', 'الشريم'],
  ['minshawi', 'menshawi', 'minshawy', 'alminshawi', 'المنشاوي'],
  ['husary', 'hussary', 'husari', 'hussari', 'alhussary', 'الحصري'],
  ['abdulbasit', 'abdul basit', 'abdelbasset', 'abdulbaset', 'عبدالباسط', 'عبد الباسط'],
  ['ghamdi', 'ghamidi', 'alghamdi', 'الغامدي'],
  ['muaiqly', 'muaiqli', 'maher', 'المعيقلي', 'ماهر'],
  ['ajmy', 'ajmi', 'alajmy', 'alajmi', 'العجمي'],
  ['dosari', 'dossari', 'aldosari', 'الدوسري'],
  ['shatri', 'shatry', 'الشاطري'],
  ['tunesien', 'tunisia', 'tunis', 'tunisie', 'تونس'],
  ['agypten', 'aegypten', 'egypt', 'misr', 'kairo', 'cairo', 'مصر', 'القاهره'],
  ['saudi', 'saudi arabien', 'السعوديه'],
  ['marokko', 'morocco', 'maroc', 'المغرب'],
  ['algerien', 'algeria', 'algerie', 'الجزاير', 'الجزائر'],
  ['ruqyah', 'ruqya', 'roqya', 'رقيه'],
  ['tafsir', 'tafseer', 'تفسير'],
  ['hadith', 'hadis', 'حديث'],
  ['tarawih', 'taraweeh', 'تراويح'],
  ['adhkar', 'azkar', 'athkar', 'اذكار'],
].map((g) => g.map(fold));

// Für einen Suchbegriff alle gleichwertigen Schreibweisen ermitteln
function variantsOf(term) {
  const out = new Set([term]);
  if (term.length < 3) return out;
  for (const group of ALIAS_GROUPS) {
    if (group.some((a) => a.startsWith(term) || (term.length >= 4 && term.startsWith(a)))) {
      group.forEach((a) => out.add(a));
    }
  }
  return out;
}

/** Wandelt die Eingabe in Suchbegriffe um; jeder Begriff muss (in einer seiner Varianten) vorkommen. */
export function buildQuery(input) {
  return fold(input)
    .split(' ')
    .filter(Boolean)
    .map((t) => [...variantsOf(t)]);
}

export function matchesQuery(haystack, query) {
  return query.every((variants) => variants.some((v) => haystack.includes(v)));
}
