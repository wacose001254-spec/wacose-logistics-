'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { transactionSchema } from '@/lib/validation/personal-finance-schema';
import type { PersonalTransactionType } from '@/lib/constants';

export interface TransactionActionState {
  error?: string;
}

export async function recordTransactionAction(
  _prevState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const parsed = transactionSchema.safeParse({
    accountId: formData.get('accountId'),
    categoryId: formData.get('categoryId') || undefined,
    type: formData.get('type'),
    amount: formData.get('amount'),
    description: formData.get('description') || undefined,
    occurredAt: formData.get('occurredAt'),
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

  const { error } = await supabase.from('personal_transactions').insert({
    owner_id: user.id,
    account_id: parsed.data.accountId,
    category_id: parsed.data.categoryId ?? null,
    type: parsed.data.type as PersonalTransactionType,
    amount: parsed.data.amount,
    description: parsed.data.description ?? null,
    occurred_at: parsed.data.occurredAt,
  });

  if (error) {
    return { error: 'Could not record the transaction. Please try again.' };
  }

  revalidatePath('/admin/personal', 'layout');
  return {};
}
