"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TINY_WINS,
  categorizeTask,
  type Category,
  type Effort,
} from "../lib/coach";

export interface Win {
  text: string;
  done: boolean;
  custom: boolean;
  effort: Effort;
  important: boolean;
  category: Category;
  due?: string; // YYYY-MM-DD local; undefined means today/anytime
}

export interface AddWinOptions {
  effort?: Effort;
  important?: boolean;
  category?: Category;
  due?: string;
}

const LEGACY_KEY = "porchlight:tinywins:v1";
const CUSTOM_KEY = "porchlight:tinywins-custom:v1";

export type AddWinResult = "added" | "duplicate" | "empty";

function normalize(raw: unknown): Win | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<Win>;
  if (typeof c.text !== "string" || !c.text.trim()) return null;
  const text = c.text.trim().slice(0, 80);
  const validCats: Category[] = [
    "productivity",
    "shopping",
    "wellness",
    "home",
    "other",
  ];
  return {
    text,
    done: !!c.done,
    custom: true,
    effort: c.effort === "hard" ? "hard" : "easy",
    important: !!c.important,
    category:
      c.category && validCats.includes(c.category)
        ? c.category
        : categorizeTask(text),
    due: typeof c.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.due) ? c.due : undefined,
  };
}

export function useTinyWins() {
  const [wins, setWins] = useState<Win[]>(() =>
    TINY_WINS.map((t) => ({
      text: t,
      done: false,
      custom: false,
      effort: "easy" as Effort,
      important: false,
      category: "wellness" as Category,
    }))
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
          effort: "easy" as Effort,
          important: false,
          category: "wellness" as Category,
        })),
        ...custom.map(normalize).filter((c): c is Win => c !== null),
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

  const toggle = useCallback((target: Win) => {
    setWins((ws) =>
      ws.map((w) => (w === target ? { ...w, done: !w.done } : w))
    );
  }, []);

  const remove = useCallback((target: Win) => {
    setWins((ws) => ws.filter((w) => w !== target));
  }, []);

  const addWin = useCallback(
    (raw: string, opts?: AddWinOptions): AddWinResult => {
      const t = raw.trim().replace(/\s+/g, " ").slice(0, 80);
      if (t.length < 2) return "empty";
      const label = t.charAt(0).toUpperCase() + t.slice(1);
      if (
        winsRef.current.some((w) => w.text.toLowerCase() === label.toLowerCase())
      )
        return "duplicate";
      const win: Win = {
        text: label,
        done: false,
        custom: true,
        effort: opts?.effort ?? "easy",
        important: !!opts?.important,
        category: opts?.category ?? categorizeTask(label),
        due: opts?.due,
      };
      setWins((ws) => [...ws, win]);
      return "added";
    },
    []
  );

  return { wins, toggle, remove, addWin };
}
