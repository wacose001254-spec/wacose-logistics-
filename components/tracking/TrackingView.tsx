'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { LatLng } from './LiveMap';
import { StatusTimeline, type TimelineEvent } from './StatusTimeline';

// Leaflet touches `window`/`document` at module scope, so it can't be
// server-rendered — ssr:false is only usable from a client-component
// boundary, which this file already is.
const LiveMap = dynamic(() => import('./LiveMap').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded bg-gray-100" />,
});

const POLL_INTERVAL_MS = 10_000;

interface TrackingData {
  status: string;
  pickup: LatLng | null;
  dropoff: LatLng | null;
  riderPosition: LatLng | null;
  events: TimelineEvent[];
}

export function TrackingView({ bookingCode, initialData }: { bookingCode: string; initialData: TrackingData }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (data.status === 'delivered' || data.status === 'cancelled') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tracking/${bookingCode}`);
        if (res.ok) setData(await res.json());
      } catch {
        // transient network error — next interval tick will retry
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [bookingCode, data.status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{bookingCode}</h1>
        <span className="rounded bg-gray-100 px-3 py-1 text-sm font-medium">{data.status}</span>
      </div>
      <LiveMap riderPosition={data.riderPosition} pickup={data.pickup} dropoff={data.dropoff} />
      <StatusTimeline events={data.events} />
    </div>
  );
}
