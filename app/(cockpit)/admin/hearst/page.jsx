import { redirect } from 'next/navigation';

// Direct entry: /admin/hearst opens the model immediately.
export default function HearstEntryPage() {
  redirect('/admin/hearst/simulator');
}
