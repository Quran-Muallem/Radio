# Quran Radio Weltweit

Kostenlose, legale Quran-Livestreams aus aller Welt – als **Web-App** und als **Android-App**.
React 18 · Vite · Tailwind CSS 4 · hls.js · Capacitor 8

## 📱 Ausprobieren

| | Link |
|---|---|
| **Android-APK** | [Neueste Version herunterladen](https://github.com/Quran-Muallem/radio/releases/latest) |
| **Web-Version** | https://quran-muallem.github.io/radio/ |

**APK installieren:** Datei auf dem Handy herunterladen → öffnen → „Aus dieser Quelle installieren“ erlauben.
Jede neue Version lässt sich direkt über die alte installieren.

## Funktionen
- **Maximale Abdeckung arabischer Sender** – parallel über `Promise.allSettled` (fällt eine Quelle aus, laufen die anderen weiter):
  - Radio-Browser: Tags `quran` und `islam`, Namenssuche „قرآن“ und „Quran“
  - Radio-Browser: komplette Länderlisten für SA, EG, TN, MA, DZ, AE, KW, QA, JO, PS,
    gefiltert auf Quran-/Islam-Sender (Lateinisch + Arabisch, z. B. Zitouna, Makkah, Tafsir, تلاوة, رقية)
  - MP3Quran API v3 (arabisch + englisch) → Kategorie „24/7 Rezitatoren (MP3Quran)“ mit arabischem Namen und englischem Untertitel
- Nur HTTPS-Streams, Duplikate über die normalisierte Stream-URL entfernt
- Alle Länder auf Deutsch mit Flagge; die 22 arabischen Länder werden zuerst gezeigt
- **Länder-Leiste** (Flagge, Name, Senderanzahl) + gruppiertes Länder-Dropdown
- **Tabs:** Alle Sender · Arabische Länder · 24/7 Rezitatoren · Weltweit · Meine Favoriten
- **Suche auf Deutsch, Lateinisch und Arabisch** – mit Schreibvarianten: „Afasy“ findet „Alafasi“ und „العفاسي“,
  „Makkah“ findet „مكة“, „القران“ findet „القرآن“
- MP3/AAC- und HLS-Streams (hls.js; ohne MSE die eingebaute Wiedergabe), saubere Bereinigung beim Senderwechsel
- Favoriten und Lautstärke werden gespeichert
- Steuerung über Sperrbildschirm und Kopfhörer (Media Session)

### Android-App: echtes App-Verhalten
- **Hintergrund-Wiedergabe:** Native Audio-Engine (Media3/ExoPlayer) in einem Medien-Dienst –
  läuft weiter bei ausgeschaltetem Bildschirm und im Hintergrund (Wake- und WLAN-Lock)
- **Sperrbildschirm & Benachrichtigung:** Play/Pause, Senderlogo und -name; Bluetooth- und Kopfhörertasten
- **Audiofokus:** pausiert bei Anrufen, pausiert beim Abziehen der Kopfhörer
- **Live statt Puffer:** Nach einer Pause wird der Stream frisch verbunden
- **Zurück-Taste:** setzt erst Filter zurück, dann geht die App in den Hintergrund (Radio läuft weiter)
- **Vollbild ohne Adresszeile**, Statusleiste im App-Design (Edge-to-Edge)

### Offline
- Letzte Senderliste wird gespeichert und offline angezeigt (mit Datum)
- Eigene Offline-Seite, wenn noch keine Liste vorhanden ist
- Automatisches Neuladen und Fortsetzen des Streams, sobald das Netz zurück ist
- Web-Version als **PWA**: installierbar („Zum Startbildschirm“), eigenes Fenster ohne Adresszeile,
  startet dank Service Worker auch offline

## Automatische Builds
Bei jedem Push auf `main`:
- **Android-APK bauen** (`.github/workflows/android-apk.yml`) → neues Release mit APK
- **Web-Version** (`.github/workflows/pages.yml`) → GitHub Pages

## Lokal entwickeln
```bash
npm install
npm run dev                  # Dev-Server
npm run build                # Build nach dist/
SINGLEFILE=1 npm run build   # alles in eine einzige dist/index.html
npx cap sync android         # Web-Build in das Android-Projekt übernehmen
cd android && ./gradlew assembleDebug   # APK (benötigt Android SDK + JDK 21)
```

## Struktur
```
src/
  App.jsx                  Zustand, Filterlogik, Layout
  hooks/useAudioPlayer.js  wählt die Engine: nativ (App) oder Web (Browser)
  hooks/useNativePlayer.js Brücke zum nativen Hintergrund-Dienst
  hooks/useWebPlayer.js    <audio> + hls.js + Media Session API
  hooks/useOnlineStatus.js Netzwerkstatus (Capacitor Network / Browser)
  lib/api.js               Paralleles Laden aller Quellen, Religions-Filter, HTTPS, Duplikate, Klick-Statistik
  lib/search.js            Suche mit Arabisch-Normalisierung und Schreibvarianten
  lib/countries.js         Deutsche Ländernamen, Flaggen, arabische Länder
  lib/storage.js           Abgesicherter localStorage (Favoriten, Lautstärke)
  components/              Header, FilterBar, StationCard, PlayerBar, Footer, Icons
android/                   Capacitor-Android-Projekt
  …/RadioPlaybackService.java  Medien-Dienst (ExoPlayer + MediaSession)
  …/NativeRadioPlugin.java     JS-Brücke (play/pause/resume/stop/setVolume + Statusereignisse)
public/                    PWA: manifest.webmanifest, sw.js, offline.html, Icons
assets/                    Quellgrafiken für App-Icon und Splash-Screen
```

## Hinweis
Alle Audiostreams kommen direkt von den offiziellen Servern der jeweiligen Sender. Diese App speichert,
verändert oder verbreitet keine Audiodaten. Die APK ist mit einem öffentlichen Test-Schlüssel signiert –
für den Play Store einen eigenen, geheimen Release-Schlüssel verwenden.
