'use client';

import { useActionState } from 'react';
import { updateCategoryBudgetAction, type CategoryActionState } from '@/lib/personal-finance/categories-actions';
import { formatCurrency } from '@/lib/personal-finance/utils';

const initialState: CategoryActionState = {};

export function CategoryBudgetRow({
  categoryId,
  name,
  monthlyBudget,
  spent,
}: {
  categoryId: string;
  name: string;
  monthlyBudget: number;
  spent: number;
}) {
  const [state, formAction, pending] = useActionState(updateCategoryBudgetAction, initialState);
  const remaining = monthlyBudget - spent;
  const percentUsed = monthlyBudget > 0 ? Math.min(100, Math.round((spent / monthlyBudget) * 100)) : 0;

  return (
    <div className="space-y-1 rounded border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{name}</span>
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="categoryId" value={categoryId} />
          <label htmlFor={`budget-${categoryId}`} className="text-xs text-gray-500">
            Budget
          </label>
          <input
            id={`budget-${categoryId}`}
            name="monthlyBudget"
            type="number"
            step="0.01"
            defaultValue={monthlyBudget}
            className="w-24 rounded border px-2 py-1 text-sm"
          />
          <button type="submit" disabled={pending} className="rounded bg-brand-navy px-3 py-1 text-xs font-medium text-white disabled:opacity-50">
            {pending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
        <div
          className={`h-full ${percentUsed >= 100 ? 'bg-red-500' : 'bg-brand-navy'}`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          Spent {formatCurrency(spent)} of {formatCurrency(monthlyBudget)}
        </span>
        <span className={remaining < 0 ? 'text-red-600' : ''}>Remaining {formatCurrency(remaining)}</span>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
