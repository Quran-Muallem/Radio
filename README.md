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
- Lädt Sender live und parallel aus drei offenen Quellen (`Promise.allSettled` – fällt eine aus, laufen die anderen weiter)
  - Radio-Browser: `tag=quran` (weltweit) und `byname/Zitouna` (gefiltert auf Tunesien)
  - MP3Quran API v3 → Kategorie „24/7 Rezitatoren“
- Nur HTTPS-Streams, Duplikate entfernt, Ländernamen einheitlich auf Deutsch
- MP3/AAC- und HLS-Streams (hls.js, Safari nativ), saubere Bereinigung beim Senderwechsel
- Suche, Länderfilter mit Flaggen, Schnellfilter, Favoriten und Lautstärke werden gespeichert
- Steuerung über Sperrbildschirm und Kopfhörer (Media Session)

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
  hooks/useAudioPlayer.js  Audio-Engine (MP3/AAC + HLS, Fehlerbehandlung, Media Session)
  lib/api.js               Paralleles Laden, HTTPS-Filter, Duplikate, Klick-Statistik
  lib/countries.js         Deutsche Ländernamen + Flaggen-Emojis
  lib/storage.js           Abgesicherter localStorage (Favoriten, Lautstärke)
  components/              Header, FilterBar, StationCard, PlayerBar, Footer, Icons
android/                   Capacitor-Android-Projekt
assets/                    Quellgrafiken für App-Icon und Splash-Screen
```

## Hinweis
Alle Audiostreams kommen direkt von den offiziellen Servern der jeweiligen Sender. Diese App speichert,
verändert oder verbreitet keine Audiodaten. Die APK ist mit einem öffentlichen Test-Schlüssel signiert –
für den Play Store einen eigenen, geheimen Release-Schlüssel verwenden.
