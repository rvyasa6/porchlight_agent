"use client";

import { dueLabel, orderWinsByEnergy, type Energy } from "../lib/coach";
import type { Win } from "../hooks/useTinyWins";

interface Props {
  today: Win[];
  planned: Win[];
  energy: Energy;
  onToggle: (w: Win) => void;
  onRemove: (w: Win) => void;
}

function WinPill({
  w,
  onToggle,
  onRemove,
}: {
  w: Win;
  onToggle: (w: Win) => void;
  onRemove: (w: Win) => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-xs border transition ${
        w.done
          ? "bg-green-50 text-green-700 border-green-300"
          : "bg-white text-gray-600 border-gray-200"
      }`}
    >
      <button
        onClick={() => onToggle(w)}
        aria-pressed={w.done}
        className={w.done ? "line-through" : "hover:text-gray-900"}
      >
        {w.done ? "✓ " : ""}
        {w.text}
      </button>
      {w.important && !w.done && (
        <span
          title="Marked important"
          className="ml-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-px"
        >
          key
        </span>
      )}
      {w.due && (
        <span className="ml-1 text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-1.5 py-px">
          {dueLabel(w.due)}
        </span>
      )}
      {w.custom && (
        <button
          onClick={() => onRemove(w)}
          aria-label={`Remove ${w.text}`}
          className="ml-1 w-4 h-4 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 text-[10px] leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function TinyWins({ today, planned, energy, onToggle, onRemove }: Props) {
  const orderedToday = orderWinsByEnergy(today, energy);
  const orderedPlanned = orderWinsByEnergy(planned, energy);
  const completed = today.filter((w) => w.done).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-medium text-gray-500">
          Tiny wins
          {completed > 0 ? ` (${completed}/${today.length})` : ""}
        </h2>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Tap to check off. Ordered for your {energy} energy. Ask Porchlight
        below to add new ones, like &quot;Add call mom for tomorrow&quot;.
      </p>
      <div className="flex flex-wrap gap-2">
        {orderedToday.map((w) => (
          <WinPill key={w.text} w={w} onToggle={onToggle} onRemove={onRemove} />
        ))}
      </div>

      {orderedPlanned.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-500 mt-5 mb-1">
            Planned ahead
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Scheduled for upcoming days. They move up when the day arrives.
          </p>
          <div className="flex flex-wrap gap-2">
            {orderedPlanned.map((w) => (
              <WinPill
                key={`${w.due}-${w.text}`}
                w={w}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
