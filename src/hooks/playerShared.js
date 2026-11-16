import { useEffect, useState } from 'react';
import { readJSON, writeJSON, KEYS } from '../lib/storage.js';

export const STREAM_ERROR_MESSAGE = 'Stream aktuell offline oder vom Server blockiert – bitte anderen Sender wählen.';
export const OFFLINE_ERROR_MESSAGE = 'Keine Internetverbindung – die Wiedergabe startet automatisch, sobald du wieder online bist.';

// Passende Fehlermeldung: ohne Netz liegt es nicht am Sender
export function playbackErrorMessage() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return OFFLINE_ERROR_MESSAGE;
  return STREAM_ERROR_MESSAGE;
}

// Lautstärke + Stumm, im localStorage gespeichert
export function useVolumeState() {
  const [volume, setVolumeState] = useState(() => {
    const v = Number(readJSON(KEYS.volume, 0.8));
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8;
  });
  const [muted, setMuted] = useState(() => Boolean(readJSON(KEYS.muted, false)));

  useEffect(() => writeJSON(KEYS.volume, volume), [volume]);
  useEffect(() => writeJSON(KEYS.muted, muted), [muted]);

  const setVolume = (v) => {
    const n = Math.min(1, Math.max(0, Number(v)));
    setVolumeState(n);
    if (n > 0) setMuted(false);
  };
  const toggleMute = () => setMuted((m) => !m);

  return { volume, muted, setVolume, toggleMute };
}

// Zuletzt gespielten Sender merken – damit die App nach einem Neustart weiß,
// welcher Sender im Hintergrund-Dienst noch läuft.
export function rememberStation(station) {
  writeJSON(KEYS.lastStation, station || null);
}

export function recallStation() {
  const st = readJSON(KEYS.lastStation, null);
  return st && typeof st === 'object' && st.id && st.url ? st : null;
}
