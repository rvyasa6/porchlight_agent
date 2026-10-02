import { orderWinsByEnergy, type Energy } from "./coach";
import type { Task } from "./taskStore";

const STREAK_KEY = "porchlight:streak-days:v1";

function dayStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function readDays(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((d): d is string => typeof d === "string")
      : [];
  } catch {
    return [];
  }
}

/** Record today as an active day (task, win, sprint, or check-in completed). */
export function touchStreakDay(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const days = readDays();
    const today = dayStr(new Date());
    if (!days.includes(today)) {
      days.push(today);
      localStorage.setItem(STREAK_KEY, JSON.stringify(days.slice(-90)));
    }
  } catch {
    /* ignore */
  }
}

/** Consecutive active days ending today (or yesterday if today is quiet so far). */
export function getStreak(): number {
  const set = new Set(readDays());
  let n = 0;
  const d = new Date();
  if (!set.has(dayStr(d))) d.setDate(d.getDate() - 1);
  while (set.has(dayStr(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Last 7 days, oldest first, for the streak dots. */
export function last7Days(): { label: string; active: boolean }[] {
  const set = new Set(readDays());
  const out: { label: string; active: boolean }[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    out.push({ label: "SMTWTFS"[d.getDay()], active: set.has(dayStr(d)) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function dayGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function prettyDate(now: Date = new Date()): string {
  return now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** One tiny line of on-device context for the chat model (~25 tokens). */
export function buildContextLine(opts: {
  tasks: Task[];
  energy: Energy;
  streak: number;
  winsToday: number;
}): string {
  const open = opts.tasks.filter((t) => !t.done);
  const doneCount = opts.tasks.length - open.length;
  const top = open.length ? `Top task: ${open[0].title}.` : "No open tasks.";
  return `Today: ${doneCount}/${opts.tasks.length} tasks done. ${top} Energy: ${opts.energy}. Streak: ${opts.streak} day(s). Wins today: ${opts.winsToday}.`;
}

/** Deterministic day plan: overdue first, then key tasks, then energy fit. */
export function planMyDay(
  tasks: Task[],
  energy: Energy,
  todayOverride?: string
): string {
  const open = tasks.filter((t) => !t.done);
  if (open.length === 0)
    return "Your list is clear. Guard the open road, or toss me a few things and I will line them up.";
  const today = todayOverride ?? dayStr(new Date());
  const rank = new Map(
    orderWinsByEnergy(open, energy).map((t, i) => [t.id, i])
  );
  const overdue = (t: Task) => !!t.due && t.due < today;
  const ordered = [...open].sort(
    (a, b) =>
      Number(overdue(b)) - Number(overdue(a)) ||
      Number(!!b.key) - Number(!!a.key) ||
      (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99)
  );
  const lines = ordered
    .slice(0, 5)
    .map(
      (t, i) =>
        `${i + 1}. ${t.title}${overdue(t) ? " (overdue, do this first)" : ""}`
    );
  const extra =
    ordered.length > 5
      ? `\nPlus ${ordered.length - 5} more waiting in Tasks.`
      : "";
  return `Here is your lineup for ${energy} energy:\n${lines.join(
    "\n"
  )}${extra}\n\nWant me to set a sprint on number one?`;
}
