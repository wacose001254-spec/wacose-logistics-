import { TrackLookupForm } from '@/components/tracking/TrackLookupForm';

export default async function TrackLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-semibold">Track your parcel</h1>
      <TrackLookupForm defaultCode={code} />
    </div>
  );
}
