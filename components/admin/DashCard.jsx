'use client';

import Link from 'next/link';
import { C, T, W, LS } from '@/lib/admin-tokens';

export default function DashCard({
  icon,
  title,
  count,
  countLabel,
  description,
  accentColor = 'var(--color-text-secondary)',
  alertCount,
  alertLabel,
  headerHref,
  footerHref,
  footerLabel = 'VIEW ALL →',
  children,
  emptyText = 'Nothing here yet.',
  isEmpty = false,
}) {
  return (
    <section style={{ ...S.card, borderLeft: `3px solid ${accentColor}` }}>
      <Link href={headerHref} style={S.header}>
        <div style={S.headMain}>
          <div style={S.headLeft}>
            {icon && <span style={S.icon}>{icon}</span>}
            <span style={S.title}>{title}</span>
            {description && <span style={S.desc}>{description}</span>}
          </div>
          {typeof count === 'number' && (
            <div style={S.countBlock}>
              <span style={{ ...S.bigNum, color: accentColor }}>{count}</span>
              {countLabel && <span style={S.countLabel}>{countLabel}</span>}
            </div>
          )}
        </div>
        {alertCount > 0 && (
          <div style={S.alertStrip}>
            <span style={S.alertBullet} />
            {alertCount} {alertLabel}
          </div>
        )}
      </Link>

      <div style={S.body}>
        {isEmpty ? <div style={S.empty}>{emptyText}</div> : children}
      </div>

      <Link href={footerHref} style={S.footer}>{footerLabel}</Link>
    </section>
  );
}

const S = {
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 18px 14px',
    borderBottom: '1px solid var(--color-border-light)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
  },
  headMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  headLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  icon: { fontSize: 20, lineHeight: 1, marginBottom: 6 },
  title: {
    fontSize: T.mini,
    fontWeight: W.heavy,
    letterSpacing: LS.capsMax,
    textTransform: 'uppercase',
    color: C.textMuted,
  },
  desc: {
    fontSize: T.small,
    fontWeight: W.medium,
    color: C.textSecondary,
    marginTop: 2,
  },
  countBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  bigNum: {
    fontSize: T.statM,
    fontWeight: W.heavy,
    lineHeight: 1,
    letterSpacing: LS.tight,
    fontFamily: 'monospace',
  },
  countLabel: {
    fontSize: T.mini,
    fontWeight: W.semibold,
    letterSpacing: LS.label,
    color: C.textMuted,
    textTransform: 'uppercase',
    textAlign: 'right',
    marginTop: 3,
  },
  alertStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: '5px 8px',
    background: C.errorTint,
    border: `1px solid ${C.errorBorder}`,
    fontSize: T.caption,
    fontWeight: W.bold,
    color: C.error,
    letterSpacing: LS.wide,
  },
  alertBullet: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: C.error,
    flexShrink: 0,
  },
  body: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
  empty: {
    padding: '32px 18px',
    textAlign: 'center',
    fontSize: T.small,
    color: C.textMuted,
    borderBottom: `1px solid ${C.borderLight}`,
  },
  footer: {
    display: 'block',
    padding: '12px 18px',
    fontSize: T.mini,
    fontWeight: W.heavy,
    letterSpacing: LS.capsWide,
    color: C.textMuted,
    textDecoration: 'none',
    textAlign: 'right',
  },
};
