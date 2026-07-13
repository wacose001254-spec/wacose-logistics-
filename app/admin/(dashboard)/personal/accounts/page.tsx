import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { computeAccountBalance, formatCurrency } from '@/lib/personal-finance/utils';
import { AddAccountForm } from '@/components/personal-finance/AddAccountForm';

export const dynamic = 'force-dynamic';

export default async function PersonalAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    supabase
      .from('personal_accounts')
      .select('id, name, account_type, institution, opening_balance, is_active')
      .eq('owner_id', user.id)
      .order('created_at'),
    supabase.from('personal_transactions').select('account_id, type, amount').eq('owner_id', user.id),
  ]);

  const txByAccount = new Map<string, NonNullable<typeof transactions>>();
  for (const t of transactions ?? []) {
    const list = txByAccount.get(t.account_id) ?? [];
    list.push(t);
    txByAccount.set(t.account_id, list);
  }

  return (
    <div className="space-y-6">
      <AddAccountForm />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(accounts ?? []).map((account) => {
          const balance = computeAccountBalance(account.opening_balance, txByAccount.get(account.id) ?? []);
          return (
            <Link
              key={account.id}
              href={`/admin/personal/accounts/${account.id}`}
              className="rounded border p-4 hover:border-brand-navy"
            >
              <p className="text-sm capitalize text-gray-500">
                {account.account_type.replace('_', ' ')}
                {account.institution ? ` · ${account.institution}` : ''}
              </p>
              <p className="font-semibold">{account.name}</p>
              <p className="mt-2 text-xl font-semibold">{formatCurrency(balance)}</p>
              {!account.is_active && <p className="text-xs text-gray-400">Inactive</p>}
            </Link>
          );
        })}
        {(accounts ?? []).length === 0 && <p className="text-sm text-gray-500">No accounts yet — add one above.</p>}
      </div>
    </div>
  );
}
