'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { accountSchema } from '@/lib/validation/personal-finance-schema';
import type { PersonalAccountType } from '@/lib/constants';

export interface AccountActionState {
  error?: string;
}

export async function addAccountAction(_prevState: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const parsed = accountSchema.safeParse({
    name: formData.get('name'),
    accountType: formData.get('accountType'),
    institution: formData.get('institution') || undefined,
    openingBalance: formData.get('openingBalance') || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const { error } = await supabase.from('personal_accounts').insert({
    owner_id: user.id,
    name: parsed.data.name,
    account_type: parsed.data.accountType as PersonalAccountType,
    institution: parsed.data.institution ?? null,
    opening_balance: parsed.data.openingBalance,
  });

  if (error) {
    return { error: 'Could not add account. Please try again.' };
  }

  revalidatePath('/admin/personal/accounts');
  revalidatePath('/admin/personal');
  return {};
}
