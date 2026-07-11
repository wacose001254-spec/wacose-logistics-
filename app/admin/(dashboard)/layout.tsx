import Link from 'next/link';
import { signOut } from '@/lib/auth/sign-out-action';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/fleet', label: 'Fleet' },
  { href: '/admin/riders', label: 'Riders' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r p-4">
        <div className="mb-6 font-semibold">WACOSE Admin</div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded px-2 py-1.5 text-sm hover:bg-gray-100">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="mt-8">
          <button type="submit" className="text-sm text-gray-500 hover:underline">
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
