'use client';

import { C, T, W, LS } from '@/lib/admin-tokens';
import { INIT_STATUS_LABEL, INIT_STATUS_COLOR, STATUS_LABEL } from '@/lib/admin-constants';

/**
 * StatusBadge — colored pill for any status/severity value.
 *
 * Props:
 *   status   string  — key in `colorMap` or `labelMap`
 *   colorMap object  — { [status]: hexColor }  (falls back to C.textMuted)
 *   labelMap object  — { [status]: string }     (falls back to raw status)
 *   size     'sm'|'md'  (default 'sm')
 *   dot      boolean — show leading dot  (default true)
 */
export default function StatusBadge({
  status,
  colorMap = {},
  labelMap = {},
  size = 'sm',
  dot = true,
}) {
  const color = colorMap[status] || C.textMuted;
  const label = labelMap[status] || status || '—';
  const isMd = size === 'md';

  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      gap:           isMd ? 5 : 4,
      padding:       isMd ? '3px 8px' : '2px 6px',
      borderRadius:  isMd ? 4 : 3,
      background:    `color-mix(in srgb, ${color} 10%, transparent)`,
      border:        `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
      fontSize:      isMd ? T.caption : T.micro,
      fontWeight:    W.bold,
      letterSpacing: LS.caps,
      textTransform: 'uppercase',
      color,
      whiteSpace:    'nowrap',
      lineHeight:    1,
    }}>
      {dot && (
        <span style={{
          width:        isMd ? 5 : 4,
          height:       isMd ? 5 : 4,
          borderRadius: '50%',
          background:   color,
          flexShrink:   0,
        }} />
      )}
      {label}
    </span>
  );
}

/* ---- Pre-wired variants for convenience ---- */

/** Initiative status badge (not_started / planned / in_progress / blocked / done / archived) */
export function InitStatusBadge({ status, size }) {
  return (
    <StatusBadge
      status={status}
      colorMap={INIT_STATUS_COLOR}
      labelMap={INIT_STATUS_LABEL}
      size={size}
    />
  );
}

/** Pipeline status badge (identified / contacted / … / closed_won / closed_lost) */
export function PipelineStatusBadge({ status, size }) {
  return (
    <StatusBadge
      status={status}
      colorMap={{
        identified:    C.textMuted,
        contacted:     C.info,
        in_discussion: C.warning,
        nda_signed:    C.warning,
        loi:           C.info,
        term_sheet:    C.info,
        closed_won:    C.success,
        closed_lost:   C.error,
      }}
      labelMap={STATUS_LABEL}
      size={size}
    />
  );
}

/** Severity badge (critical / warning / info) */
export function SeverityBadge({ severity, size }) {
  return (
    <StatusBadge
      status={severity}
      colorMap={{ critical: C.error, warning: C.warning, info: C.info }}
      labelMap={{ critical: 'Critical', warning: 'Warning', info: 'Info' }}
      size={size}
    />
  );
}
