import { UI } from '@/lib/ui-strings';

export default function DossierExport({ memoId }) {
  return (
    <a
      style={{
        padding: 'var(--cp-space-2) var(--cp-space-4)',
        borderRadius: 'var(--cp-radius-sm)',
        background: 'var(--cp-accent)',
        color: 'var(--cp-text-strong)',
        textDecoration: 'none',
        fontSize: 'var(--cp-font-sm)',
        fontWeight: 'var(--cp-weight-bold)',
        whiteSpace: 'nowrap'
      }}
      href={`/api/admin/hearst/strategic-memos/${memoId}/pdf`}
      target="_blank"
      rel="noreferrer"
    >
      {UI.DOSSIER_BTN_EXPORT_PDF}
    </a>
  );
}
