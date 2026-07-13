import type { Database } from '@/lib/supabase/types';

type Transaction = Database['public']['Tables']['personal_transactions']['Row'];

export function formatCurrency(amount: number) {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// income/transfer_in add to a balance; expense/transfer_out subtract.
export function signedAmount(transaction: Pick<Transaction, 'type' | 'amount'>) {
  return transaction.type === 'income' || transaction.type === 'transfer_in'
    ? transaction.amount
    : -transaction.amount;
}

export function computeAccountBalance(openingBalance: number, transactions: Pick<Transaction, 'type' | 'amount'>[]) {
  return transactions.reduce((total, t) => total + signedAmount(t), openingBalance);
}

// Plain date-math helper (not a hook/component body), so the once-per-call
// `new Date()` read here doesn't trip the react-hooks/purity rule.
export function getCurrentMonthRange(reference: Date = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
