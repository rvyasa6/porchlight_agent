"use client";

import { useEffect, useState } from "react";
import { formatMs, useFocusTimer } from "../hooks/useFocusTimer";
import { touchStreakDay } from "../lib/companion";
import { PlayIcon, PauseIcon } from "./Icons";

const DURATIONS = [10, 20, 30, 45];

export function FocusTimer({
  presetGoal,
  presetNonce,
}: {
  presetGoal?: string;
  presetNonce?: number;
}) {
  const [goal, setGoal] = useState("");
  const {
    durationMin,
    remainingMs,
    running,
    finished,
    start,
    pause,
    reset,
    setDuration,
  } = useFocusTimer();

  // A task can hand us a goal from the Tasks tab or the chat.
  useEffect(() => {
    if (presetNonce && presetGoal !== undefined) setGoal(presetGoal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetNonce]);

  const begin = () => {
    start(durationMin);
    if (goal.trim()) {
      try {
        localStorage.setItem(
          "porchlight:last-sprint:v1",
          JSON.stringify({
            goal: goal.trim(),
            minutes: durationMin,
            endedAt: Date.now(),
          })
        );
      } catch {
        /* ignore */
      }
    }
  };

  // Natural completion counts toward the streak.
  useEffect(() => {
    if (finished) touchStreakDay();
  }, [finished]);

  const totalMs = durationMin * 60_000;
  const pct =
    totalMs > 0
      ? Math.round(((totalMs - remainingMs) / totalMs) * 100)
      : 0;
  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="pl-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[#f3ecdc]">
          Focus for {durationMin} minutes
        </h2>
      </div>
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="What is this sprint for? (optional)"
        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f3ecdc] placeholder-[#6b7390] outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20 transition mb-3"
      />
      <div className="flex gap-2 mb-4">
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            disabled={running}
            className={`px-3 py-1 rounded-full text-xs border transition disabled:opacity-40 ${
              durationMin === d
                ? "bg-amber-400/15 text-amber-200 border-amber-300/50 font-semibold"
                : "bg-white/[0.04] text-[#8b93ab] border-white/10 hover:border-white/30"
            }`}
          >
            {d}m
          </button>
        ))}
      </div>
      <div className="text-5xl font-bold text-center tabular-nums text-[#f3ecdc]">
        {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
      </div>
      <div className="h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm text-[#8b93ab] mt-3 text-center">
        {running
          ? goal.trim()
            ? `Sprinting on: ${goal.trim()}`
            : "Sprint running. One thing at a time."
          : finished
          ? "Sprint complete. Nice work."
          : "Timer is paused. Tap Start when you are ready."}
      </p>
      <div className="flex gap-2 mt-4">
        {running ? (
          <button
            onClick={pause}
            className="flex-1 bg-white/10 text-[#f3ecdc] rounded-xl py-2.5 text-sm font-medium hover:bg-white/15 transition flex items-center justify-center gap-2"
          >
            <PauseIcon className="w-4 h-4" />
            Pause
          </button>
        ) : (
          <button
            onClick={begin}
            className="flex-1 bg-amber-400 text-[#1a1206] rounded-xl py-2.5 text-sm font-semibold hover:bg-amber-300 transition flex items-center justify-center gap-2"
          >
            <PlayIcon className="w-4 h-4" />
            Start
          </button>
        )}
        <button
          onClick={reset}
          className="px-5 rounded-xl py-2.5 text-sm border border-white/15 text-[#b9c0d4] hover:border-white/40 transition"
        >
          Reset
        </button>
      </div>
      <p className="text-[11px] text-[#6b7390] mt-3 text-center">
        {formatMs(remainingMs)} remaining
      </p>
    </div>
  );
}
