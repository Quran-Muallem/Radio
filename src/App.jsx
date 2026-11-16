import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import StationCard from './components/StationCard.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import Footer from './components/Footer.jsx';
import OfflineScreen from './components/OfflineScreen.jsx';
import { AlertIcon, RefreshIcon, HeartIcon, RadioIcon } from './components/Icons.jsx';
import { loadAllStations } from './lib/api.js';
import { buildQuery, matchesQuery } from './lib/search.js';
import { RECITERS_CATEGORY } from './lib/countries.js';
import { readJSON, writeJSON, KEYS } from './lib/storage.js';
import { useAudioPlayer } from './hooks/useAudioPlayer.js';
import { useOnlineStatus } from './hooks/useOnlineStatus.js';
import { isNative } from './lib/platform.js';

const PAGE_SIZE = 60;

// Letzte gute Senderliste lesen (für den Offline-Fall)
function readCache() {
  const c = readJSON(KEYS.stationsCache, null);
  // Nur Einträge im aktuellen Datenformat verwenden (mit Region und Suchtext)
  return c && Array.isArray(c.stations) && c.stations.length && c.stations[0].region && c.stations[0].search ? c : null;
}

function formatCacheAge(ts) {
  if (!ts) return '';
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
  } catch {
    return '';
  }
} // schrittweises Rendern hält auch schwache Smartphones flüssig

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-night-2/80 p-3 ring-1 ring-white/[0.06]">
          <div className="h-12 w-12 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-3 w-1/4 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab, hasQuery, onReset }) {
  const fav = tab === 'favorites' && !hasQuery;
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-400 ring-1 ring-white/10">
        {fav ? <HeartIcon className="h-6 w-6" /> : <RadioIcon className="h-6 w-6" />}
      </div>
      <p className="font-medium text-slate-200">{fav ? 'Noch keine Favoriten' : 'Keine Sender gefunden'}</p>
      <p className="mt-1 text-sm text-slate-400">
        {fav
          ? 'Tippe auf das Herz-Symbol eines Senders, um ihn hier zu speichern.'
          : 'Passe die Suche oder den Länderfilter an.'}
      </p>
      {!fav && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald"
        >
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceErrors, setSourceErrors] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [cachedAt, setCachedAt] = useState(0); // >0: Liste stammt aus dem Offline-Speicher
  const online = useOnlineStatus();

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [tab, setTab] = useState('all');
  const [country, setCountry] = useState('');
  const [countrySort, setCountrySort] = useState(() => (readJSON(KEYS.sort, 'count') === 'alpha' ? 'alpha' : 'count'));
  const [favorites, setFavorites] = useState(() => {
    const f = readJSON(KEYS.favorites, []);
    return new Set(Array.isArray(f) ? f : []);
  });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const player = useAudioPlayer();

  // Alle Quellen parallel laden (Promise.allSettled in loadAllStations)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAllStations()
      .then(({ stations: list, errors }) => {
        if (cancelled) return;
        const cache = errors.length > 0 ? readCache() : null;
        if (list.length > 0 && cache) {
          // Teilweise geladen (z. B. eine Quelle offline): fehlende Sender aus der gespeicherten Liste ergänzen
          // Reihenfolge der gespeicherten Liste beibehalten, frische Einträge bevorzugen
          const fresh = new Map(list.map((s) => [s.id, s]));
          const known = new Set(cache.stations.map((s) => s.id));
          const merged = [...cache.stations.map((s) => fresh.get(s.id) || s), ...list.filter((s) => !known.has(s.id))];
          setStations(merged);
          setCachedAt(merged.length > list.length ? cache.t : 0);
        } else if (list.length > 0) {
          setStations(list);
          setCachedAt(0);
          // Vollständige Listen speichern; beim allerersten Start auch eine fast vollständige
          if (errors.length === 0 || (!readCache() && list.length > 50)) {
            writeJSON(KEYS.stationsCache, { t: Date.now(), stations: list });
          }
        } else {
          // Nichts geladen (offline oder alle Quellen down) → gespeicherte Liste anzeigen
          setStations(cache ? cache.stations : []);
          setCachedAt(cache ? cache.t : 0);
        }
        setSourceErrors(errors);
      })
      .catch(() => {
        if (cancelled) return;
        const cache = readCache();
        setStations(cache ? cache.stations : []);
        setCachedAt(cache ? cache.t : 0);
        setSourceErrors([{ source: 'Alle Quellen', message: 'Netzwerkfehler' }]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => writeJSON(KEYS.favorites, [...favorites]), [favorites]);
  useEffect(() => writeJSON(KEYS.sort, countrySort), [countrySort]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Länderliste mit Anzahl, ISO-Code (Flagge) und Region.
  // Reihenfolge: arabische Länder zuerst, danach weltweit – jeweils nach Senderanzahl (oder A–Z).
  const countries = useMemo(() => {
    const map = new Map();
    for (const s of stations) {
      if (s.region === 'reciters') continue; // eigene Kategorie mit eigenem Tab
      const entry = map.get(s.country) || { name: s.country, code: s.countrycode, region: s.region, count: 0 };
      entry.count += 1;
      if (!entry.code && s.countrycode) entry.code = s.countrycode;
      map.set(s.country, entry);
    }
    const byOrder = (a, b) =>
      countrySort === 'alpha' ? a.name.localeCompare(b.name, 'de') : b.count - a.count || a.name.localeCompare(b.name, 'de');
    const list = [...map.values()];
    return [...list.filter((c) => c.region === 'arab').sort(byOrder), ...list.filter((c) => c.region !== 'arab').sort(byOrder)];
  }, [stations, countrySort]);

  // Einzelne ausgefallene Länderlisten sind kaum spürbar – Hinweis nur bei größeren Ausfällen
  const significantErrors =
    sourceErrors.length >= 3 || sourceErrors.some((e) => e.source.startsWith('MP3Quran') || e.source === 'Alle Quellen');

  const reciterCount = useMemo(() => stations.filter((s) => s.region === 'reciters').length, [stations]);

  const realCountryCount = useMemo(() => countries.filter((c) => c.name !== 'Unbekannt').length, [countries]);
  const arabCountryCount = useMemo(() => countries.filter((c) => c.region === 'arab').length, [countries]);

  const tabCounts = useMemo(() => {
    const counts = { all: stations.length, arab: 0, reciters: 0, world: 0, favorites: 0 };
    for (const s of stations) {
      counts[s.region] += 1;
      if (favorites.has(s.id)) counts.favorites += 1;
    }
    return counts;
  }, [stations, favorites]);

  const filtered = useMemo(() => {
    const q = buildQuery(deferredQuery);
    return stations.filter((s) => {
      if (tab === 'favorites' && !favorites.has(s.id)) return false;
      if ((tab === 'arab' || tab === 'reciters' || tab === 'world') && s.region !== tab) return false;
      if (country && s.country !== country) return false;
      if (q.length && !matchesQuery(s.search || '', q)) return false;
      return true;
    });
  }, [stations, tab, country, deferredQuery, favorites]);

  // Bei Filterwechsel wieder oben mit der ersten Seite beginnen
  useEffect(() => setVisible(PAGE_SIZE), [tab, country, deferredQuery]);

  // Region des gewählten Landes (für widerspruchsfreie Tab-/Länder-Kombinationen)
  const regionOf = useCallback((name) => (name === RECITERS_CATEGORY ? 'reciters' : countries.find((c) => c.name === name)?.region), [countries]);

  const handleTab = useCallback((t) => {
    setTab(t);
    setCountry((c) => {
      if (!c) return c;
      if ((t === 'arab' || t === 'world' || t === 'reciters') && regionOf(c) !== t) return '';
      return c;
    });
  }, [regionOf]);

  const handleCountry = useCallback((c) => {
    setCountry(c);
    if (!c) return;
    if (c === RECITERS_CATEGORY) {
      setCountry('');
      setTab('reciters');
      return;
    }
    setTab((t) => ((t === 'arab' || t === 'world' || t === 'reciters') && regionOf(c) !== t ? 'all' : t));
  }, [regionOf]);

  const resetFilters = useCallback(() => {
    setQuery('');
    setCountry('');
    setTab('all');
  }, []);

  const { station: current, status, play, toggle } = player;

  // Wieder online: fehlende/alte Senderliste neu laden und abgebrochenen Stream fortsetzen
  const wasOnline = useRef(online);
  useEffect(() => {
    const cameBack = online && !wasOnline.current;
    wasOnline.current = online;
    if (!cameBack) return;
    if (stations.length === 0 || cachedAt > 0 || sourceErrors.length > 0) setReloadKey((k) => k + 1);
    if (current && status === 'error') play(current, { reconnect: true });
  }, [online, stations.length, cachedAt, sourceErrors.length, current, status, play]);

  // Android-Zurück-Taste: erst Filter zurücksetzen, dann App in den Hintergrund
  // (nicht beenden – so läuft das Radio weiter, wie man es von Musik-Apps kennt)
  const backStateRef = useRef({});
  backStateRef.current = { query, country, tab };
  useEffect(() => {
    if (!isNative) return undefined;
    let handle = null;
    let disposed = false;
    CapApp.addListener('backButton', () => {
      const st = backStateRef.current;
      if (st.query || st.country || st.tab !== 'all') {
        setQuery('');
        setCountry('');
        setTab('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        CapApp.minimizeApp().catch(() => {});
      }
    }).then((h) => {
      if (disposed) h.remove();
      else handle = h;
    });
    return () => {
      disposed = true;
      if (handle) handle.remove();
    };
  }, []);
  const handlePlay = useCallback(
    (st) => {
      if (current && current.id === st.id) toggle();
      else play(st);
    },
    [current, play, toggle]
  );

  const shown = filtered.slice(0, visible);

  return (
    <div className={`min-h-screen ${current ? 'pb-40 md:pb-28' : ''}`}>
      {/* Hintergrund hinter der Statusleiste (Android Edge-to-Edge / iOS-PWA) */}
      <div className="status-scrim" aria-hidden="true" />
      <Header stationCount={stations.length} countryCount={realCountryCount} arabCount={arabCountryCount} loading={loading && stations.length === 0} />

      <FilterBar
        query={query}
        onQuery={setQuery}
        tab={tab}
        onTab={handleTab}
        tabCounts={tabCounts}
        country={country}
        onCountry={handleCountry}
        countries={countries}
        reciterCount={reciterCount}
        countrySort={countrySort}
        onCountrySort={setCountrySort}
      />

      <main className="mx-auto max-w-6xl px-4 py-5">
        {!online && stations.length > 0 && (
          <div role="status" className="mb-4 flex items-start gap-3 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-300 ring-1 ring-white/10">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
            <p>
              <strong className="font-medium text-white">Offline.</strong> Die Live-Streams brauchen Internet – die App
              verbindet sich automatisch neu, sobald du wieder online bist.
              {cachedAt > 0 && ` Angezeigt wird die gespeicherte Senderliste vom ${formatCacheAge(cachedAt)}.`}
            </p>
          </div>
        )}

        {online && significantErrors && !loading && stations.length > 0 && (
          <div role="status" className="mb-4 flex items-start gap-3 rounded-xl bg-gold/[0.07] px-4 py-3 text-sm text-amber-100/90 ring-1 ring-gold/20">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div className="flex-1">
              <p>
                {cachedAt > 0 ? 'Die Senderverzeichnisse antworten gerade nicht – angezeigt wird die gespeicherte Liste. ' : 'Einige Quellen sind gerade nicht erreichbar: '}
                {cachedAt === 0 && <span className="text-amber-100">{sourceErrors.map((e) => e.source).join(', ')}.</span>}
                {cachedAt === 0 && ' Alle übrigen Sender funktionieren normal.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold"
            >
              <RefreshIcon className="h-3.5 w-3.5" /> Erneut laden
            </button>
          </div>
        )}

        {loading && stations.length === 0 ? (
          <SkeletonGrid />
        ) : stations.length === 0 ? (
          <OfflineScreen online={online} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} hasQuery={Boolean(query || country)} onReset={resetFilters} />
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-500" aria-live="polite">
              {filtered.length} Sender
              {country ? ` · ${country}` : ''}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((s) => (
                <StationCard
                  key={s.id}
                  station={s}
                  isCurrent={current?.id === s.id}
                  status={current?.id === s.id ? status : 'idle'}
                  isFavorite={favorites.has(s.id)}
                  onPlay={handlePlay}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
            {filtered.length > visible && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-full bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-white/10 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald"
                >
                  Weitere Sender anzeigen ({filtered.length - visible})
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <PlayerBar player={player} />
    </div>
  );
}
