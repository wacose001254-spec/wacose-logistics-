import { createClient } from '@/lib/supabase/server';
import { computeAccountBalance, formatCurrency, getCurrentMonthRange } from '@/lib/personal-finance/utils';
import { CashFlowChart } from '@/components/personal-finance/CashFlowChart';

// Balances and this-month totals are computed from live transaction data on
// every request, so this page must never be statically prerendered.
export const dynamic = 'force-dynamic';

export default async function PersonalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: accounts }, { data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('personal_accounts')
      .select('id, name, account_type, opening_balance, is_active')
      .eq('owner_id', user.id)
      .eq('is_active', true),
    supabase
      .from('personal_transactions')
      .select('id, account_id, category_id, type, amount, description, occurred_at')
      .eq('owner_id', user.id)
      .order('occurred_at', { ascending: false }),
    supabase.from('personal_categories').select('id, name, kind').eq('owner_id', user.id),
  ]);

  const accountList = accounts ?? [];
  const allTransactions = transactions ?? [];
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const totalBalance = accountList.reduce((sum, account) => {
    const accountTx = allTransactions.filter((t) => t.account_id === account.id);
    return sum + computeAccountBalance(account.opening_balance, accountTx);
  }, 0);

  const { start, end } = getCurrentMonthRange();
  const monthTransactions = allTransactions.filter((t) => t.occurred_at >= start && t.occurred_at < end);

  const income = monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savings = monthTransactions
    .filter((t) => t.type === 'expense' && categoryNameById.get(t.category_id ?? '') === 'Savings')
    .reduce((sum, t) => sum + t.amount, 0);
  const debtPayments = monthTransactions
    .filter((t) => t.type === 'expense' && categoryNameById.get(t.category_id ?? '') === 'Debt Payments')
    .reduce((sum, t) => sum + t.amount, 0);
  const remaining = income - expenses;

  const spendingByCategory = new Map<string, number>();
  for (const t of monthTransactions) {
    if (t.type !== 'expense') continue;
    const name = categoryNameById.get(t.category_id ?? '') ?? 'Uncategorized';
    spendingByCategory.set(name, (spendingByCategory.get(name) ?? 0) + t.amount);
  }

  const recent = allTransactions.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total balance (accounts)" value={formatCurrency(totalBalance)} />
        <StatCard label="Income this month" value={formatCurrency(income)} tone="text-green-600" />
        <StatCard label="Expenses this month" value={formatCurrency(expenses)} tone="text-red-600" />
        <StatCard label="Remaining" value={formatCurrency(remaining)} tone={remaining >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Cash flow — this month</h2>
        <CashFlowChart
          data={[
            { stage: 'Income', amount: income },
            { stage: 'Expenses', amount: expenses },
            { stage: 'Savings', amount: savings },
            { stage: 'Debt', amount: debtPayments },
            { stage: 'Remaining', amount: remaining },
          ]}
        />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Spending by category — this month</h2>
        <table className="w-full max-w-md text-left text-sm">
          <tbody>
            {Array.from(spendingByCategory.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([name, amount]) => (
                <tr key={name} className="border-b">
                  <td className="py-2">{name}</td>
                  <td className="py-2 text-right">{formatCurrency(amount)}</td>
                </tr>
              ))}
            {spendingByCategory.size === 0 && (
              <tr>
                <td className="py-4 text-gray-400">No expenses recorded yet this month.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Recent transactions</h2>
        <table className="w-full text-left text-sm">
          <tbody>
            {recent.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2 text-gray-500">{t.occurred_at}</td>
                <td className="capitalize">{t.type.replace('_', ' ')}</td>
                <td>{categoryNameById.get(t.category_id ?? '') ?? '—'}</td>
                <td>{t.description ?? '—'}</td>
                <td
                  className={`py-2 text-right ${
                    t.type === 'income' || t.type === 'transfer_in' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {t.type === 'income' || t.type === 'transfer_in' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td className="py-4 text-gray-400">No transactions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {accountList.length === 0 && (
        <p className="text-sm text-gray-500">
          No accounts yet — head to the Accounts tab to add your first wallet.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${tone ?? ''}`}>{value}</p>
    </div>
  );
}
