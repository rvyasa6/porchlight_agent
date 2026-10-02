"use client";

import { useEffect, useMemo, useState } from "react";
import { getStreak, last7Days, touchStreakDay } from "../lib/companion";
import { FlameIcon, PlusIcon, CheckIcon } from "./Icons";
import { CheckIn } from "./CheckIn";

const KEY = "porchlight:wins:v1";

const DEFAULTS = ["Drink water", "Take a short walk", "Stretch for a minute"];

const EXTRA_IDEAS = [
  "Tidy one surface",
  "Text someone you like",
  "Step outside for fresh air",
  "Write down one good thing",
  "Do ten slow breaths",
  "Refill your water bottle",
];

interface WinState {
  customs: string[];
  done: string[];
  date: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): WinState {
  const fresh: WinState = { customs: [], done: [], date: todayKey() };
  if (typeof localStorage === "undefined") return fresh;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const s = JSON.parse(raw) as WinState;
    if (s.date !== todayKey()) return fresh;
    return { customs: s.customs ?? [], done: s.done ?? [], date: s.date };
  } catch {
    return fresh;
  }
}

/** How many wins were completed today (for the chat's context line). */
export function countWinsToday(): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const s = JSON.parse(raw) as WinState;
    return s.date === todayKey() ? s.done.length : 0;
  } catch {
    return 0;
  }
}

const CONFETTI_COLORS = ["#fbbf24", "#f59e0b", "#fde68a", "#f472b6", "#7dd3fc"];

export function WinsTab() {
  const [state, setState] = useState<WinState>(() => load());
  const [draft, setDraft] = useState("");
  const [burstKey, setBurstKey] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  useEffect(() => {
    if (burstKey == null) return;
    const t = setTimeout(() => setBurstKey(null), 800);
    return () => clearTimeout(t);
  }, [burstKey]);

  const streak = getStreak();
  const days = useMemo(() => last7Days(), []);

  const wins = useMemo(
    () => [...DEFAULTS, ...state.customs],
    [state.customs]
  );

  const toggle = (w: string) => {
    setState((s) => {
      const done = s.done.includes(w)
        ? s.done.filter((x) => x !== w)
        : [...s.done, w];
      return { ...s, done };
    });
    if (!state.done.includes(w)) {
      touchStreakDay();
      setBurstKey(Date.now());
      window.dispatchEvent(new CustomEvent("porchlight:wins-changed"));
    }
  };

  const addCustom = () => {
    const v = draft.trim().slice(0, 60);
    if (!v || wins.includes(v)) return;
    setState((s) => ({ ...s, customs: [...s.customs, v] }));
    setDraft("");
  };

  const surprise = () => {
    const pool = EXTRA_IDEAS.filter((x) => !wins.includes(x));
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setState((s) => ({ ...s, customs: [...s.customs, pick] }));
  };

  const confetti = useMemo(() => {
    if (burstKey == null) return [];
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 34 + Math.random() * 44;
      return {
        dx: `${Math.cos(angle) * dist}px`,
        dy: `${Math.sin(angle) * dist}px`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 5,
      };
    });
  }, [burstKey]);

  return (
    <div className="space-y-4 relative">
      {/* Streak */}
      <div className="pl-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-2xl bg-amber-300/15 border border-amber-300/25 flex items-center justify-center">
            <FlameIcon className="w-5 h-5 text-amber-300" />
          </span>
          <div>
            <p className="font-semibold text-[#f3ecdc]">
              {streak === 0
                ? "Start your streak"
                : `${streak} day streak`}
            </p>
            <p className="text-xs text-[#8b93ab]">
              Complete a task, win, sprint, or check-in each day.
            </p>
          </div>
        </div>
        <div className="flex justify-between">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                  d.active
                    ? "bg-amber-400 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    : "border-white/15 bg-white/[0.03]"
                }`}
              >
                {d.active && <CheckIcon className="w-3.5 h-3.5 text-[#1a1206]" />}
              </span>
              <span className="text-[10px] text-[#6b7390]">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tiny wins ritual */}
      <div className="pl-card p-5">
        <h2 className="font-semibold text-[#f3ecdc] mb-1">Tiny wins</h2>
        <p className="text-xs text-[#8b93ab] mb-3">
          Not tasks. Little fuel. Tap to celebrate one.
        </p>
        <div className="flex flex-wrap gap-2 relative">
          {wins.map((w) => {
            const doneW = state.done.includes(w);
            return (
              <button
                key={w}
                onClick={() => toggle(w)}
                aria-pressed={doneW}
                className={`relative inline-flex items-center gap-1.5 pl-3.5 pr-3 py-2 rounded-full text-xs border transition ${
                  doneW
                    ? "bg-amber-400 text-[#1a1206] border-amber-300 font-semibold"
                    : "bg-white/[0.05] text-[#cfc7b0] border-white/10 hover:border-amber-300/50"
                }`}
              >
                {doneW && <CheckIcon className="w-3.5 h-3.5" />}
                {w}
                {burstKey != null && doneW && (
                  <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    {confetti.map((c, i) => (
                      <span
                        key={i}
                        className="confetti-dot rounded-full"
                        style={{
                          left: "50%",
                          top: "50%",
                          width: c.size,
                          height: c.size,
                          background: c.color,
                          ["--dx" as string]: c.dx,
                          ["--dy" as string]: c.dy,
                        }}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add your own tiny win..."
            className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f3ecdc] placeholder-[#6b7390] outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20 transition"
          />
          <button
            onClick={addCustom}
            disabled={!draft.trim()}
            className="bg-white/10 text-[#f3ecdc] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/15 transition disabled:opacity-40 flex items-center gap-1"
            aria-label="Add tiny win"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={surprise}
            className="border border-white/15 text-[#b9c0d4] rounded-xl px-4 py-2.5 text-sm hover:border-amber-300/50 hover:text-amber-200 transition"
          >
            Surprise me
          </button>
        </div>
      </div>

      {/* Check-in */}
      <div className="pl-card p-5">
        <h2 className="font-semibold text-[#f3ecdc] mb-1">Daily check-in</h2>
        <p className="text-xs text-[#8b93ab] mb-3">
          How are you, really? No wrong answers.
        </p>
        <CheckIn />
      </div>

      <p className="text-[11px] text-[#6b7390] text-center px-6 pb-2">
        Porchlight is a gentle companion, not medical advice. For emergencies,
        contact local services or a trusted person.
      </p>
    </div>
  );
}
