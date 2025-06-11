import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileClient from './edit-profile-client';

export default async function EditProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) { redirect('/login'); }

    const { data: profile } = await (await supabase).from('Profiles').select('*').eq('User_ID', user.id).single();
    const { data: userData } = await (await supabase).from('Users').select('User_priset_is_private').eq('User_ID', user.id).single();
    
    return <EditProfileClient user={user} initialProfile={profile} initialIsPrivate={userData?.User_priset_is_private || false} />;
}