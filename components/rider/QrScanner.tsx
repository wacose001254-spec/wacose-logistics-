'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const ELEMENT_ID = 'qr-scanner-region';

export function QrScanner({ onScan, onError }: { onScan: (value: string) => void; onError?: (msg: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (!stopped) onScan(decodedText);
        },
        () => {
          // per-frame "no QR found" callback — expected most frames, not an error
        }
      )
      .catch((err) => onError?.(err instanceof Error ? err.message : 'Could not access camera'));

    return () => {
      stopped = true;
      scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={ELEMENT_ID} className="mx-auto w-full max-w-xs overflow-hidden rounded" />;
}
