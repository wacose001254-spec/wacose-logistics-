import { signOut } from '@/lib/auth/sign-out-action';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-semibold">WACOSE Rider</span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:underline">
            Sign out
          </button>
        </form>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
