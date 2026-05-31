import { redirect } from 'next/navigation';

// Standalone ORACLE: the product is the engine → scenario → report → history.
// Root redirects into the cockpit (middleware gates auth → /admin/login).
export default function Home() {
  redirect('/admin/hearst/simulator');
}
