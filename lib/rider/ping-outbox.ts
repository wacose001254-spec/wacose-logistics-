'use client';

// Riders move through dead zones, so pings are written to localStorage first
// and flushed opportunistically — a failed fetch never loses a ping, it just
// waits for the next flush attempt (interval or `online` event).
const STORAGE_KEY = 'wacose_ping_outbox';
const MAX_QUEUE_SIZE = 500; // bound growth if a rider is offline for a long stretch

export interface QueuedPing {
  bookingId: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: string;
}

function readQueue(): QueuedPing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedPing[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // localStorage full/unavailable — drop silently rather than throw during a GPS callback.
  }
}

export function enqueuePing(ping: QueuedPing) {
  const queue = readQueue();
  queue.push(ping);
  writeQueue(queue);
}

let flushing = false;

export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  flushing = true;

  try {
    let queue = readQueue();
    while (queue.length > 0) {
      const next = queue[0];
      try {
        const res = await fetch('/api/pings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) break; // stop and retry later rather than dropping the ping
        queue = queue.slice(1);
        writeQueue(queue);
      } catch {
        break; // offline — leave the queue intact for the next flush attempt
      }
    }
  } finally {
    flushing = false;
  }
}

export function startOutboxFlusher(intervalMs = 10_000): () => void {
  const interval = setInterval(flushOutbox, intervalMs);
  const onOnline = () => flushOutbox();
  window.addEventListener('online', onOnline);
  flushOutbox();

  return () => {
    clearInterval(interval);
    window.removeEventListener('online', onOnline);
  };
}
