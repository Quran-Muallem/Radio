import { SearchIcon, CloseIcon, ChevronIcon } from './Icons.jsx';
import { flagEmoji, RECITERS_CATEGORY } from '../lib/countries.js';

export const TABS = [
  { id: 'all', label: 'Alle Sender' },
  { id: 'favorites', label: 'Meine Favoriten' },
  { id: 'reciters', label: '24/7 Rezitatoren' },
  { id: 'countries', label: 'Länder-Radios' },
];

export default function FilterBar({
  query, onQuery,
  tab, onTab, tabCounts,
  country, onCountry, countries, countrySort, onCountrySort,
}) {
  return (
    <div className="sticky sticky-below-status z-20 border-b border-white/5 bg-night/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {/* Echtzeit-Suche */}
          <label className="relative flex-1">
            <span className="sr-only">Sender, Rezitator oder Land suchen</span>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Sender, Rezitator oder Land suchen …"
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

          {/* Länder-Dropdown + Sortierung */}
          <div className="flex gap-2">
            <label className="relative flex-1 sm:w-64 sm:flex-none">
              <span className="sr-only">Land auswählen</span>
              <select
                value={country}
                onChange={(e) => onCountry(e.target.value)}
                className="h-12 w-full appearance-none truncate rounded-xl bg-night-2 pl-3.5 pr-9 text-[15px] text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-emerald/60"
              >
                <option value="">🌍 Alle Länder</option>
                {countries.map((c) => (
                  <option key={c.name} value={c.name}>
                    {(c.name === RECITERS_CATEGORY ? '🎧' : flagEmoji(c.code) || '📻')} {c.name} ({c.count})
                  </option>
                ))}
              </select>
              <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
            <button
              type="button"
              onClick={() => onCountrySort(countrySort === 'count' ? 'alpha' : 'count')}
              className="h-12 shrink-0 rounded-xl bg-night-2 px-3 text-xs font-medium text-slate-300 ring-1 ring-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald"
              title="Sortierung der Länderliste umschalten"
              aria-label={`Länder sortiert nach ${countrySort === 'count' ? 'Anzahl' : 'Alphabet'} – umschalten`}
            >
              {countrySort === 'count' ? '# Anzahl' : 'A–Z'}
            </button>
          </div>
        </div>

        {/* Schnellfilter-Tabs */}
        <div role="tablist" aria-label="Schnellfilter" className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
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
      </div>
    </div>
  );
}
