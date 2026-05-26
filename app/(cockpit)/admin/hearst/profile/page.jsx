import { getSessionProfile } from '@/lib/supabase-server';
import ProfileView from './ProfileView';

export const dynamic = 'force-dynamic';

export default async function CockpitProfilePage() {
  const session = await getSessionProfile();
  if (!session) return null;
  return <ProfileView me={session.profile} />;
}
