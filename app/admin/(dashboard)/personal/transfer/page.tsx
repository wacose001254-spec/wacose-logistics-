import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/personal-finance/utils';
import { SalaryTransferForm } from '@/components/personal-finance/SalaryTransferForm';

export const dynamic = 'force-dynamic';

export default async function PersonalTransferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: accounts }, { data: transfers }] = await Promise.all([
    supabase.from('personal_accounts').select('id, name').eq('owner_id', user.id).eq('is_active', true).order('name'),
    supabase
      .from('personal_salary_transfers')
      .select('id, account_id, amount, note, transferred_at')
      .eq('owner_id', user.id)
      .order('transferred_at', { ascending: false }),
  ]);

  const accountNameById = new Map((accounts ?? []).map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Record money moved from the business into a personal account — salary, owner&rsquo;s draw, or reimbursement.
        This is a manual, attested entry; it isn&rsquo;t validated against a computed business profit figure yet.
      </p>

      {(accounts ?? []).length === 0 ? (
        <p className="text-sm text-gray-500">Add a personal account first before recording a transfer.</p>
      ) : (
        <SalaryTransferForm accounts={accounts ?? []} />
      )}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 font-normal">Date</th>
            <th className="font-normal">To account</th>
            <th className="font-normal">Note</th>
            <th className="text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(transfers ?? []).map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2 text-gray-500">{t.transferred_at}</td>
              <td>{accountNameById.get(t.account_id) ?? 'Unknown'}</td>
              <td>{t.note ?? '—'}</td>
              <td className="text-right text-green-600">{formatCurrency(t.amount)}</td>
            </tr>
          ))}
          {(transfers ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-gray-400">
                No transfers recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
