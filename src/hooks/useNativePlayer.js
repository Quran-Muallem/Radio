import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeRadio } from '../lib/platform.js';
import { reportClick } from '../lib/api.js';
import { playbackErrorMessage, useVolumeState, rememberStation, recallStation } from './playerShared.js';

/**
 * Audio-Engine der Android-App: Die eigentliche Wiedergabe läuft nativ im
 * RadioPlaybackService (Media3/ExoPlayer). Dadurch:
 *  - spielt das Radio weiter, wenn der Bildschirm aus ist oder die App im Hintergrund liegt,
 *  - gibt es Steuerung auf dem Sperrbildschirm, in der Benachrichtigung und per Kopfhörer,
 *  - pausiert die Wiedergabe bei Anrufen (Audiofokus) und wenn Kopfhörer abgezogen werden.
 * Dieser Hook hält die Oberfläche mit dem Dienst synchron.
 *
 * Gleiche Rückgabe wie useWebPlayer: { station, status, error, volume, muted, play, toggle, stop, setVolume, toggleMute }
 */
export function useNativePlayer() {
  const [station, setStation] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const { volume, muted, setVolume, toggleMute } = useVolumeState();

  const stationRef = useRef(null);
  stationRef.current = station;

  // Zustandsmeldungen des nativen Dienstes übernehmen
  const applyState = useCallback((s) => {
    if (!s || !s.state) return;
    const current = stationRef.current;

    if (s.state === 'idle') {
      if (current) {
        setStation(null);
        setStatus('idle');
        setError('');
      }
      return;
    }

    if (current && s.id && s.id !== current.id) return; // Meldung eines vorherigen Senders

    if (!current && s.id) {
      // App wurde neu geöffnet, während der Dienst noch spielt → Sender wiederherstellen
      const saved = recallStation();
      if (!saved || saved.id !== s.id) return;
      stationRef.current = saved;
      setStation(saved);
    }

    if (s.state === 'error') {
      setStatus('error');
      setError(playbackErrorMessage());
    } else {
      setStatus(s.state);
      setError('');
    }
  }, []);

  useEffect(() => {
    let handle = null;
    let disposed = false;
    NativeRadio.addListener('stateChange', applyState).then((h) => {
      if (disposed) h.remove();
      else handle = h;
    });
    NativeRadio.getState().then(applyState).catch(() => {});
    return () => {
      disposed = true;
      if (handle) handle.remove();
    };
  }, [applyState]);

  // Lautstärke an den Dienst weitergeben
  useEffect(() => {
    NativeRadio.setVolume({ volume: muted ? 0 : volume }).catch(() => {});
  }, [volume, muted]);

  const play = useCallback((st, { reconnect = false } = {}) => {
    if (!st) return;
    stationRef.current = st;
    setStation(st);
    setStatus('loading');
    setError('');
    rememberStation(st);
    if (!reconnect) reportClick(st);
    NativeRadio.play({
      id: st.id,
      url: st.url,
      title: st.name,
      artist: st.country,
      artwork: st.favicon || '',
      hls: Boolean(st.hls),
    }).catch(() => {
      if (stationRef.current?.id !== st.id) return;
      setStatus('error');
      setError(playbackErrorMessage());
    });
  }, []);

  const toggle = useCallback(() => {
    const st = stationRef.current;
    if (!st) return;
    if (status === 'error') {
      play(st, { reconnect: true });
    } else if (status === 'playing' || status === 'loading') {
      setStatus('paused');
      NativeRadio.pause().catch(() => {});
    } else {
      setStatus('loading');
      NativeRadio.resume().catch(() => play(st, { reconnect: true }));
    }
  }, [play, status]);

  const stop = useCallback(() => {
    stationRef.current = null;
    setStation(null);
    setStatus('idle');
    setError('');
    rememberStation(null);
    NativeRadio.stop().catch(() => {});
  }, []);

  return { station, status, error, volume, muted, play, toggle, stop, setVolume, toggleMute };
}
