import { headers } from 'next/headers';
import { getSessionProfile } from '@/lib/supabase-server';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Futur One × MISA · Admin',
};

const PUBLIC_PATHS = ['/admin/login', '/admin/auth/callback'];

export default async function AdminLayout({ children }) {
  // The pathname is exposed via the `x-invoke-path` header in dev/prod
  // (Next.js 14). We fall back to URL parsing if it isn't there.
  const h = headers();
  const path = h.get('x-invoke-path') || h.get('next-url') || '';
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));
  const session = isPublic ? null : await getSessionProfile();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
      {!isPublic && session?.profile && <AdminNav me={session.profile} />}
      {children}
    </div>
  );
}
