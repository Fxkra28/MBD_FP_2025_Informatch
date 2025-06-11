import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = createClient();
  const { data: { session } } = await (await supabase).auth.getSession();
  if (session) { redirect('/dashboard'); }
  return (
    <div className="text-center max-w-7xl mx-auto py-20 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">Welcome to <span className="text-indigo-600">Informatch</span></h1>
      <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">Connect with friends who share your passions.</p>
    </div>
  );
}