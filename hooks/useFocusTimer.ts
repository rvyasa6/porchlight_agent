"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFocusTimer(initialMinutes = 20) {
  const [durationMin, setDurationMin] = useState(initialMinutes);
  const [remainingMs, setRemainingMs] = useState(initialMinutes * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const deadlineRef = useRef<number | null>(null);
  const durationRef = useRef(initialMinutes);
  durationRef.current = durationMin;

  const start = useCallback((minutes?: number) => {
    const m = minutes ?? durationRef.current;
    durationRef.current = m;
    setDurationMin(m);
    setFinished(false);
    deadlineRef.current = Date.now() + m * 60 * 1000;
    setRemainingMs(m * 60 * 1000);
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (deadlineRef.current != null) {
      setRemainingMs(Math.max(0, deadlineRef.current - Date.now()));
      deadlineRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    deadlineRef.current = null;
    setRunning(false);
    setFinished(false);
    setRemainingMs(durationRef.current * 60 * 1000);
  }, []);

  const setDuration = useCallback((m: number) => {
    durationRef.current = m;
    setDurationMin(m);
    deadlineRef.current = null;
    setRunning(false);
    setFinished(false);
    setRemainingMs(m * 60 * 1000);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (deadlineRef.current == null) return;
      const left = deadlineRef.current - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        setRunning(false);
        setFinished(true);
        deadlineRef.current = null;
      } else {
        setRemainingMs(left);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  return { durationMin, remainingMs, running, finished, start, pause, reset, setDuration };
}

export function formatMs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
