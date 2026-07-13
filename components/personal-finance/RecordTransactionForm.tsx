'use client';

import { useActionState } from 'react';
import { recordTransactionAction, type TransactionActionState } from '@/lib/personal-finance/transactions-actions';
import { PERSONAL_TRANSACTION_TYPES } from '@/lib/constants';

const initialState: TransactionActionState = {};

interface Category {
  id: string;
  name: string;
  kind: 'income' | 'expense';
}

export function RecordTransactionForm({ accountId, categories }: { accountId: string; categories: Category[] }) {
  const [state, formAction, pending] = useActionState(recordTransactionAction, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <input type="hidden" name="accountId" value={accountId} />
      <div className="space-y-1">
        <label htmlFor="type" className="text-sm font-medium">
          Type
        </label>
        <select id="type" name="type" required className="rounded border px-3 py-2 text-sm">
          {PERSONAL_TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Category
        </label>
        <select id="categoryId" name="categoryId" className="rounded border px-3 py-2 text-sm">
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="amount" className="text-sm font-medium">
          Amount
        </label>
        <input id="amount" name="amount" type="number" step="0.01" required className="w-32 rounded border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label htmlFor="occurredAt" className="text-sm font-medium">
          Date
        </label>
        <input id="occurredAt" name="occurredAt" type="date" defaultValue={today} required className="rounded border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <input id="description" name="description" placeholder="optional" className="rounded border px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={pending} className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? 'Saving…' : 'Record transaction'}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
