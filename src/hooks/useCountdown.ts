import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drift-free countdown driven by wall-clock time so it stays accurate even
 * when the tab is backgrounded (important for fair Petit Bac timing).
 */
export function useCountdown(onExpire?: () => void) {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const endRef = useRef(0);
  const expiredRef = useRef(false);
  const cbRef = useRef(onExpire);
  cbRef.current = onExpire;

  const start = useCallback((seconds: number) => {
    endRef.current = Date.now() + seconds * 1000;
    expiredRef.current = false;
    setRemaining(seconds);
    setRunning(true);
  }, []);

  const stop = useCallback(() => setRunning(false), []);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, (endRef.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        setRunning(false);
        cbRef.current?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [running]);

  return { remaining: Math.ceil(remaining), running, start, stop };
}
