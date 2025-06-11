import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profiles, error } = await (await supabase).rpc('get_match_suggestions', { current_user_id: user.id });
    if (error) { console.error("Error fetching initial profiles", error); }
    
    return <DashboardClient user={user} initialProfiles={profiles || []} />;
}