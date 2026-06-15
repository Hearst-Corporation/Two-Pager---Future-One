import { redirect } from 'next/navigation';

// Standalone ORACLE: root → brief home (middleware gates auth → /admin/login).
export default function Home() {
  redirect('/admin/hearst');
}
