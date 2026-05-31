import { redirect } from 'next/navigation';

// CRM removed — /admin lands on the cockpit Simulator (engine entry).
export default function AdminHome() {
  redirect('/admin/hearst/simulator');
}
