import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold">WACOSE Logistics</h1>
      <p className="text-gray-600">Book a pickup, track your parcel, and get delivery updates in real time.</p>
      <div className="flex gap-4">
        <Link href="/book" className="rounded bg-black px-5 py-2.5 font-medium text-white">
          Book a pickup
        </Link>
        <Link href="/track" className="rounded border px-5 py-2.5 font-medium">
          Track a parcel
        </Link>
      </div>
    </div>
  );
}
