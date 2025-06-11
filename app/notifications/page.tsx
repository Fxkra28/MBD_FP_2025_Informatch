import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import NotificationsClient from './notifications-client';

export default async function NotificationsPage() {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();
    if (!user) { redirect('/login'); }

    const { data: notifications, error } = await (await supabase).from('Notifications').select('*').eq('User_ID', user.id).order('Created_At', { ascending: false });
    if (error) { console.error("Error fetching initial notifications", error); }

    return <NotificationsClient user={user} initialNotifications={notifications || []} />;
}