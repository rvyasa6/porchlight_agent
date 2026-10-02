"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  orderWinsByEnergy,
  type Category,
  type Energy,
} from "../lib/coach";
import { smartAddTasks, type NewTask, type Task } from "../lib/taskStore";
import {
  PlayIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  CheckIcon,
  CalendarIcon,
  ChevronRightIcon,
} from "./Icons";

const CAT_COLORS: Record<Category, string> = {
  shopping: "text-emerald-300 border-emerald-300/25 bg-emerald-300/10",
  productivity: "text-sky-300 border-sky-300/25 bg-sky-300/10",
  wellness: "text-rose-300 border-rose-300/25 bg-rose-300/10",
  home: "text-violet-300 border-violet-300/25 bg-violet-300/10",
  other: "text-slate-300 border-slate-300/25 bg-slate-300/10",
};

const BUCKET_ORDER: Category[] = [...CATEGORY_ORDER];

interface Props {
  tasks: Task[];
  energy: Energy;
  highlightId: string | null;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleKey: (id: string) => void;
  onClearDone: () => void;
  onMoveToToday: (id: string) => void;
  onAddItems: (items: NewTask[]) => void;
  onSprintTask: (title: string) => void;
}

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function dueInfo(
  due: string | undefined,
  today: string
): { text: string; hot: boolean } | null {
  if (!due) return null;
  if (due < today) return { text: "Overdue", hot: true };
  if (due === today) return { text: "Today", hot: false };
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const tom = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(t.getDate()).padStart(2, "0")}`;
  if (due === tom) return { text: "Tomorrow", hot: false };
  const d = new Date(due + "T12:00:00");
  return {
    text: isNaN(d.getTime())
      ? due
      : d.toLocaleDateString([], { month: "short", day: "numeric" }),
    hot: false,
  };
}

function orderUpNext(open: Task[], energy: Energy): Task[] {
  const today = todayStr();
  const rank = new Map(
    orderWinsByEnergy(open, energy).map((t, i) => [t.id, i])
  );
  return [...open].sort(
    (a, b) =>
      Number(!!b.due && b.due < today) - Number(!!a.due && a.due < today) ||
      Number(!!b.key) - Number(!!a.key) ||
      (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99)
  );
}

function TaskRow({
  task,
  highlighted,
  onToggle,
  onRemove,
  onToggleKey,
  onSprint,
  showSprint,
}: {
  task: Task;
  highlighted: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onToggleKey: () => void;
  onSprint: () => void;
  showSprint: boolean;
}) {
  const due = dueInfo(task.due, todayStr());
  return (
    <div
      className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl border transition ${
        highlighted
          ? "border-amber-300/70 bg-amber-300/10 shadow-[0_0_16px_rgba(251,191,36,0.25)]"
          : "border-transparent hover:bg-white/[0.04]"
      }`}
    >
      <button
        onClick={onToggle}
        aria-pressed={task.done}
        aria-label={task.done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
          task.done
            ? "bg-amber-400 border-amber-400 text-[#1a1206]"
            : "border-white/25 hover:border-amber-300/70"
        }`}
      >
        {task.done && <CheckIcon className="w-3.5 h-3.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            task.done ? "line-through text-[#6b7390]" : "text-[#ece5d3]"
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border ${CAT_COLORS[task.category]}`}
          >
            {CATEGORY_LABELS[task.category] ?? task.category}
          </span>
          {due && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                due.hot
                  ? "text-red-300 border-red-300/30 bg-red-300/10 font-semibold"
                  : "text-[#8b93ab] border-white/10"
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              {due.text}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onToggleKey}
        aria-pressed={!!task.key}
        aria-label={task.key ? "Unmark as key" : "Mark as key task"}
        className={`shrink-0 transition ${
          task.key ? "text-amber-300" : "text-[#4a5168] hover:text-amber-200"
        }`}
      >
        <StarIcon className="w-[18px] h-[18px]" filled={!!task.key} />
      </button>
      {showSprint && !task.done && (
        <button
          onClick={onSprint}
          aria-label={`Sprint on ${task.title}`}
          className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-amber-400 text-[#1a1206] hover:bg-amber-300 transition"
        >
          <PlayIcon className="w-3 h-3" />
          Sprint
        </button>
      )}
      <button
        onClick={onRemove}
        aria-label={`Remove ${task.title}`}
        className="shrink-0 text-[#4a5168] hover:text-red-300 transition"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function TaskMaster(props: Props) {
  const { tasks, energy, highlightId } = props;
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [adding, setAdding] = useState(false);

  const open = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.done), [tasks]);
  const planned = useMemo(
    () => open.filter((t) => t.plannedFor),
    [open]
  );
  const unplanned = useMemo(
    () => open.filter((t) => !t.plannedFor),
    [open]
  );
  const upNext = useMemo(
    () => orderUpNext(unplanned, energy).slice(0, 3),
    [unplanned, energy]
  );
  const upNextIds = useMemo(() => new Set(upNext.map((t) => t.id)), [upNext]);
  const rest = useMemo(
    () => unplanned.filter((t) => !upNextIds.has(t.id)),
    [unplanned, upNextIds]
  );
  const plannedGroups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of planned) {
      const k = t.plannedFor!;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()];
  }, [planned]);

  const submit = async () => {
    const v = text.trim();
    if (!v || adding) return;
    setAdding(true);
    try {
      const items = await smartAddTasks(v, undefined, due || undefined);
      if (items.length) {
        props.onAddItems(items);
        setText("");
        setDue("");
      }
    } finally {
      setAdding(false);
    }
  };

  const rowProps = (t: Task) => ({
    task: t,
    highlighted: highlightId === t.id,
    onToggle: () => props.onToggle(t.id),
    onRemove: () => props.onRemove(t.id),
    onToggleKey: () => props.onToggleKey(t.id),
    onSprint: () => props.onSprintTask(t.title),
  });

  return (
    <div className="space-y-4">
      {/* Add bar */}
      <div className="pl-card p-4">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a task, or paste a messy list..."
            className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f3ecdc] placeholder-[#6b7390] outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20 transition"
          />
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date (optional)"
            className="w-[38px] bg-white/[0.06] border border-white/10 rounded-xl px-1 py-2.5 text-sm text-[#8b93ab] outline-none focus:border-amber-300/60 transition"
          />
          <button
            onClick={submit}
            disabled={adding || !text.trim()}
            className="bg-amber-400 text-[#1a1206] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-amber-300 transition disabled:opacity-40 flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            {adding ? "..." : "Add"}
          </button>
        </div>
        <p className="text-[11px] text-[#6b7390] mt-2">
          Messy lists get split into clean tasks automatically.
        </p>
      </div>

      {/* Up Next */}
      <div className="pl-card p-4 border-amber-300/25">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-[#f3ecdc] flex items-center gap-2">
            Up next
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-300/15 text-amber-200 border border-amber-300/25">
              ordered for {energy} energy
            </span>
          </h2>
        </div>
        {upNext.length === 0 ? (
          <p className="text-sm text-[#8b93ab] py-2">
            Nothing queued. Add something above, or ask me in Chat to plan
            your day.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {upNext.map((t) => (
              <TaskRow key={t.id} {...rowProps(t)} showSprint />
            ))}
          </div>
        )}
      </div>

      {/* Buckets */}
      {rest.length > 0 && (
        <div className="pl-card p-4">
          <h2 className="font-semibold text-[#f3ecdc] mb-2">All tasks</h2>
          {BUCKET_ORDER.map((cat) => {
            const group = orderWinsByEnergy(
              rest.filter((t) => t.category === cat),
              energy
            );
            if (!group.length) return null;
            return (
              <div key={cat} className="mb-3 last:mb-0">
                <h3
                  className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${CAT_COLORS[cat].split(" ")[0]}`}
                >
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="divide-y divide-white/5">
                  {group.map((t) => (
                    <TaskRow key={t.id} {...rowProps(t)} showSprint={false} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Planned ahead */}
      {plannedGroups.length > 0 && (
        <div className="pl-card p-4">
          <h2 className="font-semibold text-[#f3ecdc] mb-2">Planned ahead</h2>
          {plannedGroups.map(([when, group]) => (
            <div key={when} className="mb-3 last:mb-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#8b93ab] mb-1">
                {when}
              </h3>
              <div className="divide-y divide-white/5">
                {group.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2.5 py-2 px-3"
                  >
                    <p className="flex-1 text-sm text-[#b9c0d4] min-w-0">
                      {t.title}
                    </p>
                    <button
                      onClick={() => props.onMoveToToday(t.id)}
                      className="text-xs px-2.5 py-1 rounded-full border border-white/15 text-[#b9c0d4] hover:border-amber-300/50 hover:text-amber-200 transition flex items-center gap-1"
                    >
                      Today
                      <ChevronRightIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => props.onRemove(t.id)}
                      aria-label={`Remove ${t.title}`}
                      className="text-[#4a5168] hover:text-red-300 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="pl-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-[#8b93ab]">
              Done today ({done.length})
            </h2>
            <button
              onClick={props.onClearDone}
              className="text-xs text-[#6b7390] hover:text-red-300 transition"
            >
              Clear
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {done.slice(0, 5).map((t) => (
              <p
                key={t.id}
                className="text-xs text-[#6b7390] line-through truncate"
              >
                {t.title}
              </p>
            ))}
            {done.length > 5 && (
              <p className="text-xs text-[#6b7390]">
                +{done.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
