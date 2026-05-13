'use client';

import Link from 'next/link';
import { C } from '@/lib/admin-tokens';

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
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
  },
  desc: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    marginTop: 2,
  },
  countBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  bigNum: {
    fontSize: 32,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: -1,
    fontFamily: 'monospace',
  },
  countLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1,
    color: 'var(--color-text-muted)',
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
    fontSize: 11,
    fontWeight: 700,
    color: C.error,
    letterSpacing: 0.5,
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
    fontSize: 12,
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border-light)',
  },
  footer: {
    display: 'block',
    padding: '12px 18px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    textAlign: 'right',
  },
};
