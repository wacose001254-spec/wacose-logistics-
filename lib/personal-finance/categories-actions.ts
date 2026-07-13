'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { categoryBudgetSchema } from '@/lib/validation/personal-finance-schema';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/lib/constants';

// Idempotent: only seeds if this owner has zero categories, so it's safe to
// call on every budget-page load (and from the transfer action, which needs
// the "Salary" category to exist before it can categorize an income row).
export async function ensureDefaultCategories(ownerId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('personal_categories')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId);

  if (count && count > 0) return;

  const rows = [
    ...DEFAULT_INCOME_CATEGORIES.map((name, i) => ({ owner_id: ownerId, name, kind: 'income' as const, sort_order: i })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({ owner_id: ownerId, name, kind: 'expense' as const, sort_order: i })),
  ];
  await supabase.from('personal_categories').insert(rows);
}

export interface CategoryActionState {
  error?: string;
}

export async function updateCategoryBudgetAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const parsed = categoryBudgetSchema.safeParse({
    categoryId: formData.get('categoryId'),
    monthlyBudget: formData.get('monthlyBudget'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter a valid budget amount.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('personal_categories')
    .update({ monthly_budget: parsed.data.monthlyBudget })
    .eq('id', parsed.data.categoryId);

  if (error) {
    return { error: 'Could not update the budget.' };
  }

  revalidatePath('/admin/personal/budget');
  revalidatePath('/admin/personal');
  return {};
}
