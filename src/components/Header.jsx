import { StarMark } from './Icons.jsx';

function Stat({ value, label, loading }) {
  return (
    <div className="flex flex-col items-center sm:items-start rounded-xl bg-white/[0.03] ring-1 ring-white/5 px-4 py-2.5 min-w-[96px]">
      <span className="text-2xl font-semibold tabular-nums text-white">
        {loading ? <span className="inline-block h-6 w-10 rounded bg-white/10 animate-pulse align-middle" /> : value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}

export default function Header({ stationCount, countryCount, loading }) {
  return (
    <header className="safe-top relative overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 geo-pattern opacity-80" aria-hidden="true" />
      <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-emerald/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 pt-6 pb-5 sm:pt-10 sm:pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3.5">
            <StarMark className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />
            <div>
              <p className="font-arabic text-gold/90 text-lg leading-none mb-1" lang="ar" dir="rtl">إذاعات القرآن الكريم</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Quran Radio <span className="text-emerald">Weltweit</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <span className="inline-flex w-fit items-center gap-2 self-center sm:self-end rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              100&nbsp;% Kostenlos • Offizielle Direkt-Streams
            </span>
            <div className="flex justify-center gap-2.5">
              <Stat value={stationCount} label="Live-Sender" loading={loading} />
              <Stat value={countryCount} label="Länder" loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
