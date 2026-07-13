'use client';

import { useActionState } from 'react';
import { addAccountAction, type AccountActionState } from '@/lib/personal-finance/accounts-actions';
import { PERSONAL_ACCOUNT_TYPES } from '@/lib/constants';

const initialState: AccountActionState = {};

export function AddAccountForm() {
  const [state, formAction, pending] = useActionState(addAccountAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Account name
        </label>
        <input id="name" name="name" required placeholder="e.g. Loop NCBA" className="rounded border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label htmlFor="accountType" className="text-sm font-medium">
          Type
        </label>
        <select id="accountType" name="accountType" required className="rounded border px-3 py-2 text-sm">
          {PERSONAL_ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="institution" className="text-sm font-medium">
          Institution
        </label>
        <input id="institution" name="institution" placeholder="optional" className="rounded border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label htmlFor="openingBalance" className="text-sm font-medium">
          Opening balance
        </label>
        <input
          id="openingBalance"
          name="openingBalance"
          type="number"
          step="0.01"
          defaultValue={0}
          className="w-32 rounded border px-3 py-2 text-sm"
        />
      </div>
      <button type="submit" disabled={pending} className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? 'Adding…' : 'Add account'}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
