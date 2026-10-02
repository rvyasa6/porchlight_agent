"use client";

import { useCallback, useEffect, useState } from "react";
import { Fireflies, Lantern } from "../components/Lantern";
import { EnergyControl } from "../components/EnergyControl";
import { CompanionChat } from "../components/CompanionChat";
import { TaskMaster } from "../components/TaskMaster";
import { FocusTab } from "../components/FocusTab";
import { WinsTab, countWinsToday } from "../components/WinsTab";
import {
  ChatIcon,
  TasksIcon,
  TimerIcon,
  WinsIcon,
  FlameIcon,
} from "../components/Icons";
import { useTasks } from "../lib/taskStore";
import { getStreak } from "../lib/companion";
import type { Energy } from "../lib/coach";

type Tab = "chat" | "tasks" | "focus" | "wins";

const TABS: { id: Tab; label: string; Icon: typeof ChatIcon }[] = [
  { id: "chat", label: "Chat", Icon: ChatIcon },
  { id: "tasks", label: "Tasks", Icon: TasksIcon },
  { id: "focus", label: "Focus", Icon: TimerIcon },
  { id: "wins", label: "Wins", Icon: WinsIcon },
];

const ENERGY_KEY = "porchlight:energy:v1";

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");
  const [energy, setEnergy] = useState<Energy>("high");
  const {
    tasks,
    addTasks,
    toggleTask,
    removeTask,
    toggleKey,
    clearDone,
    moveToToday,
  } = useTasks();
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintNonce, setSprintNonce] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [winsToday, setWinsToday] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ENERGY_KEY);
      if (raw === "low" || raw === "medium" || raw === "high")
        setEnergy(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshMeta = useCallback(() => {
    setStreak(getStreak());
    setWinsToday(countWinsToday());
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [tab, refreshMeta]);

  useEffect(() => {
    const onChanged = () => refreshMeta();
    window.addEventListener("porchlight:wins-changed", onChanged);
    return () =>
      window.removeEventListener("porchlight:wins-changed", onChanged);
  }, [refreshMeta]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // The chat (or tasks) can hand Focus a goal and jump there.
  const startSprint = useCallback((goal: string) => {
    setSprintGoal(goal);
    setSprintNonce((n) => n + 1);
    setTab("focus");
  }, []);

  useEffect(() => {
    const onSprint = (e: Event) => {
      const goal = String((e as CustomEvent).detail?.goal ?? "");
      startSprint(goal);
    };
    window.addEventListener("porchlight:start-sprint", onSprint);
    return () =>
      window.removeEventListener("porchlight:start-sprint", onSprint);
  }, [startSprint]);

  const changeEnergy = (e: Energy) => {
    setEnergy(e);
    try {
      localStorage.setItem(ENERGY_KEY, e);
    } catch {
      /* ignore */
    }
  };

  const showTasks = useCallback(
    (id: string | null, message: string) => {
      setHighlightId(id);
      setToast(message);
      setTab("tasks");
    },
    []
  );

  return (
    <main className="min-h-screen">
      <Fireflies />

      {/* Header */}
      <header className="sticky top-0 z-30 pt-4 pb-3 bg-gradient-to-b from-[#060b24] via-[#060b24]/95 to-transparent">
        <div className="max-w-md mx-auto px-4 flex items-center gap-3">
          <Lantern energy={energy} size={38} />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight text-[#f3ecdc]">
              Porchlight
            </h1>
            <p className="text-xs text-[#8b93ab]">
              Your gentle daily companion
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-amber-300 text-sm font-semibold">
              <FlameIcon className="w-4 h-4" />
              {streak}
            </div>
          )}
        </div>
        <div className="max-w-md mx-auto px-4 mt-2.5">
          <EnergyControl compact value={energy} onChange={changeEnergy} />
        </div>
      </header>

      {/* Tab content */}
      <div className="max-w-md mx-auto px-4 pb-32 pt-1 relative">
        {tab === "chat" && (
          <CompanionChat
            tasks={tasks}
            energy={energy}
            streak={streak}
            winsToday={winsToday}
            onStartSprint={startSprint}
            onShowTasks={showTasks}
          />
        )}
        {tab === "tasks" && (
          <TaskMaster
            tasks={tasks}
            energy={energy}
            highlightId={highlightId}
            onToggle={toggleTask}
            onRemove={removeTask}
            onToggleKey={toggleKey}
            onClearDone={clearDone}
            onMoveToToday={moveToToday}
            onAddItems={addTasks}
            onSprintTask={startSprint}
          />
        )}
        {tab === "focus" && (
          <FocusTab
            energy={energy}
            onEnergyChange={changeEnergy}
            sprintGoal={sprintGoal}
            sprintNonce={sprintNonce}
            onBrowseTasks={() => setTab("tasks")}
          />
        )}
        {tab === "wins" && <WinsTab />}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 inset-x-0 z-40 flex justify-center px-6 pointer-events-none">
          <div className="msg-in bg-amber-400 text-[#1a1206] text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg max-w-sm text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="tabbar fixed bottom-0 inset-x-0 z-40">
        <div
          className="max-w-md mx-auto grid grid-cols-4 px-2 pt-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-1.5 rounded-xl transition ${
                  active ? "text-amber-300" : "text-[#6b7390] hover:text-[#aab2c9]"
                }`}
              >
                <Icon className="w-[22px] h-[22px]" />
                <span className="text-[10px] font-medium">{label}</span>
                <span
                  className={`w-1 h-1 rounded-full transition ${
                    active ? "bg-amber-300" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
