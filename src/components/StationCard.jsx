import { memo, useState } from 'react';
import { RadioIcon, HeartIcon, Equalizer, Spinner, PlayIcon, PauseIcon } from './Icons.jsx';
import { flagEmoji, RECITERS_CATEGORY } from '../lib/countries.js';

// Favicon mit Fallback-Icon, falls keines vorhanden ist oder das Bild nicht lädt
function StationLogo({ src, name }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald/20 to-gold/10 ring-1 ring-white/10 text-emerald">
        <RadioIcon className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      title={name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      // Leere/winzige Platzhalterbilder (1×1-Pixel) ebenfalls durch das Radio-Icon ersetzen
      onLoad={(e) => { if (e.currentTarget.naturalWidth < 8) setBroken(true); }}
      className="h-12 w-12 shrink-0 rounded-xl bg-white/5 object-contain p-1 ring-1 ring-white/10"
    />
  );
}

function StationCard({ station, isCurrent, status, isFavorite, onPlay, onToggleFavorite }) {
  const playing = isCurrent && status === 'playing';
  const loading = isCurrent && status === 'loading';
  const errored = isCurrent && status === 'error';
  const isReciter = station.country === RECITERS_CATEGORY;
  const flag = isReciter ? '🎧' : flagEmoji(station.countrycode);

  return (
    <article
      className={`group relative flex items-center gap-3 rounded-2xl p-3 transition ring-1 ${
        isCurrent
          ? errored
            ? 'bg-red-500/[0.06] ring-red-400/40'
            : 'bg-emerald/[0.07] ring-2 ring-emerald shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)]'
          : 'bg-night-2/80 ring-white/[0.06] hover:bg-night-3 hover:ring-white/15'
      }`}
    >
      {/* Ganze Karte ist der Play-Button (große Touch-Fläche) */}
      <button
        type="button"
        onClick={() => onPlay(station)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-emerald"
        aria-label={`${isCurrent && (playing || loading) ? 'Pausieren' : 'Abspielen'}: ${station.name}`}
        aria-current={isCurrent ? 'true' : undefined}
      >
        <div className="relative">
          <StationLogo src={station.favicon} name={station.name} />
          <span
            className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-night transition ${
              isCurrent ? 'bg-emerald text-night' : 'bg-night-3 text-slate-300 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          >
            {loading ? <Spinner className="h-3.5 w-3.5" /> : playing ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3 translate-x-[1px]" />}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className={`line-clamp-2 break-words text-[15px] font-medium leading-snug ${isCurrent ? 'text-white' : 'text-slate-100'}`} dir="auto">
              {station.name}
            </h3>
            {playing && <Equalizer className="mt-0.5 shrink-0" />}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-slate-400">
            {flag && <span className="mr-1">{flag}</span>}
            {station.country}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                station.source === 'mp3quran' ? 'bg-gold/10 text-gold' : 'bg-emerald/10 text-emerald'
              }`}
            >
              {station.source === 'mp3quran' ? 'MP3Quran' : 'Radio-Browser'}
            </span>
            {station.hls && <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">HLS</span>}
            {station.bitrate > 0 && (
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">{station.bitrate} kbps</span>
            )}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(station.id)}
        className={`relative z-10 shrink-0 rounded-xl p-2.5 transition focus-visible:outline-2 focus-visible:outline-emerald ${
          isFavorite ? 'text-gold' : 'text-slate-500 hover:text-slate-200'
        }`}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `${station.name} aus Favoriten entfernen` : `${station.name} zu Favoriten hinzufügen`}
      >
        <HeartIcon filled={isFavorite} className="h-5 w-5" />
      </button>
    </article>
  );
}

export default memo(StationCard);
