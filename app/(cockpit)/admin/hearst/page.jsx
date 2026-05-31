import { redirect } from 'next/navigation';

// Standalone ORACLE: the Simulator is the single cockpit home (engine entry).
export default function HearstIndex() {
  redirect('/admin/hearst/simulator');
}
