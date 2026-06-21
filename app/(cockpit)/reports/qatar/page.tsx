import { lora, interMemo } from './_fonts';
import { QatarReport } from './report-view';

export const metadata = {
  title: 'Qatar Sovereign Data Center Platform — Investment Memorandum',
  robots: { index: false, follow: false },
};

// Fully static, deterministic report — no data fetching, no legacy engine.
export const dynamic = 'force-static';

export default function QatarReportPage() {
  return <QatarReport fontClass={`${lora.variable} ${interMemo.variable}`} />;
}
