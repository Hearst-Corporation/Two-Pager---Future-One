'use client';

// /admin/hearst/workspace — Saved scenarios only (GET /scenarios?project_id).
// Strategic reports / memos → /admin/hearst/dossier (single list).
// Primitives UI (Table/SectionHead/Button) — tokens --cp-* uniquement.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SectionHead, Table, Row, Cell, Button, Card } from '@/components/hearst/ui';
import { S as CP } from '@/lib/cp-styles';
import { UI } from '@/lib/ui-strings';

const WS_ERR = { ...CP.error, padding: 'var(--cp-space-3)', border: '1px solid var(--cp-border)', marginBottom: 'var(--cp-space-4)' };

const fmtDate = (s) => { try { return new Date(s).toLocaleDateString(); } catch { return s; } };

export default function WorkspacePage() {
  const [scenarios, setScenarios] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      let pid = null;
      try {
        const pj = await fetch('/api/admin/hearst/project').then(r => r.json());
        pid = (pj.project || pj)?.id || null;
      } catch { /* project optional */ }
      if (!pid) {
        setScenarios([]);
        return;
      }
      const sc = await fetch(`/api/admin/hearst/scenarios?project_id=${pid}`).then(r => r.json());
      setScenarios(sc.scenarios || sc.rows || []);
    } catch (e) {
      setErr(String(e));
      setScenarios([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteScenario(id) {
    setBusy(id);
    setConfirmDel(null);
    try {
      const r = await fetch(`/api/admin/hearst/scenarios/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error || `Delete failed (${r.status})`);
      } else {
        await load();
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="oracle-page">
      <header className="oracle-page-header">
        <h1>{UI.WS_PAGE_TITLE}</h1>
        <p className="oracle-subtitle">
          {UI.WS_PAGE_SUBTITLE}{' '}
          <Link href="/admin/hearst/dossier" style={S.dossierLink}>Dossier</Link>.
        </p>
      </header>

      {err && <div style={WS_ERR}>Error: {err}</div>}

      <Card as="section" variant="flat" surface={1} padding="lg" style={S.section}>
        <SectionHead title={UI.WS_SECTION_SCENARIOS} hint={`${scenarios?.length ?? '—'} saved`} />
        {scenarios === null && <div style={CP.empty}>{UI.STATE_LOADING}</div>}
        {scenarios && scenarios.length === 0 && <div style={CP.empty}>{UI.WS_NO_SCENARIOS}</div>}
        {scenarios && scenarios.length > 0 && (
          <Table head={[UI.WS_TH_NAME, UI.WS_TH_TYPE, UI.WS_TH_CREATED, UI.WS_TH_STATUS, '']}>
            {scenarios.map(s => (
              <Row key={s.id}>
                <Cell label>{s.name}</Cell>
                <Cell>{s.scenario_type || '—'}</Cell>
                <Cell>{fmtDate(s.created_at)}</Cell>
                <Cell><span style={S.statusText}>{s.is_active ? UI.WS_STATUS_ACTIVE : UI.WS_STATUS_SAVED}</span></Cell>
                <Cell style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link href={`/admin/hearst/simulator?scenario=${s.id}`} style={S.action}>{UI.WS_OPEN_IN_SIMULATOR}</Link>
                  {confirmDel === s.id ? (
                    <span style={S.delActions}>
                      <span style={S.delHint}>{UI.WS_DELETE_CONFIRM(s.name)}</span>
                      <Button variant="dangerSolid" size="sm" disabled={busy === s.id} onClick={() => deleteScenario(s.id)}>
                        {busy === s.id ? '…' : UI.ACTION_DELETE}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDel(null)}>{UI.ACTION_CANCEL}</Button>
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm" disabled={busy === s.id} onClick={() => setConfirmDel(s.id)} style={{ marginLeft: 'var(--cp-space-3)' }}>
                      {UI.ACTION_DELETE}
                    </Button>
                  )}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

const S = {
  section: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' },
  statusText: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', textTransform: 'capitalize' },
  action: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)', fontSize: 'var(--cp-font-sm)', marginLeft: 'var(--cp-space-3)' },
  dossierLink: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)' },
  delActions: { display: 'inline-flex', alignItems: 'center', gap: 'var(--cp-space-2)', marginLeft: 'var(--cp-space-3)', flexWrap: 'wrap', justifyContent: 'flex-end' },
  delHint: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', maxWidth: 220, textAlign: 'right' },
};
