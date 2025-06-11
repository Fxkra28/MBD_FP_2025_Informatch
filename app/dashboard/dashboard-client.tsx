'use client';
import { useState, useCallback } from 'react';
import { Send, UserX } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function DashboardClient({ user, initialProfiles }: { user: User, initialProfiles: any[] }) {
    const supabase = createClient();
    const [profiles, setProfiles] = useState(initialProfiles);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_match_suggestions', { current_user_id: user.id });
        if (error) { setMessage('Could not fetch profiles.'); } 
        else { setProfiles(data || []); }
        setLoading(false);
    }, [supabase, user.id]);

    const handleAction = async (actionType: 'connect' | 'block', receiverId: string) => {
        setMessage('');
        const rpcName = actionType === 'connect' ? 'create_match_or_request' : 'block_user';
        const params = actionType === 'connect' ? { requester_id: user.id, receiver_id: receiverId } : { blocker_id: user.id, blocked_id: receiverId };
        const { data, error } = await supabase.rpc(rpcName, params);
        if (error) {
            setMessage(error.message);
        } else {
            setMessage(data as string);
            fetchProfiles(); // Refetch after action
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 px-4">Find New Friends</h1>
            {message && <p className="text-center p-4 font-medium text-indigo-600">{message}</p>}
            {loading ? <p className="text-center p-8">Refreshing...</p> : 
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
                    {profiles.map(profile => (
                        <div key={profile.profile_id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                            <img className="h-48 w-full object-cover" src={profile.profile_picture_url || 'https://placehold.co/400x300/E0E7FF/4F46E5?text=No+Image'} alt={profile.profile_username} />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900">{profile.profile_username}</h3>
                                <p className="text-sm text-gray-600 mt-1">Interests: {profile.profile_non_academic_interes || 'Not specified'}</p>
                                <p className="text-sm text-gray-500 mt-2 h-10 line-clamp-2">{profile.profile_bio || 'No bio yet.'}</p>
                                <div className="mt-4 flex space-x-2">
                                    <button onClick={() => handleAction('connect', profile.users_user_id)} className="flex-1 inline-flex items-center justify-center bg-indigo-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-indigo-700"><Send className="h-4 w-4 mr-2" /> Connect</button>
                                    <button onClick={() => handleAction('block', profile.users_user_id)} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><UserX className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            }
            {profiles.length === 0 && !loading && (<p className="text-center p-8 text-gray-500">No new suggestions right now.</p>)}
        </div>
    );
}