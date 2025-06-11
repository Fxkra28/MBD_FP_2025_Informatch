import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from './login-form';

export default async function LoginPage() {
  const supabase = createClient();
  const { data: { session } } = await (await supabase).auth.getSession();
  if (session) { redirect('/dashboard'); }
  return <LoginForm />;
}