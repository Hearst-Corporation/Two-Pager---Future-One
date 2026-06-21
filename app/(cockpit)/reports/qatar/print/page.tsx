import { lora, interMemo } from '../_fonts';
import { QatarReport } from '../report-view';

export const metadata = {
  title: 'Qatar Investment Memorandum — Print / Export',
  robots: { index: false, follow: false },
};

// Print/export-optimized variant (A4 landscape, one section per page).
export const dynamic = 'force-static';

export default function QatarReportPrintPage() {
  return <QatarReport print fontClass={`${lora.variable} ${interMemo.variable}`} />;
}
