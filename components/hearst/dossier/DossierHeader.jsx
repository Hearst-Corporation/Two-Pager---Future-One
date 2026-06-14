import DossierGovernance from './DossierGovernance';
import DossierExport from './DossierExport';
import { UI } from '@/lib/ui-strings';

export default function DossierHeader({ memo, decision, ident, onStatusChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--cp-space-4)', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 calc(var(--cp-space-8) * 10)', minWidth: 0 }}>
        <div style={{ fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'capitalize', marginBottom: 'var(--cp-space-2)' }}>
          {ident.join('  ·  ')}
        </div>
        <h1 style={{ fontSize: 'var(--cp-font-2xl)', fontWeight: 'var(--cp-weight-black)', letterSpacing: 'var(--cp-tracking-tight)', color: 'var(--cp-text-primary)', margin: 'var(--cp-space-0)', lineHeight: 'var(--cp-leading-tight)' }}>
          {memo.title}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)', alignItems: 'flex-end', flexShrink: 0 }}>
        <DossierExport memoId={memo.id} />
        <DossierGovernance memo={memo} onStatusChange={onStatusChange} />
        
        <div style={{ marginTop: 'var(--cp-space-2)', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 'calc(var(--cp-space-1) / 2)' }}>
          <div style={{ fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-wider)', display: 'block', marginBottom: 'var(--cp-space-1)' }}>
            {UI.DOSSIER_EYEBROW_NEXT_ACTION}
          </div>
          <div style={{ fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)' }}>
            {decision.nextAction.primary}
          </div>
          <div style={{ fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', lineHeight: 'var(--cp-leading-tight)' }}>
            {decision.nextAction.detail}
          </div>
        </div>
      </div>
    </div>
  );
}
