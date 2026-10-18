import { useEffect, useRef, useState } from 'react';

export function useAutoRefresh(onRefresh: () => void, intervalMs = 30000) {
  const [enabled, setEnabled] = useState(true);
  const timer = useRef<number | null>(null);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;
  useEffect(() => {
    if (!enabled) return;
    timer.current = window.setInterval(() => cb.current(), intervalMs);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [enabled, intervalMs]);
  return { enabled, setEnabled };
}

