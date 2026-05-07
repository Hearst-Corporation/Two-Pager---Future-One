export const metadata = {
  title: 'Futur One × MISA · Admin',
};

export default function AdminLayout({ children }) {
  return <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>{children}</div>;
}
