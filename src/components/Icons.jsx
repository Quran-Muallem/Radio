// Schlanke Inline-SVG-Icons (keine externe Icon-Bibliothek nötig)
const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const RadioIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4.9 16.1a10 10 0 0 1 0-8.2M19.1 7.9a10 10 0 0 1 0 8.2M7.8 13.6a5 5 0 0 1 0-3.2M16.2 10.4a5 5 0 0 1 0 3.2" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

export const HeartIcon = ({ filled, ...p }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" />
  </svg>
);

export const PlayIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);

export const PauseIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export const VolumeIcon = ({ muted, level = 1, ...p }) => (
  <svg {...base} {...p}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
    {muted ? (
      <path d="m16 9 5 6M21 9l-5 6" />
    ) : (
      <>
        {level > 0 && <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />}
        {level > 0.5 && <path d="M18.5 7a7 7 0 0 1 0 10" />}
      </>
    )}
  </svg>
);

export const SearchIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const CloseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ChevronIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const AlertIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </svg>
);

export const RefreshIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
  </svg>
);

export const Spinner = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Achtzackiger Stern als Markenzeichen
export const StarMark = (p) => (
  <svg viewBox="0 0 64 64" aria-hidden="true" {...p}>
    <path d="M32 6l7.6 18.4L58 32l-18.4 7.6L32 58l-7.6-18.4L6 32l18.4-7.6z" fill="#10B981" />
    <rect x="20" y="20" width="24" height="24" transform="rotate(45 32 32)" fill="none" stroke="#F59E0B" strokeWidth="2" />
    <circle cx="32" cy="32" r="5" fill="#F59E0B" />
  </svg>
);

export const Equalizer = ({ className = '' }) => (
  <span className={`inline-flex items-end gap-[3px] h-4 ${className}`} aria-hidden="true">
    <span className="eq-bar w-[3px] h-full rounded-sm bg-emerald" />
    <span className="eq-bar w-[3px] h-full rounded-sm bg-emerald" />
    <span className="eq-bar w-[3px] h-full rounded-sm bg-emerald" />
  </span>
);
