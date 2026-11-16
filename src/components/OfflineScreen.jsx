import { RefreshIcon, Spinner } from './Icons.jsx';

const WifiOffIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.6 5.2A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 3.4-2.1M16.6 10.6a10 10 0 0 1 2.4 1.9M8.5 16.1a5 5 0 0 1 7 0" />
    <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    <path d="m3 3 18 18" />
  </svg>
);

/**
 * Vollflächige Fehlerseite, wenn noch keine Senderliste vorhanden ist:
 * - ohne Internet: Hinweis + automatischer Neuversuch, sobald die Verbindung zurück ist
 * - mit Internet, aber Quellen nicht erreichbar: Hinweis + Neuversuch
 */
export default function OfflineScreen({ online, retrying, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center" role="alert">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gold/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-night-2 text-gold ring-1 ring-gold/25">
          <WifiOffIcon className="h-10 w-10" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white">
        {online ? 'Senderliste nicht erreichbar' : 'Keine Internetverbindung'}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-400">
        {online
          ? 'Die Senderverzeichnisse antworten gerade nicht. Das liegt meist am Server und ist in wenigen Minuten wieder in Ordnung.'
          : 'Die Live-Streams kommen direkt von den Sendern und brauchen eine Internetverbindung. Prüfe WLAN oder mobile Daten.'}
      </p>
      {!online && (
        <p className="mt-3 text-sm text-emerald/90">Die App lädt automatisch neu, sobald du wieder online bist.</p>
      )}

      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-[15px] font-semibold text-night shadow-lg shadow-emerald/20 transition hover:brightness-110 active:scale-95 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {retrying ? <Spinner className="h-5 w-5" /> : <RefreshIcon className="h-5 w-5" />}
        Erneut versuchen
      </button>
    </div>
  );
}
