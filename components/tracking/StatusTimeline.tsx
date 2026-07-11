const LABELS: Record<string, string> = {
  created: 'Booking created',
  assigned: 'Rider assigned',
  picked_up: 'Picked up',
  in_transit: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  note: 'Update',
};

export interface TimelineEvent {
  event_type: string;
  note: string | null;
  created_at: string;
}

export function StatusTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-3">
      {events.map((e, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-navy" />
          <div>
            <p className="font-medium">{LABELS[e.event_type] ?? e.event_type}</p>
            <p className="text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
            {e.note && <p className="text-gray-500">{e.note}</p>}
          </div>
        </li>
      ))}
      {events.length === 0 && <p className="text-sm text-gray-400">No updates yet.</p>}
    </ol>
  );
}
