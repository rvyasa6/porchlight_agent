"use client";

import { useRef, useState } from "react";
import { EnergyPicker } from "../components/EnergyPicker";
import { FocusTimer } from "../components/FocusTimer";
import { TinyWins } from "../components/TinyWins";
import { CompanionChat } from "../components/CompanionChat";
import { CheckIn } from "../components/CheckIn";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";
import { ENCOURAGEMENTS, SPRINT_STEPS, type Energy } from "../lib/coach";
import { useFocusTimer } from "../hooks/useFocusTimer";

export default function Home() {
  const [energy, setEnergy] = useState<Energy>("high");
  const timer = useFocusTimer(20);
  const steps = SPRINT_STEPS[energy];
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dopamine = () => {
    const pick = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setToast(pick);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

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
          <TinyWins />
        </div>

        {/* Chat */}
        <div className="mb-6">
          <CompanionChat onStartSprint={(m) => timer.start(m)} />
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
