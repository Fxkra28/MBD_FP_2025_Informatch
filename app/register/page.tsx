import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import RegisterForm from './register-form';

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) { redirect('/dashboard'); }
  return <RegisterForm />;
}