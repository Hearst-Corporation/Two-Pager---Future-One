import { redirect } from 'next/navigation';

// /admin/hearst is NOT its own dashboard. Executive is the single canonical
// cockpit home (ORACLE_HOME). Having a separate "Brief" board here created two
// competing dashboards — landing on /admin/hearst showed Brief while the
// "Executive" nav tab appeared selected yet pointed to a different screen.
// Redirect so there is exactly ONE home and the nav is coherent.
export default function HearstIndex() {
  redirect('/admin/hearst/executive');
}
