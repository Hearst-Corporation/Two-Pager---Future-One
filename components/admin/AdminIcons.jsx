// components/admin/AdminIcons.jsx
// Inline SVG icon set for the admin shell.
// Style: line, stroke 1.6, 20×20 (24×24 viewBox), currentColor, rounded caps.
// Premium look: avoid emoji and avoid raster.

const BASE = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

// ─── Top-level admin sections ─────────────────────────────────────────

export const HomeIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const TodayIcon = (p) => (
  <svg {...BASE} {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4M16 3v4" />
    <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const PipelineIcon = (p) => (
  <svg {...BASE} {...p}>
    <rect x="3" y="4" width="5" height="16" rx="1.2" />
    <rect x="9.5" y="4" width="5" height="11" rx="1.2" />
    <rect x="16" y="4" width="5" height="7" rx="1.2" />
  </svg>
);

export const RoadmapIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M3 12h18" />
    <circle cx="6" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="18" cy="12" r="2" />
    <path d="M6 14v3M12 14v3M18 14v3" />
  </svg>
);

export const PartnersIcon = (p) => (
  <svg {...BASE} {...p}>
    <circle cx="9" cy="9" r="3.5" />
    <circle cx="17" cy="11" r="2.6" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M14.5 20c0-2.3 1.7-4.2 3.5-4.5" />
  </svg>
);

export const TeamIcon = (p) => (
  <svg {...BASE} {...p}>
    <circle cx="12" cy="8" r="3.4" />
    <circle cx="5.5" cy="10.5" r="2.4" />
    <circle cx="18.5" cy="10.5" r="2.4" />
    <path d="M5 20c0-2.5 2.2-4.5 4.9-4.5h4.2c2.7 0 4.9 2 4.9 4.5" />
  </svg>
);

export const HearstIcon = (p) => (
  // Stylised "H" inside rounded square — distinct mark for the HEARST hub.
  <svg {...BASE} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M9 8v8M15 8v8M9 12h6" />
  </svg>
);

// ─── HEARST module icons (MODULES grid) ───────────────────────────────

export const BookIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v17H6a2 2 0 0 0-2 2V5z" />
    <path d="M4 19a2 2 0 0 1 2-2h13" />
  </svg>
);

export const SlidersIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M4 7h10" /><circle cx="17" cy="7" r="2.2" />
    <path d="M14 12h6" /><circle cx="9" cy="12" r="2.2" />
    <path d="M4 17h10" /><circle cx="17" cy="17" r="2.2" />
  </svg>
);

export const LinkIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66L11.5 7" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66L12.5 17" />
  </svg>
);

export const ChartIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M3 20h18" />
    <path d="M5 16l4-5 4 3 5-7" />
    <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="13" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const FolderIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);

export const DocumentIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

export const TargetIcon = (p) => (
  <svg {...BASE} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const WarningIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M12 4 L21 19 H3 Z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const ClockIcon = (p) => (
  <svg {...BASE} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const CompareIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M8 4v16M16 4v16" />
    <path d="M4 8l4-4 4 4" />
    <path d="M20 16l-4 4-4-4" />
  </svg>
);

export const CompassIcon = (p) => (
  <svg {...BASE} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.4 8.6 L13.5 13 L9.5 14.9 L11.4 10.6 Z" />
  </svg>
);

export const ReportIcon = (p) => (
  <svg {...BASE} {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h3" />
  </svg>
);

export const SearchIcon = (p) => (
  <svg {...BASE} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </svg>
);

// ─── Utility icons ────────────────────────────────────────────────────

export const ChevronLeftIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const BellIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

export const LogOutIcon = (p) => (
  <svg {...BASE} {...p}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M5 12h12" />
  </svg>
);

export const SettingsIcon = (p) => (
  <svg {...BASE} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

// ─── Brand mark ───────────────────────────────────────────────────────

export const BrandMark = ({ size = 28 }) => (
  // Square monogram for collapsed sidebar — "F1" in accent over dark plate
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <rect x="0" y="0" width="28" height="28" rx="6" fill="var(--color-gray-900)" />
    <text
      x="14" y="19" textAnchor="middle"
      fontFamily='"Inter", system-ui, sans-serif'
      fontSize="13" fontWeight="900"
      fill="var(--color-accent-strong)"
      letterSpacing="0.5"
    >F1</text>
  </svg>
);

// Look up an icon component by short key (used by lib/hearst-nav.js).
export function getIconByKey(key) {
  switch (key) {
    case 'home':     return HomeIcon;
    case 'book':     return BookIcon;
    case 'sliders':  return SlidersIcon;
    case 'link':     return LinkIcon;
    case 'chart':    return ChartIcon;
    case 'folder':   return FolderIcon;
    case 'document': return DocumentIcon;
    case 'target':   return TargetIcon;
    case 'warning':  return WarningIcon;
    case 'clock':    return ClockIcon;
    case 'compare':  return CompareIcon;
    case 'compass':  return CompassIcon;
    case 'report':   return ReportIcon;
    case 'search':   return SearchIcon;
    default:         return null;
  }
}

// Map a HEARST sub-route href to its icon component.
export function getHearstSubIcon(href) {
  switch (href) {
    case '/admin/hearst/about':          return BookIcon;
    case '/admin/hearst':                return HomeIcon;
    case '/admin/hearst/assumptions':    return SlidersIcon;
    case '/admin/hearst/sources':        return LinkIcon;
    case '/admin/hearst/financial':      return ChartIcon;
    case '/admin/hearst/data-room':      return FolderIcon;
    case '/admin/hearst/contracts':      return DocumentIcon;
    case '/admin/hearst/pipeline':       return TargetIcon;
    case '/admin/hearst/risks':          return WarningIcon;
    case '/admin/hearst/timeline':       return ClockIcon;
    case '/admin/hearst/scenarios':      return CompareIcon;
    case '/admin/hearst/deal-simulator': return CompassIcon;
    case '/admin/hearst/reports':        return ReportIcon;
    case '/admin/hearst/audit':          return SearchIcon;
    default:                             return null;
  }
}
