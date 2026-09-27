"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TINY_WINS } from "../lib/coach";

export interface Win {
  text: string;
  done: boolean;
  custom: boolean;
}

const LEGACY_KEY = "porchlight:tinywins:v1";
const CUSTOM_KEY = "porchlight:tinywins-custom:v1";

export type AddWinResult = "added" | "duplicate" | "empty";

export function useTinyWins() {
  const [wins, setWins] = useState<Win[]>(() =>
    TINY_WINS.map((t) => ({ text: t, done: false, custom: false }))
  );
  const winsRef = useRef(wins);
  useEffect(() => {
    winsRef.current = wins;
  }, [wins]);

  // Load persisted state once (legacy done-flags + custom wins).
  useEffect(() => {
    try {
      let doneFlags: boolean[] = [];
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const p = JSON.parse(legacy);
        if (Array.isArray(p)) doneFlags = p;
      }
      const customRaw = localStorage.getItem(CUSTOM_KEY);
      const custom: Win[] = customRaw ? JSON.parse(customRaw) : [];
      setWins([
        ...TINY_WINS.map((t, i) => ({
          text: t,
          done: !!doneFlags[i],
          custom: false,
        })),
        ...custom
          .filter((c) => c && typeof c.text === "string" && c.text.trim())
          .map((c) => ({
            text: c.text.trim().slice(0, 80),
            done: !!c.done,
            custom: true,
          })),
      ]);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist custom wins.
  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_KEY,
        JSON.stringify(winsRef.current.filter((w) => w.custom))
      );
    } catch {
      /* ignore */
    }
  }, [wins]);

  const toggle = useCallback((i: number) => {
    setWins((ws) => ws.map((w, idx) => (idx === i ? { ...w, done: !w.done } : w)));
  }, []);

  const remove = useCallback((i: number) => {
    setWins((ws) => ws.filter((_, idx) => idx !== i));
  }, []);

  const addWin = useCallback((raw: string): AddWinResult => {
    const t = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (t.length < 2) return "empty";
    const label = t.charAt(0).toUpperCase() + t.slice(1);
    if (
      winsRef.current.some((w) => w.text.toLowerCase() === label.toLowerCase())
    )
      return "duplicate";
    setWins((ws) => [...ws, { text: label, done: false, custom: true }]);
    return "added";
  }, []);

  return { wins, toggle, remove, addWin };
}
