import Image from 'next/image';
import { signOut } from '@/lib/auth/sign-out-action';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b-4 border-brand-gold p-4">
        <div className="flex items-center gap-2">
          <Image src="/icons/icon-512.png" alt="" width={28} height={28} />
          <span className="font-semibold text-brand-navy">WACOSE Rider</span>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:text-brand-navy hover:underline">
            Sign out
          </button>
        </form>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
