"use client";

import { useEffect, useState } from "react";
import { touchStreakDay } from "../lib/companion";

const KEY = "porchlight:checkins:v1";

interface Checkin {
  t: number;
  level: number;
  note: string;
}

const LEVELS = [
  { n: 1, label: "Drained" },
  { n: 2, label: "Low" },
  { n: 3, label: "Okay" },
  { n: 4, label: "Good" },
  { n: 5, label: "Buzzing" },
];

function levelLabel(n: number): string {
  return LEVELS.find((l) => l.n === n)?.label ?? "";
}

function warmReply(level: number): string {
  if (level <= 2)
    return "Thanks for being honest with me. Low energy is information, not failure. Shrink today down to one tiny win and let the rest wait.";
  if (level === 3)
    return "Steady counts. Pick one small thing that matters and give it twenty gentle minutes.";
  return "Love to see it. Point that energy at the thing that matters most, then rest without guilt.";
}

function todayList(list: Checkin[]): Checkin[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return list.filter((c) => c.t >= start.getTime()).sort((a, b) => b.t - a.t);
}

function fmtTime(t: number): string {
  return new Date(t).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CheckIn() {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [history, setHistory] = useState<Checkin[]>([]);

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      setHistory(raw ? todayList(JSON.parse(raw)) : []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = () => {
    setLevel(null);
    setNote("");
    setSaved(null);
    load();
    setOpen(true);
  };

  const save = () => {
    if (level == null) return;
    try {
      const raw = localStorage.getItem(KEY);
      const list: Checkin[] = raw ? JSON.parse(raw) : [];
      list.push({ t: Date.now(), level, note: note.trim() });
      localStorage.setItem(KEY, JSON.stringify(list));
      setHistory(todayList(list));
    } catch {
      /* ignore */
    }
    touchStreakDay();
    setSaved(warmReply(level));
  };

  return (
    <div className="contents">
      <button
        onClick={openModal}
        className="w-full bg-white/[0.06] rounded-xl py-2.5 text-sm border border-white/10 text-[#cfc7b0] hover:border-amber-300/50 transition"
      >
        Check in{history.length > 0 ? ` (${history.length} today)` : ""}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#101a3d] border border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {!saved ? (
              <>
                <h2 className="font-semibold text-[#f3ecdc] mb-1">
                  How are you, really?
                </h2>
                <p className="text-sm text-[#8b93ab] mb-4">
                  No wrong answers. This is just for you.
                </p>
                <div className="grid grid-cols-5 gap-1.5 mb-4">
                  {LEVELS.map((l) => (
                    <button
                      key={l.n}
                      onClick={() => setLevel(l.n)}
                      className={`py-2 px-1 rounded-xl text-xs border transition flex flex-col items-center gap-0.5 ${
                        level === l.n
                          ? "bg-amber-400 text-[#1a1206] border-amber-300 font-semibold"
                          : "bg-white/[0.05] text-[#b9c0d4] border-white/10 hover:border-white/30"
                      }`}
                    >
                      <span className="font-semibold text-sm">{l.n}</span>
                      <span className="text-[10px] leading-tight">
                        {l.label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="One line about your day (optional)"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#f3ecdc] placeholder-[#6b7390] outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20 transition mb-4"
                />
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={save}
                    disabled={level == null}
                    className="flex-1 bg-amber-400 text-[#1a1206] rounded-xl py-2.5 text-sm font-semibold hover:bg-amber-300 transition disabled:opacity-40"
                  >
                    Save check-in
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-5 rounded-xl py-2.5 text-sm border border-white/15 text-[#b9c0d4] hover:border-white/40 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-[#e9e2d0] leading-relaxed mb-4">
                  {saved}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="bg-amber-400 text-[#1a1206] rounded-xl px-8 py-2.5 text-sm font-semibold hover:bg-amber-300 transition"
                >
                  Done
                </button>
              </div>
            )}

            {history.length > 0 && (
              <div className="border-t border-white/10 pt-3 mt-1">
                <p className="text-xs text-[#6b7390] mb-2">
                  Your day so far ({history.length})
                </p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {history.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-[#8b93ab]">
                        {fmtTime(c.t)} · {levelLabel(c.level)}
                        {c.note ? ` — ${c.note}` : ""}
                      </span>
                      <span className="flex gap-0.5">
                        {LEVELS.map((l) => (
                          <span
                            key={l.n}
                            className={`w-1.5 h-1.5 rounded-full ${
                              l.n <= c.level
                                ? "bg-amber-400"
                                : "bg-white/15"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
