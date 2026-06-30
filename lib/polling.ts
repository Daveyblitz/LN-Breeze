"use client";

import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  intervalMs?: number;
  onPaid: () => void;
};

export function usePolling(paymentHash: string | null, options: Options) {
  const { enabled, intervalMs = 3000, onPaid } = options;
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    if (!enabled || !paymentHash) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/invoice/status?hash=${paymentHash}`);
        const data = await res.json();
        if (data.paid) {
          onPaidRef.current();
          clearInterval(id);
        }
      } catch {
        // network hiccup — keep polling
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, paymentHash, intervalMs]);
}
