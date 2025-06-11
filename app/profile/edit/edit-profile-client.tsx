'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UploadCloud } from 'lucide-react';

export default function EditProfileClient({ user, initialProfile, initialIsPrivate }: { user: User, initialProfile: any, initialIsPrivate: boolean }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState(initialProfile);
    const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.Profile_Picture_URL);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => setIsPrivate(e.target.checked);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) throw new Error('You must select an image to upload.');
            const file = event.target.files[0];
            const filePath = `${user.id}-${Date.now()}`;
            let { error: uploadError } = await supabase.storage.from('profile-pictures').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error: profileError } = await supabase.from('Profiles').update({ ...profile, Profile_Picture_URL: avatarUrl }).eq('User_ID', user.id);
        const { error: userError } = await supabase.from('Users').update({ User_priset_is_private: isPrivate }).eq('User_ID', user.id);
        if (profileError || userError) alert('Error: ' + (profileError?.message || userError?.message));
        else alert('Profile updated successfully!');
        setLoading(false);
    };
    
    return (
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 px-4">Edit Your Profile</h1>
            <form onSubmit={handleSubmit} className="mt-8 bg-white p-8 rounded-lg shadow-lg space-y-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                    <div className="mt-2 flex items-center space-x-6">
                        <img src={avatarUrl || 'https://placehold.co/150/E0E7FF/4F46E5?text=Avatar'} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
                        <label htmlFor="avatar-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"><UploadCloud className="inline-block h-5 w-5 mr-2" /><span>{uploading ? 'Uploading...' : 'Upload'}</span><input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" onChange={uploadAvatar} disabled={uploading} accept="image/*" /></label>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="Profile_Username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="Profile_Username" id="Profile_Username" value={profile?.Profile_Username || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="Profile_Birthdate" className="block text-sm font-medium text-gray-700">Birthdate</label>
                        <input type="date" name="Profile_Birthdate" id="Profile_Birthdate" value={profile?.Profile_Birthdate || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="Profile_Bio" className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea name="Profile_Bio" id="Profile_Bio" value={profile?.Profile_Bio || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="Profile_Academic_Interes" className="block text-sm font-medium text-gray-700">Academic Interests</label>
                        <input type="text" name="Profile_Academic_Interes" id="Profile_Academic_Interes" value={profile?.Profile_Academic_Interes || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Computer Science" />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="Profile_Non_Academic_Interes" className="block text-sm font-medium text-gray-700">Hobbies & Interests</label>
                        <input type="text" name="Profile_Non_Academic_Interes" id="Profile_Non_Academic_Interes" value={profile?.Profile_Non_Academic_Interes || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Hiking, Gaming" />
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="Profile_Looking_For" className="block text-sm font-medium text-gray-700">Looking for</label>
                        <input type="text" name="Profile_Looking_For" id="Profile_Looking_For" value={profile?.Profile_Looking_For || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., A study partner" />
                    </div>
                </div>
                <div className="pt-8">
                   <div className="relative flex items-start">
                        <div className="flex items-center h-5"><input id="privacy" name="privacy" type="checkbox" checked={isPrivate} onChange={handlePrivacyChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" /></div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="privacy" className="font-medium text-gray-700">Private Account</label>
                            <p className="text-gray-500">If checked, others must send you a request to match.</p>
                        </div>
                    </div>
                </div>
                <div className="pt-5">
                    <div className="flex justify-end"><button type="submit" disabled={loading || uploading} className="w-full sm:w-auto flex justify-center py-2 px-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">{loading || uploading ? 'Saving...' : 'Save Changes'}</button></div>
                </div>
            </form>
        </div>
    );
}