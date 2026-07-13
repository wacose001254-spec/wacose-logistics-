import { createClient } from '@/lib/supabase/server';
import { ensureDefaultCategories } from '@/lib/personal-finance/categories-actions';
import { getCurrentMonthRange } from '@/lib/personal-finance/utils';
import { CategoryBudgetRow } from '@/components/personal-finance/CategoryBudgetRow';

export const dynamic = 'force-dynamic';

export default async function PersonalBudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureDefaultCategories(user.id);

  const { start, end } = getCurrentMonthRange();

  const [{ data: categories }, { data: monthExpenses }] = await Promise.all([
    supabase
      .from('personal_categories')
      .select('id, name, kind, monthly_budget')
      .eq('owner_id', user.id)
      .eq('kind', 'expense')
      .order('sort_order'),
    supabase
      .from('personal_transactions')
      .select('category_id, amount')
      .eq('owner_id', user.id)
      .eq('type', 'expense')
      .gte('occurred_at', start)
      .lt('occurred_at', end),
  ]);

  const spentByCategory = new Map<string, number>();
  for (const t of monthExpenses ?? []) {
    if (!t.category_id) continue;
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + t.amount);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Monthly budgets by category. Spent is calculated from this month&rsquo;s recorded expenses.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(categories ?? []).map((c) => (
          <CategoryBudgetRow
            key={c.id}
            categoryId={c.id}
            name={c.name}
            monthlyBudget={c.monthly_budget}
            spent={spentByCategory.get(c.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
