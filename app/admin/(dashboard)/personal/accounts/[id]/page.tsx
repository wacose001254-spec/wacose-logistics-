import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { computeAccountBalance, formatCurrency } from '@/lib/personal-finance/utils';
import { RecordTransactionForm } from '@/components/personal-finance/RecordTransactionForm';

export const dynamic = 'force-dynamic';

export default async function PersonalAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: account }, { data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('personal_accounts')
      .select('id, name, account_type, institution, opening_balance')
      .eq('id', id)
      .eq('owner_id', user.id)
      .maybeSingle(),
    supabase
      .from('personal_transactions')
      .select('id, type, amount, description, occurred_at, category_id')
      .eq('account_id', id)
      .eq('owner_id', user.id)
      .order('occurred_at', { ascending: false }),
    supabase.from('personal_categories').select('id, name, kind').eq('owner_id', user.id).order('sort_order'),
  ]);

  if (!account) notFound();

  const balance = computeAccountBalance(account.opening_balance, transactions ?? []);
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm capitalize text-gray-500">
          {account.account_type.replace('_', ' ')}
          {account.institution ? ` · ${account.institution}` : ''}
        </p>
        <h2 className="text-lg font-semibold">{account.name}</h2>
        <p className="text-2xl font-semibold">{formatCurrency(balance)}</p>
      </div>

      <RecordTransactionForm accountId={account.id} categories={categories ?? []} />

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 font-normal">Date</th>
            <th className="font-normal">Type</th>
            <th className="font-normal">Category</th>
            <th className="font-normal">Description</th>
            <th className="text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(transactions ?? []).map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2 text-gray-500">{t.occurred_at}</td>
              <td className="capitalize">{t.type.replace('_', ' ')}</td>
              <td>{categoryNameById.get(t.category_id ?? '') ?? '—'}</td>
              <td>{t.description ?? '—'}</td>
              <td
                className={`text-right ${
                  t.type === 'income' || t.type === 'transfer_in' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {t.type === 'income' || t.type === 'transfer_in' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </td>
            </tr>
          ))}
          {(transactions ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-gray-400">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
