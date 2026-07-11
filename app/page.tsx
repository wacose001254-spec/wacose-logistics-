import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <Image src="/logo-full.png" alt="WACOSE Logistics" width={220} height={220} priority />
      <p className="text-gray-600">Book a pickup, track your parcel, and get delivery updates in real time.</p>
      <div className="flex gap-4">
        <Link href="/book" className="rounded bg-brand-navy px-5 py-2.5 font-medium text-white hover:bg-brand-navy-dark">
          Book a pickup
        </Link>
        <Link href="/track" className="rounded border border-brand-navy px-5 py-2.5 font-medium text-brand-navy">
          Track a parcel
        </Link>
      </div>
    </div>
  );
}
