"use client";

import type { Energy } from "../lib/coach";

const OPTIONS: { v: Energy; label: string }[] = [
  { v: "low", label: "Low" },
  { v: "medium", label: "Medium" },
  { v: "high", label: "High" },
];

/** Compact energy selector that lives in the header on every tab. */
export function EnergyControl({
  value,
  onChange,
  compact = false,
}: {
  value: Energy;
  onChange: (e: Energy) => void;
  compact?: boolean;
}) {
  return (
    <div
      className="flex gap-1.5 justify-center"
      role="radiogroup"
      aria-label="Energy level"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-full border transition ${
            compact ? "px-3 py-1 text-xs" : "px-5 py-2 text-sm"
          } ${
            value === o.v
              ? "bg-amber-400 text-[#1a1206] border-amber-300 font-semibold shadow-[0_0_18px_rgba(251,191,36,0.45)]"
              : "bg-white/5 text-[#aab2c9] border-white/10 hover:border-white/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
