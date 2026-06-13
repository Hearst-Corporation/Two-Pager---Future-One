import { useState } from 'react';
import { Button } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

function fmtDate(s) { try { return new Date(s).toLocaleString(); } catch { return s; } }

export default function DossierGovernance({ memo, onStatusChange }) {
  const [govBusy, setGovBusy] = useState(false);
  const [govErr, setGovErr] = useState(null);

  async function transition(next) {
    setGovBusy(true); setGovErr(null);
    try {
      const r = await fetch(`/api/admin/hearst/strategic-memos/${memo.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setGovErr(j.error || `HTTP ${r.status}`); return; }
      onStatusChange && onStatusChange();
    } catch (e) { setGovErr(String(e)); } finally { setGovBusy(false); }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 'var(--cp-space-1)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {memo.status === 'draft' && (
          <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('reviewed')}>{UI.DOSSIER_BTN_MARK_REVIEWED}</Button>
        )}
        {memo.status === 'reviewed' && (
          <>
            <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('approved')}>{UI.DOSSIER_BTN_APPROVE}</Button>
            <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('draft')}>{UI.DOSSIER_BTN_SEND_BACK}</Button>
          </>
        )}
        {memo.status === 'approved' && (
          <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('archived')}>{UI.DOSSIER_BTN_ARCHIVE}</Button>
        )}
        {memo.status === 'archived' && (
          <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('draft')}>{UI.DOSSIER_BTN_REOPEN}</Button>
        )}
      </div>
      {(memo.approved_at || memo.reviewed_at) && (
        <div style={{ fontSize: 'var(--cp-font-xs)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-muted)' }}>
          {memo.approved_at ? UI.DOSSIER_GOV_APPROVED(fmtDate(memo.approved_at)) : UI.DOSSIER_GOV_REVIEWED(fmtDate(memo.reviewed_at))}
        </div>
      )}
      {govErr && <div style={{ fontSize: 'var(--cp-font-xs)', color: 'var(--cp-error)', maxWidth: 'calc(var(--cp-space-9) * 5 + var(--cp-space-5))', textAlign: 'right' }}>{govErr}</div>}
    </>
  );
}
