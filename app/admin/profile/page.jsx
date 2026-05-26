import { getSessionProfile } from '@/lib/supabase-server';
import ProfileView from './ProfileView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Futur One × MISA · Profile',
};

export default async function ProfilePage() {
  const session = await getSessionProfile();
  if (!session) return null;
  return <ProfileView me={session.profile} />;
}
