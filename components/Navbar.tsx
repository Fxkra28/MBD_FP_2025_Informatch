'use client'; 

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Home, Users, Bell, UserCircle, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const fetchInitialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };
    fetchInitialData();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);
  
  useEffect(() => {
    if (user) {
      const fetchCount = async () => {
        const { count } = await supabase.from('Notifications').select('*', { count: 'exact', head: true }).eq('User_ID', user.id).eq('Is_Read', false);
        setNotificationCount(count ?? 0);
      };
      fetchCount();

      const channel = supabase.channel('public:Notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'Notifications', filter: `User_ID=eq.${user.id}` }, 
          () => fetchCount()
        ).subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ElementType }) => {
    const isActive = pathname === href;
    const Icon = icon;
    return (
      <Link href={href} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
        <Icon className="mr-2 h-5 w-5" />
        {children}
      </Link>
    );
  };
  
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-indigo-600">Informatch</Link>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {user ? (
                <>
                  <NavLink href="/dashboard" icon={Home}>Dashboard</NavLink>
                  <NavLink href="/matches" icon={Users}>Matches</NavLink>
                  <NavLink href="/notifications" icon={Bell}>
                    Notifications 
                    {notificationCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{notificationCount}</span>
                    )}
                  </NavLink>
                  <NavLink href="/profile/edit" icon={UserCircle}>Profile</NavLink>
                  <button onClick={handleSignOut} className="flex items-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                 <>
                  <NavLink href="/login" icon={LogIn}>Login</NavLink>
                  <NavLink href="/register" icon={UserPlus}>Register</NavLink>
                 </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}