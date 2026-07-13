import Image from 'next/image';
import Link from 'next/link';
import { signOut } from '@/lib/auth/sign-out-action';
import { createClient } from '@/lib/supabase/server';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/fleet', label: 'Fleet' },
  { href: '/admin/riders', label: 'Riders' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    : { data: null };

  // Personal finance is the owner's own money, not a business operations
  // surface — only shown (and only reachable, per proxy.ts) for role='admin',
  // not 'dispatcher'.
  const nav = profile?.role === 'admin' ? [...NAV, { href: '/admin/personal', label: 'Personal Finance' }] : NAV;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r p-4">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/icons/icon-512.png" alt="" width={32} height={32} />
          <span className="font-semibold text-brand-navy">WACOSE Admin</span>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-brand-navy/5 hover:text-brand-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="mt-8">
          <button type="submit" className="text-sm text-gray-500 hover:text-brand-navy hover:underline">
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 border-t-4 border-brand-gold p-6">{children}</main>
    </div>
  );
}
