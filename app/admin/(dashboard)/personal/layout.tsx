import Link from 'next/link';

const NAV = [
  { href: '/admin/personal', label: 'Dashboard' },
  { href: '/admin/personal/accounts', label: 'Accounts' },
  { href: '/admin/personal/transfer', label: 'Transfer' },
  { href: '/admin/personal/budget', label: 'Budget' },
];

export default function PersonalFinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Personal Finance</h1>
        <p className="text-sm text-gray-500">
          Separate from business money — only salary / owner&rsquo;s-draw transfers become personal income.
        </p>
      </div>
      <nav className="flex gap-4 border-b pb-2 text-sm">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="text-gray-600 hover:text-brand-navy">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
