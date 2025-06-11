'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setMessage('');
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    if (error) { setError(error.message); }
    else { setMessage('Registration successful! Please check your email to verify your account.'); }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
         <div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2></div>
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm space-y-4">
              <input id="email-address" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Email address" />
              <input id="password" name="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Password (min. 6 characters)" />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            {message && <p className="text-green-600 text-sm font-medium">{message}</p>}
            <div><button type="submit" disabled={loading} className="group w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">{loading ? 'Registering...' : 'Register'}</button></div>
          </form>
      </div>
    </div>
  );
}