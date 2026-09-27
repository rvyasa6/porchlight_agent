"use client";

import { useEffect, useState } from "react";
import { TINY_WINS } from "../lib/coach";

const KEY = "porchlight:tinywins:v1";

export function TinyWins() {
  const [done, setDone] = useState<boolean[]>(() => TINY_WINS.map(() => false));
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === TINY_WINS.length) setDone(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done]);

  const toggle = (i: number) =>
    setDone((d) => d.map((v, idx) => (idx === i ? !v : v)));

  const completed = done.filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-500">
          Tiny wins{completed > 0 ? ` (${completed}/${TINY_WINS.length})` : ""}
        </h2>
        <button
          onClick={() => setHidden((h) => !h)}
          className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 transition"
        >
          {hidden ? "Show" : "Hide"}
        </button>
      </div>

      {!hidden && (
        <div className="flex flex-wrap gap-2">
          {TINY_WINS.map((w, i) => (
            <button
              key={w}
              onClick={() => toggle(i)}
              aria-pressed={done[i]}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                done[i]
                  ? "bg-green-50 text-green-700 border-green-300 line-through"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {done[i] ? "✓ " : ""}
              {w}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
