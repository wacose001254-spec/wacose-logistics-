'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface LoginState {
  error?: string;
}

async function login(
  requiredRoles: readonly string[],
  redirectTo: string,
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: 'Invalid email or password.' };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

  if (!profile || !requiredRoles.includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: 'This account is not authorized for this area.' };
  }

  redirect(redirectTo);
}

export async function loginAdmin(prevState: LoginState, formData: FormData) {
  return login(['admin', 'dispatcher'], '/admin/dashboard', prevState, formData);
}

export async function loginRider(prevState: LoginState, formData: FormData) {
  return login(['rider'], '/rider/deliveries', prevState, formData);
}
