'use client';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export default function MatchesClient({ initialMatches }: { initialMatches: any[] }) {
    const [matches] = useState(initialMatches);
    
    return (
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 px-4">Your Matches</h1>
            <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6">
                <ul role="list" className="divide-y divide-gray-200">
                    {matches.length > 0 ? matches.map((match) => (
                        <li key={match.user_id}>
                            <div className="p-4 hover:bg-gray-50 flex items-center space-x-4">
                                <img className="h-12 w-12 rounded-full object-cover" src={match.profile_picture_url || 'https://placehold.co/100/E0E7FF/4F46E5?text=No+Image'} alt={match.username} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{match.username}</p>
                                    <p className="text-sm text-gray-500 truncate">{match.bio}</p>
                                </div>
                                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"><MessageSquare className="h-5 w-5 mr-2" /> Chat</button>
                            </div>
                        </li>
                    )) : (<p className="text-center p-8 text-gray-500">You have no matches yet.</p>)}
                </ul>
            </div>
        </div>
    );
}