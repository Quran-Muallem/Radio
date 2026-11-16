import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js/light'; // schlanke Variante: reicht für Audio-HLS, ~40 % kleiner
import { reportClick } from '../lib/api.js';
import { playbackErrorMessage, useVolumeState } from './playerShared.js';

/**
 * Audio-Engine für den Browser / die PWA (in der Android-App übernimmt useNativePlayer).
 * Audio-Engine für klassische Streams (MP3/AAC/OGG) und HLS (.m3u8).
 * - Ein einziges <audio>-Element für die ganze App (kein doppelter Ton)
 * - hls.js nur, wenn der Browser HLS nicht nativ kann (Chrome/Firefox); Safari spielt nativ
 * - Saubere Bereinigung (hls.destroy()) bei jedem Senderwechsel und beim Unmount
 *
 * status: 'idle' | 'loading' | 'playing' | 'paused' | 'error'
 */
export function useWebPlayer() {
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const tokenRef = useRef(0); // verhindert, dass Ereignisse eines alten Senders den neuen beeinflussen

  const [station, setStation] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const { volume, muted, setVolume, toggleMute } = useVolumeState();

  // Audio-Element einmalig anlegen
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    const a = new Audio();
    a.preload = 'none';
    a.crossOrigin = null; // keine CORS-Pflicht für reine Wiedergabe
    audioRef.current = a;
  }

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        /* bereits zerstört */
      }
      hlsRef.current = null;
    }
  }, []);

  const fail = useCallback((token) => {
    if (token !== tokenRef.current) return;
    setStatus('error');
    setError(playbackErrorMessage());
  }, []);

  // Lautstärke / Stumm auf das Element anwenden und speichern
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.muted = muted;
  }, [muted]);

  // Element-Ereignisse
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return undefined;
    const onPlaying = () => { setStatus('playing'); setError(''); };
    const onWaiting = () => setStatus((s) => (s === 'error' ? s : 'loading'));
    const onPause = () => setStatus((s) => (s === 'error' || s === 'idle' ? s : 'paused'));
    const onError = () => {
      // Fehler eines bewusst geleerten src ignorieren
      if (!a.getAttribute('src') && !hlsRef.current) return;
      if (hlsRef.current) return; // HLS-Fehler behandelt hls.js selbst
      fail(tokenRef.current);
    };
    const onStalled = () => setStatus((s) => (s === 'playing' ? 'loading' : s));

    a.addEventListener('playing', onPlaying);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('pause', onPause);
    a.addEventListener('error', onError);
    a.addEventListener('stalled', onStalled);
    return () => {
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('error', onError);
      a.removeEventListener('stalled', onStalled);
    };
  }, [fail]);

  // Beim Unmount alles aufräumen
  useEffect(() => () => {
    destroyHls();
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
  }, [destroyHls]);

  const startPlayback = useCallback((token) => {
    const a = audioRef.current;
    const p = a.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        if (token !== tokenRef.current) return;
        // Autoplay-Sperre: kein Stream-Fehler, nur Nutzer muss erneut tippen
        if (err && err.name === 'NotAllowedError') {
          setStatus('paused');
          return;
        }
        if (err && err.name === 'AbortError') return; // durch Senderwechsel abgebrochen
        fail(token);
      });
    }
  }, [fail]);

  const play = useCallback((st, { reconnect = false } = {}) => {
    const a = audioRef.current;
    if (!a || !st) return;

    const token = ++tokenRef.current;

    // Alten Stream vollständig stoppen
    destroyHls();
    a.pause();
    a.removeAttribute('src');
    a.load();

    setStation(st);
    setError('');
    setStatus('loading');
    if (!reconnect) reportClick(st);

    const nativeHls = a.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (st.hls && !nativeHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        manifestLoadingMaxRetry: 2,
        levelLoadingMaxRetry: 2,
        fragLoadingMaxRetry: 3,
      });
      hlsRef.current = hls;
      let mediaRecoveries = 0;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (token === tokenRef.current) startPlayback(token);
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (token !== tokenRef.current || !data?.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 1) {
          mediaRecoveries += 1;
          hls.recoverMediaError();
          return;
        }
        destroyHls();
        fail(token);
      });
      hls.loadSource(st.url);
      hls.attachMedia(a);
    } else {
      a.src = st.url;
      startPlayback(token);
    }
  }, [destroyHls, fail, startPlayback]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !station) return;
    if (status === 'error') {
      play(station, { reconnect: true }); // erneuter Versuch
      return;
    }
    if (a.paused) {
      // Live-Radio: nach längerer Pause frisch verbinden statt alten Puffer abzuspielen
      if (!hlsRef.current) {
        play(station, { reconnect: true });
      } else {
        setStatus('loading');
        startPlayback(tokenRef.current);
      }
    } else {
      a.pause();
    }
  }, [play, startPlayback, station, status]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    tokenRef.current += 1;
    destroyHls();
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
    setStation(null);
    setStatus('idle');
    setError('');
  }, [destroyHls]);


  // Sperrbildschirm-/Kopfhörer-Steuerung (Media Session API)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !station) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: station.name,
        artist: station.country,
        album: 'Quran Radio – Live',
        artwork: station.favicon ? [{ src: station.favicon, sizes: '256x256' }] : [],
      });
      navigator.mediaSession.setActionHandler('play', () => toggle());
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
      navigator.mediaSession.setActionHandler('stop', () => stop());
    } catch {
      /* nicht in allen Browsern vollständig unterstützt */
    }
  }, [station, toggle, stop]);

  // Sperrbildschirm-Anzeige (Pause/Play-Symbol) synchron halten
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = status === 'playing' || status === 'loading' ? 'playing' : station ? 'paused' : 'none';
      if (!station) navigator.mediaSession.metadata = null;
    } catch {
      /* ältere Browser */
    }
  }, [status, station]);

  return { station, status, error, volume, muted, play, toggle, stop, setVolume, toggleMute };
}
