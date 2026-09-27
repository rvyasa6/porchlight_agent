"use client";

import { ENERGY_OPTIONS, type Energy } from "../lib/coach";

export function EnergyPicker({
  value,
  onChange,
}: {
  value: Energy;
  onChange: (e: Energy) => void;
}) {
  return (
    <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Energy level">
      {ENERGY_OPTIONS.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`px-4 py-1.5 rounded-full text-sm border transition ${
            value === o.id
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
