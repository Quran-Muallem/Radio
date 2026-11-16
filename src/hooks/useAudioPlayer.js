import { isNative } from '../lib/platform.js';
import { useWebPlayer } from './useWebPlayer.js';
import { useNativePlayer } from './useNativePlayer.js';

/**
 * Wählt die passende Audio-Engine:
 *  - Android-App → native Hintergrund-Wiedergabe (Media3, Sperrbildschirm, Benachrichtigung)
 *  - Browser/PWA → <audio> + hls.js + Media Session API des Browsers
 * Die Plattform steht beim Start fest, daher ist die Auswahl außerhalb der Komponente regelkonform.
 */
export const useAudioPlayer = isNative ? useNativePlayer : useWebPlayer;
