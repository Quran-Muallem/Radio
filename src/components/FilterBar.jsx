import { useEffect, useRef } from 'react';
import { SearchIcon, CloseIcon, ChevronIcon } from './Icons.jsx';
import { countryIcon, RECITERS_CATEGORY } from '../lib/countries.js';

export const TABS = [
  { id: 'all', label: 'Alle Sender' },
  { id: 'arab', label: 'Arabische Länder' },
  { id: 'reciters', label: '24/7 Rezitatoren' },
  { id: 'world', label: 'Weltweit' },
  { id: 'favorites', label: 'Meine Favoriten' },
];

// Horizontale Länder-Leiste (Pills) mit Flagge, Name und Senderanzahl
function CountryPills({ countries, tab, country, onCountry }) {
  const activeRef = useRef(null);
  const barRef = useRef(null);

  // Gewähltes Land in der Leiste mittig zeigen (z. B. nach Auswahl im Dropdown), sonst an den Anfang.
  // Nur die Leiste selbst scrollen – nicht die ganze Seite.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const pill = activeRef.current;
    const left = pill ? pill.offsetLeft - (bar.clientWidth - pill.offsetWidth) / 2 : 0;
    bar.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [country, tab]);

  const visible = countries.filter((c) => (tab === 'arab' ? c.region === 'arab' : tab === 'world' ? c.region !== 'arab' : true));
  if (tab === 'reciters' || visible.length === 0) return null;

  const firstWorldIndex = visible.findIndex((c) => c.region !== 'arab');

  return (
    <div ref={barRef} className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 scrollbar-none" role="group" aria-label="Länder">
      <Pill active={!country} onClick={() => onCountry('')} label="Alle Länder" icon="🌍" />
      {visible.map((c, i) => (
        <span key={c.name} className="contents">
          {i === firstWorldIndex && firstWorldIndex > 0 && (
            <span className="mx-1 w-px shrink-0 self-stretch bg-white/10" aria-hidden="true" />
          )}
          <Pill
            buttonRef={country === c.name ? activeRef : null}
            active={country === c.name}
            onClick={() => onCountry(country === c.name ? '' : c.name)}
            icon={countryIcon(c.name, c.code)}
            label={c.name}
            count={c.count}
            arab={c.region === 'arab'}
          />
        </span>
      ))}
    </div>
  );
}

// buttonRef statt ref: in React 18 wird „ref“ nicht als normale Prop weitergereicht
function Pill({ active, onClick, icon, label, count, arab, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] transition ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald ${
        active
          ? 'bg-gold/15 text-gold ring-gold/50'
          : arab
            ? 'bg-emerald/[0.06] text-slate-200 ring-emerald/20 hover:bg-emerald/10'
            : 'bg-white/[0.03] text-slate-300 ring-white/10 hover:bg-white/[0.07]'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
      {count != null && <span className={`tabular-nums ${active ? 'text-gold/80' : 'text-slate-500'}`}>({count})</span>}
    </button>
  );
}

export default function FilterBar({
  query, onQuery,
  tab, onTab, tabCounts,
  country, onCountry, countries, reciterCount, countrySort, onCountrySort,
}) {
  const arab = countries.filter((c) => c.region === 'arab');
  const world = countries.filter((c) => c.region !== 'arab');

  return (
    <div className="sticky sticky-below-status z-20 border-b border-white/5 bg-night/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {/* Echtzeit-Suche: Deutsch, Lateinisch und Arabisch */}
          <label className="relative flex-1">
            <span className="sr-only">Sender, Rezitator oder Land suchen (auch auf Arabisch)</span>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              dir="auto"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Suchen … z. B. Zitouna, مكة, Afasy"
              className="h-12 w-full rounded-xl bg-night-2 pl-11 pr-11 text-[15px] text-white placeholder:text-slate-500 ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-emerald/60 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald"
                aria-label="Suche leeren"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </label>

          {/* Länder-Dropdown (gruppiert) + Sortierung */}
          <div className="flex gap-2">
            <label className="relative flex-1 sm:w-72 sm:flex-none">
              <span className="sr-only">Land auswählen</span>
              <select
                value={country}
                onChange={(e) => onCountry(e.target.value)}
                className="h-12 w-full appearance-none truncate rounded-xl bg-night-2 pl-3.5 pr-9 text-[15px] text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-emerald/60"
              >
                <option value="">🌍 Alle Länder</option>
                {arab.length > 0 && (
                  <optgroup label="Arabische Länder">
                    {arab.map((c) => (
                      <option key={c.name} value={c.name}>{countryIcon(c.name, c.code)} {c.name} ({c.count})</option>
                    ))}
                  </optgroup>
                )}
                {reciterCount > 0 && (
                  <optgroup label="Kategorie">
                    <option value={RECITERS_CATEGORY}>🎧 {RECITERS_CATEGORY} ({reciterCount})</option>
                  </optgroup>
                )}
                {world.length > 0 && (
                  <optgroup label="Weltweit">
                    {world.map((c) => (
                      <option key={c.name} value={c.name}>{countryIcon(c.name, c.code)} {c.name} ({c.count})</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
            <button
              type="button"
              onClick={() => onCountrySort(countrySort === 'count' ? 'alpha' : 'count')}
              className="h-12 shrink-0 rounded-xl bg-night-2 px-3 text-xs font-medium text-slate-300 ring-1 ring-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald"
              title="Sortierung der Länder umschalten"
              aria-label={`Länder sortiert nach ${countrySort === 'count' ? 'Anzahl' : 'Alphabet'} – umschalten`}
            >
              {countrySort === 'count' ? '# Anzahl' : 'A–Z'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Kategorien" className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onTab(t.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald ${
                  active
                    ? 'bg-emerald text-night ring-emerald'
                    : 'bg-white/[0.03] text-slate-300 ring-white/10 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                {t.label}
                <span className={`ml-1.5 tabular-nums ${active ? 'text-night/70' : 'text-slate-500'}`}>{tabCounts[t.id]}</span>
              </button>
            );
          })}
        </div>

        {/* Länder-Leiste */}
        <CountryPills countries={countries} tab={tab} country={country} onCountry={onCountry} />
      </div>
    </div>
  );
}
