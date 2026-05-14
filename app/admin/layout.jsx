import { headers } from 'next/headers';
import { getSessionProfile } from '@/lib/supabase-server';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Futur One × MISA · Admin',
};

const PUBLIC_PATHS = ['/admin/login', '/admin/auth/callback'];

export default async function AdminLayout({ children }) {
  const h = headers();
  const path = h.get('x-invoke-path') || h.get('next-url') || '';
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));
  const session = isPublic ? null : await getSessionProfile();

  if (isPublic || !session?.profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg-main)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <AdminSidebar me={session.profile} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
