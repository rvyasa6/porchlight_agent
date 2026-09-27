"use client";

import type { Win } from "../hooks/useTinyWins";

interface Props {
  wins: Win[];
  onToggle: (i: number) => void;
  onRemove: (i: number) => void;
}

export function TinyWins({ wins, onToggle, onRemove }: Props) {
  const completed = wins.filter((w) => w.done).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-medium text-gray-500">
          Tiny wins
          {completed > 0 ? ` (${completed}/${wins.length})` : ""}
        </h2>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Tap to check off. Ask Porchlight in the chat below to add new ones.
      </p>
      <div className="flex flex-wrap gap-2">
        {wins.map((w, i) => (
          <span
            key={`${w.text}-${i}`}
            className={`inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-xs border transition ${
              w.done
                ? "bg-green-50 text-green-700 border-green-300"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            <button
              onClick={() => onToggle(i)}
              aria-pressed={w.done}
              className={w.done ? "line-through" : "hover:text-gray-900"}
            >
              {w.done ? "✓ " : ""}
              {w.text}
            </button>
            {w.custom && (
              <button
                onClick={() => onRemove(i)}
                aria-label={`Remove ${w.text}`}
                className="ml-1 w-4 h-4 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 text-[10px] leading-none"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
