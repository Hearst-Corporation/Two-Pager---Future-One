import { headers } from 'next/headers';
import { getSessionProfile } from '@/lib/supabase-server';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Futur One × MISA · Admin',
};

const PUBLIC_PATHS = ['/admin/login', '/admin/auth/callback'];

export default async function AdminLayout({ children }) {
  const h = headers();
  const path = h.get('x-pathname') || '';
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));
  const isHearst = path.startsWith('/admin/hearst') || path.startsWith('/admin/cockpit-template');
  const session = isPublic ? null : await getSessionProfile();

  if (isPublic || !session?.profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
        {children}
      </div>
    );
  }

  // HEARST module runs full-width without the white admin sidebar
  if (isHearst) {
    return (
      <div
        style={{
          height: '100dvh',
          background: 'var(--cp-bg-deep)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
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
