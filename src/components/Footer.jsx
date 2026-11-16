export default function Footer() {
  return (
    <footer className="mx-auto max-w-3xl px-4 pt-10 pb-8 text-center text-xs leading-relaxed text-slate-500">
      <div className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden="true" />
      <p>
        <strong className="font-medium text-slate-400">Rechtlicher Hinweis:</strong> Alle Audiostreams werden direkt von den
        offiziellen Servern der jeweiligen Sender bzw. Anbieter abgespielt. Diese App speichert, verändert oder
        verbreitet keine Audiodaten auf eigenen Servern – sie verlinkt ausschließlich frei und öffentlich zugängliche
        Live-Streams. Alle Rechte an den Inhalten liegen bei den jeweiligen Sendern.
      </p>
      <p className="mt-3">
        Senderverzeichnisse:{' '}
        <a href="https://www.radio-browser.info" target="_blank" rel="noopener noreferrer" className="text-emerald/80 underline-offset-2 hover:underline">
          Radio-Browser
        </a>{' '}
        (offene Community-Datenbank) und{' '}
        <a href="https://mp3quran.net" target="_blank" rel="noopener noreferrer" className="text-emerald/80 underline-offset-2 hover:underline">
          MP3Quran
        </a>
        . Verfügbarkeit einzelner Streams kann sich jederzeit ändern.
      </p>
    </footer>
  );
}
