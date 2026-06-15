import { UI } from '@/lib/ui-strings';
import { Button } from '@/components/hearst/ui';

export default function DossierExport({ memoId }) {
  return (
    <Button
      variant="primary"
      size="sm"
      href={`/api/admin/hearst/strategic-memos/${memoId}/pdf`}
      target="_blank"
      rel="noreferrer"
    >
      {UI.DOSSIER_BTN_EXPORT_PDF}
    </Button>
  );
}
