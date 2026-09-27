"use client";

import { formatMs, useFocusTimer } from "../hooks/useFocusTimer";

type Timer = ReturnType<typeof useFocusTimer>;

const PRESETS = [10, 20, 30, 45];

export function FocusTimer({ timer }: { timer: Timer }) {
  const total = timer.durationMin * 60 * 1000;
  const elapsedPct = total > 0 ? Math.min(100, ((total - timer.remainingMs) / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Focus for {timer.durationMin} minutes</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => timer.setDuration(m)}
            disabled={timer.running}
            className={`px-3 py-1 rounded-full text-xs border transition disabled:opacity-40 ${
              timer.durationMin === m
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="text-5xl font-bold text-center tabular-nums text-gray-900">
        {formatMs(timer.remainingMs)}
      </div>

      <div className="h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${elapsedPct}%` }}
        />
      </div>

      <p className="text-sm text-gray-500 mt-3 text-center">
        {timer.running
          ? `Timer is running: ${formatMs(timer.remainingMs)}`
          : timer.finished
            ? "Sprint complete. Nice work. Take a breath."
            : "Timer is paused. Tap Start when you are ready."}
      </p>

      <div className="flex gap-2 mt-4">
        {!timer.running ? (
          <button
            onClick={() => timer.start()}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition"
          >
            {timer.finished ? "Start again" : "Start"}
          </button>
        ) : (
          <button
            onClick={timer.pause}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 transition"
          >
            Pause
          </button>
        )}
        <button
          onClick={timer.reset}
          className="px-5 rounded-xl py-2.5 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
