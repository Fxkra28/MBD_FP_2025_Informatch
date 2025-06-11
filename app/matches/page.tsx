import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import MatchesClient from './matches-client';

export default async function MatchesPage() {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) { redirect('/login'); }

    const { data: matches, error } = await (await supabase).rpc('get_my_matches', { current_user_id: user.id });
    if (error) { console.error("Error fetching initial matches", error); }

    return <MatchesClient initialMatches={matches || []} />;
}