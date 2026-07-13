'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { salaryTransferSchema } from '@/lib/validation/personal-finance-schema';
import { ensureDefaultCategories } from '@/lib/personal-finance/categories-actions';

export interface TransferActionState {
  error?: string;
}

// Phase 1: a manual, attested transfer — the owner records that money moved
// from the business to a personal account. There's no business expense/profit
// tracking yet to validate the amount against, so this is trust-based by
// design (see the plan's "explicitly out of scope" section).
export async function recordSalaryTransferAction(
  _prevState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  const parsed = salaryTransferSchema.safeParse({
    accountId: formData.get('accountId'),
    amount: formData.get('amount'),
    note: formData.get('note') || undefined,
    transferredAt: formData.get('transferredAt'),
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

  await ensureDefaultCategories(user.id);

  const { data: salaryCategory } = await supabase
    .from('personal_categories')
    .select('id')
    .eq('owner_id', user.id)
    .eq('name', 'Salary')
    .eq('kind', 'income')
    .maybeSingle();

  const { data: transaction, error: transactionError } = await supabase
    .from('personal_transactions')
    .insert({
      owner_id: user.id,
      account_id: parsed.data.accountId,
      category_id: salaryCategory?.id ?? null,
      type: 'income',
      amount: parsed.data.amount,
      description: parsed.data.note ? `Salary transfer — ${parsed.data.note}` : 'Salary transfer',
      occurred_at: parsed.data.transferredAt,
    })
    .select('id')
    .single();

  if (transactionError || !transaction) {
    return { error: 'Could not record the transfer. Please try again.' };
  }

  const { error: transferError } = await supabase.from('personal_salary_transfers').insert({
    owner_id: user.id,
    account_id: parsed.data.accountId,
    transaction_id: transaction.id,
    amount: parsed.data.amount,
    note: parsed.data.note ?? null,
    transferred_at: parsed.data.transferredAt,
  });

  if (transferError) {
    // The income transaction already landed — only the transfer-log entry
    // failed to save, so say so rather than implying nothing happened.
    return { error: 'Transfer recorded as income, but the transfer log entry failed to save.' };
  }

  revalidatePath('/admin/personal', 'layout');
  return {};
}
