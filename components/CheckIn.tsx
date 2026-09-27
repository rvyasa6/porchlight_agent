"use client";

import { useEffect, useState } from "react";

const KEY = "porchlight:checkins:v1";

interface Checkin {
  t: number;
  level: number;
  note: string;
}

function todayCount(list: Checkin[]): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return list.filter((c) => c.t >= start.getTime()).length;
}

export function CheckIn() {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCount(todayCount(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  const save = () => {
    if (level == null) return;
    try {
      const raw = localStorage.getItem(KEY);
      const list: Checkin[] = raw ? JSON.parse(raw) : [];
      list.push({ t: Date.now(), level, note: note.trim() });
      localStorage.setItem(KEY, JSON.stringify(list));
      setCount(todayCount(list));
    } catch {
      /* ignore */
    }
    setOpen(false);
    setLevel(null);
    setNote("");
  };

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-white rounded-xl py-2.5 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 transition"
        >
          Check in{count > 0 ? ` (${count} today)` : ""}
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Quick check-in</h2>
          <p className="text-sm text-gray-500 mb-3">How is your energy right now?</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setLevel(n)}
                className={`flex-1 py-2 rounded-xl text-sm border transition ${
                  level === n
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="One line about how you feel (optional)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={level == null}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40"
            >
              Save check-in
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-5 rounded-xl py-2.5 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
