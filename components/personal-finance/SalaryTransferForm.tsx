'use client';

import { useActionState } from 'react';
import { recordSalaryTransferAction, type TransferActionState } from '@/lib/personal-finance/transfer-action';

const initialState: TransferActionState = {};

export function SalaryTransferForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(recordSalaryTransferAction, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <div className="space-y-1">
        <label htmlFor="accountId" className="text-sm font-medium">
          To account
        </label>
        <select id="accountId" name="accountId" required className="rounded border px-3 py-2 text-sm">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
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
        <label htmlFor="transferredAt" className="text-sm font-medium">
          Date
        </label>
        <input
          id="transferredAt"
          name="transferredAt"
          type="date"
          defaultValue={today}
          required
          className="rounded border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="note" className="text-sm font-medium">
          Note
        </label>
        <input id="note" name="note" placeholder="e.g. October salary" className="rounded border px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={pending} className="rounded bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50">
        {pending ? 'Recording…' : 'Record transfer'}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
