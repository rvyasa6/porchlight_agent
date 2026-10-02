"use client";

import type { Energy } from "../lib/coach";
import { SPRINT_STEPS } from "../lib/coach";
import { EnergyControl } from "./EnergyControl";
import { FocusTimer } from "./FocusTimer";
import { TargetIcon, EyeOffIcon, BellIcon, TasksIcon } from "./Icons";

export function FocusTab({
  energy,
  onEnergyChange,
  sprintGoal,
  sprintNonce,
  onBrowseTasks,
}: {
  energy: Energy;
  onEnergyChange: (e: Energy) => void;
  sprintGoal: string;
  sprintNonce: number;
  onBrowseTasks: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="pl-card p-5">
        <h2 className="font-semibold text-[#f3ecdc] mb-1">Energy check</h2>
        <p className="text-xs text-[#8b93ab] mb-3">
          Everything below reshapes itself around this.
        </p>
        <EnergyControl value={energy} onChange={onEnergyChange} />
        <p className="text-sm text-[#cfc7b0] leading-relaxed mt-4">
          {energy === "high"
            ? "High energy is a gift. Spend it on the thing that matters most, then rest without guilt."
            : energy === "low"
            ? "Low energy is information, not failure. Shrink the field and let tiny steps count."
            : "Steady energy. Pick one thing that matters and give it twenty gentle minutes."}
        </p>
        <div className="mt-4 space-y-2.5">
          <div className="flex gap-3 items-start">
            <TargetIcon className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
            <p className="text-sm text-[#b9c0d4]">
              <span className="text-[#f3ecdc] font-medium">Aim. </span>
              {SPRINT_STEPS[energy].goal}
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <EyeOffIcon className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
            <p className="text-sm text-[#b9c0d4]">
              <span className="text-[#f3ecdc] font-medium">Clear. </span>
              {SPRINT_STEPS[energy].distractions}
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <BellIcon className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
            <p className="text-sm text-[#b9c0d4]">
              <span className="text-[#f3ecdc] font-medium">Remember. </span>
              {SPRINT_STEPS[energy].reminder}
            </p>
          </div>
        </div>
      </div>

      <FocusTimer presetGoal={sprintGoal} presetNonce={sprintNonce} />

      <button
        onClick={onBrowseTasks}
        className="w-full pl-card p-4 flex items-center gap-3 text-left hover:border-amber-300/40 transition"
      >
        <span className="w-9 h-9 rounded-xl bg-amber-300/15 border border-amber-300/25 flex items-center justify-center shrink-0">
          <TasksIcon className="w-[18px] h-[18px] text-amber-300" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium text-[#f3ecdc]">
            Sprint on a real task
          </span>
          <span className="block text-xs text-[#8b93ab]">
            Pick from your Up Next queue
          </span>
        </span>
      </button>

      <p className="text-[11px] text-[#6b7390] text-center px-4">
        After a sprint, ask me in Chat for a debrief and I will keep it to one
        short paragraph.
      </p>
    </div>
  );
}
