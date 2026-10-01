"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EnergyPicker } from "../components/EnergyPicker";
import { FocusTimer } from "../components/FocusTimer";
import { TinyWins } from "../components/TinyWins";
import { CompanionChat } from "../components/CompanionChat";
import { CheckIn } from "../components/CheckIn";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import {
  ENCOURAGEMENTS,
  SPRINT_STEPS,
  debriefFallback,
  nextUpForEnergy,
  todayISO,
  type Energy,
} from "../lib/coach";
import { fetchDebriefReply } from "../lib/llm";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { useTinyWins } from "../hooks/useTinyWins";

const ENERGY_NUDGE: Record<Energy, string> = {
  high: "High energy, spend it on what matters.",
  medium: "Steady energy. One step at a time.",
  low: "Low energy, keep it feather-light.",
};

export default function Home() {
  const [energy, setEnergy] = useState<Energy>("high");
  const timer = useFocusTimer(20);
  const winsApi = useTinyWins();
  const steps = SPRINT_STEPS[energy];
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [incoming, setIncoming] = useState<{ id: number; text: string } | null>(
    null
  );
  const debriefedRef = useRef(false);

  // Split wins into today's list and tasks planned for future days.
  const { todays, planned } = useMemo(() => {
    const t = todayISO();
    return {
      todays: winsApi.wins.filter((w) => !w.due || w.due <= t),
      planned: winsApi.wins.filter((w) => w.due && w.due > t),
    };
  }, [winsApi.wins]);

  // Energy-aware dopamine: surface the best next task for current energy.
  const dopamine = () => {
    const next = nextUpForEnergy(todays, energy);
    const pick = next
      ? `${ENERGY_NUDGE[energy]} Up next: ${next.text}.`
      : ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setToast(pick);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  // Interactive LLM debrief, once per finished sprint.
  useEffect(() => {
    if (timer.running) {
      debriefedRef.current = false;
      return;
    }
    if (!timer.finished || debriefedRef.current) return;
    debriefedRef.current = true;
    const doneCount = winsApi.wins.filter((w) => w.done).length;
    const pendingCount = winsApi.wins.length - doneCount;
    const minutes = timer.durationMin;
    fetchDebriefReply({ minutes, energy, doneCount, pendingCount }).then(
      (reply) => {
        setIncoming({
          id: Date.now(),
          text: reply ?? debriefFallback(minutes, doneCount),
        });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.finished, timer.running]);

  const toggleTimer = () => {
    if (timer.running) timer.pause();
    else timer.start();
  };

  return (
    <main className="min-h-screen">
      <ServiceWorkerRegister />
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-5">
          <img
            src="/icons/icon-192.png"
            alt="Porchlight Agent logo"
            width={192}
            height={192}
            className="w-16 h-16 mx-auto mb-3 rounded-[1.1rem] shadow-md"
          />
          <h1 className="text-2xl font-bold text-gray-900">Porchlight Agent</h1>
          <p className="text-sm text-gray-500 mt-1">ADHD friendly companion</p>
          <p className="text-xs text-gray-400 mt-2">
            Not medical advice. For emergencies, contact local services or a trusted person.
          </p>
        </header>

        {/* Energy */}
        <div className="mb-5">
          <EnergyPicker value={energy} onChange={setEnergy} />
        </div>

        {/* Sprint steps */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              <strong className="text-gray-900">Step 1: Set a specific goal.</strong> {steps.goal}
            </p>
            <p>
              <strong className="text-gray-900">Step 2: Eliminate distractions.</strong>{" "}
              {steps.distractions}
            </p>
            <p>{steps.reminder}</p>
            <p className="text-gray-500">
              {timer.running
                ? `Timer is running: ${timer.durationMin} minutes`
                : timer.finished
                  ? "Sprint complete. Nice work."
                  : "Timer is ready when you are."}
            </p>
          </div>
        </section>

        {/* Timer */}
        <div className="mb-4">
          <FocusTimer timer={timer} />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={dopamine}
            className="bg-white rounded-xl py-2.5 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 transition"
          >
            Dopamine
          </button>
          <button
            onClick={toggleTimer}
            className="bg-white rounded-xl py-2.5 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 transition"
          >
            {timer.running ? "Pause" : "Timer"}
          </button>
          <CheckIn />
        </div>

        {/* Tiny wins */}
        <div className="mb-4">
          <TinyWins
            today={todays}
            planned={planned}
            energy={energy}
            onToggle={winsApi.toggle}
            onRemove={winsApi.remove}
          />
        </div>

        {/* Chat */}
        <div className="mb-6">
          <CompanionChat
            onStartSprint={(m) => timer.start(m)}
            onAddWin={winsApi.addWin}
            incoming={incoming}
          />
        </div>

        <footer className="text-center text-xs text-gray-400 pb-4">
          Built with care for the ADHD community. Small steps count. Wins are welcome.
        </footer>
      </div>

      {/* Dopamine toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-sm w-[calc(100%-2rem)] bg-gray-900 text-white text-sm rounded-2xl px-4 py-3 shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
