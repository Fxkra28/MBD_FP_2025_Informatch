'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Mail } from 'lucide-react';

export default function NotificationsClient({ user, initialNotifications }: { user: User, initialNotifications: any[] }) {
    const supabase = createClient();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [message, setMessage] = useState('');

    const fetchNotifications = useCallback(async () => {
        const { data, error } = await supabase.from('Notifications').select('*').eq('User_ID', user.id).order('Created_At', { ascending: false });
        if (error) console.error('Error fetching notifications', error);
        else setNotifications(data || []);
    }, [supabase, user.id]);

    useEffect(() => {
        const channel = supabase.channel('notifications-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'Notifications', filter: `User_ID=eq.${user.id}` }, () => fetchNotifications()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase, fetchNotifications, user.id]);

    const handleRequestResponse = async (notification: any, status: 'accepted' | 'declined') => {
        setMessage('');
        const requestId = notification.Notification_Content.match(/\[(\d+)\]/)?.[1];
        if (!requestId) { setMessage("Could not find request ID in notification."); return; }

        const { error } = await supabase.rpc('update_match_request_status', { request_id_input: parseInt(requestId), new_status: status });
        if (error) { setMessage(`Error: ${error.message}`); } 
        else { setMessage(`Request has been ${status}.`); }
    };

    const markAsRead = async (notificationId: number) => {
        await supabase.from('Notifications').update({ Is_Read: true }).eq('Notification_ID', notificationId);
    };
    
    return (
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 px-4">Your Notifications</h1>
            {message && <p className="p-4 text-center font-medium text-indigo-600">{message}</p>}
            <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6">
                <ul role="list" className="divide-y divide-gray-200">
                    {notifications.length > 0 ? notifications.map((notification) => (
                        <li key={notification.Notification_ID} className={`${!notification.Is_Read ? 'bg-indigo-50' : 'bg-white'}`}>
                            <div className="p-4 hover:bg-gray-50 flex items-center space-x-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{notification.Notification_Content.replace(/\[\d+\]/, '').trim()}</p>
                                    <p className="text-sm text-gray-500 truncate">{formatDistanceToNow(new Date(notification.Created_At))} ago</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {notification.Notification_Type === 'match_request' && (
                                        <>
                                            <button onClick={() => handleRequestResponse(notification, 'accepted')} className="p-2 text-sm font-semibold text-green-700 bg-green-100 rounded-full hover:bg-green-200"><Check className="h-4 w-4" /></button>
                                            <button onClick={() => handleRequestResponse(notification, 'declined')} className="p-2 text-sm font-semibold text-red-700 bg-red-100 rounded-full hover:bg-red-200"><X className="h-4 w-4" /></button>
                                        </>
                                    )}
                                    {!notification.Is_Read && (<button onClick={() => markAsRead(notification.Notification_ID)} className="p-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"><Mail className="h-4 w-4" /></button>)}
                                </div>
                            </div>
                        </li>
                    )) : (<p className="text-center p-8 text-gray-500">You have no notifications.</p>)}
                </ul>
            </div>
        </div>
    );
}