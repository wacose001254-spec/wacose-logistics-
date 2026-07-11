'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface SignaturePadHandle {
  getDataUrl(): string | null;
  clear(): void;
  isEmpty(): boolean;
}

function pointerPos(canvas: HTMLCanvasElement, e: React.PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

export const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      hasDrawnRef.current = false;
    }
  }

  useImperativeHandle(ref, () => ({
    getDataUrl: () => (hasDrawnRef.current ? canvasRef.current?.toDataURL('image/png') ?? null : null),
    isEmpty: () => !hasDrawnRef.current,
    clear: clearCanvas,
  }));

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={160}
        className="w-full touch-none rounded border bg-white"
        onPointerDown={(e) => {
          drawingRef.current = true;
          const ctx = canvasRef.current!.getContext('2d')!;
          const { x, y } = pointerPos(canvasRef.current!, e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawingRef.current) return;
          const ctx = canvasRef.current!.getContext('2d')!;
          const { x, y } = pointerPos(canvasRef.current!, e);
          ctx.lineTo(x, y);
          ctx.stroke();
          hasDrawnRef.current = true;
        }}
        onPointerUp={() => (drawingRef.current = false)}
        onPointerLeave={() => (drawingRef.current = false)}
      />
      <button type="button" onClick={clearCanvas} className="text-xs text-gray-500 underline">
        Clear signature
      </button>
    </div>
  );
});
