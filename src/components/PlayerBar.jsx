import { useState } from 'react';
import { PlayIcon, PauseIcon, VolumeIcon, Spinner, AlertIcon, CloseIcon, RadioIcon, RefreshIcon } from './Icons.jsx';
import { flagEmoji, RECITERS_CATEGORY } from '../lib/countries.js';

function LiveBadge({ status }) {
  const live = status === 'playing';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        live ? 'bg-red-500/15 text-red-300' : 'bg-white/5 text-slate-400'
      }`}
    >
      <span className="relative flex h-2 w-2">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-red-400' : 'bg-slate-500'}`} />
      </span>
      {status === 'loading' ? 'Puffert' : status === 'paused' ? 'Pausiert' : status === 'error' ? 'Offline' : 'Live'}
    </span>
  );
}

function PlayerLogo({ src }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald/25 to-gold/10 text-emerald ring-1 ring-white/10">
        <RadioIcon className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      onLoad={(e) => { if (e.currentTarget.naturalWidth < 8) setBroken(true); }}
      className="h-12 w-12 shrink-0 rounded-xl bg-white/5 object-contain p-1 ring-1 ring-white/10"
    />
  );
}

export default function PlayerBar({ player }) {
  const { station, status, error, volume, muted, toggle, stop, setVolume, toggleMute } = player;
  if (!station) return null;

  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const flag = station.country === RECITERS_CATEGORY ? '🎧' : flagEmoji(station.countrycode);
  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night/90 backdrop-blur-xl safe-bottom"
      role="region"
      aria-label="Audio-Player"
    >
      {/* dezente Gold-Emerald-Linie */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald/60 to-transparent" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 pt-3">
        {isError && (
          <div role="alert" className="mb-2.5 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-200 ring-1 ring-red-400/20">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div key={station.id} className="contents">
            <PlayerLogo src={station.favicon} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <LiveBadge status={status} />
            </div>
            <p className="mt-1 truncate text-[15px] font-semibold text-white" dir="auto" title={station.name}>{station.name}</p>
            <p className="truncate text-xs text-slate-400">
              {flag && <span className="mr-1">{flag}</span>}
              {station.country}
            </p>
          </div>

          {/* Lautstärke (ab Tablet sichtbar, mobil regelt man meist per Hardware-Taste) */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-lg p-2 text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald"
              aria-label={muted ? 'Ton einschalten' : 'Stummschalten'}
              aria-pressed={muted}
            >
              <VolumeIcon muted={muted || volume === 0} level={volume} className="h-5 w-5" />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectiveVolume}
              onChange={(e) => setVolume(e.target.value)}
              aria-label="Lautstärke"
              className="h-1.5 w-28 cursor-pointer accent-emerald"
              style={{ accentColor: '#10B981' }}
            />
          </div>

          {/* Großer Play/Pause-Button */}
          <button
            type="button"
            onClick={toggle}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald text-night shadow-lg shadow-emerald/25 transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            aria-label={isError ? 'Erneut versuchen' : isPlaying || isLoading ? 'Pausieren' : 'Abspielen'}
          >
            {isLoading ? (
              <Spinner className="h-7 w-7" />
            ) : isError ? (
              <RefreshIcon className="h-6 w-6" />
            ) : isPlaying ? (
              <PauseIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6 translate-x-[2px]" />
            )}
          </button>

          <button
            type="button"
            onClick={stop}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald"
            aria-label="Player schließen"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Lautstärke-Zeile */}
        <div className="mt-2 flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg p-1.5 text-slate-300 focus-visible:outline-2 focus-visible:outline-emerald"
            aria-label={muted ? 'Ton einschalten' : 'Stummschalten'}
            aria-pressed={muted}
          >
            <VolumeIcon muted={muted || volume === 0} level={volume} className="h-5 w-5" />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effectiveVolume}
            onChange={(e) => setVolume(e.target.value)}
            aria-label="Lautstärke"
            className="h-1.5 flex-1 cursor-pointer"
            style={{ accentColor: '#10B981' }}
          />
          <span className="w-9 text-right text-[11px] tabular-nums text-slate-500">{Math.round(effectiveVolume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
