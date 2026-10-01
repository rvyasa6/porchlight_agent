/* Porchlight Agent coaching content + rule-based companion engine.
 * Fully client-side: no backend, no API costs. */

export type Energy = "low" | "medium" | "high";

export type Effort = "easy" | "hard";

export type Category = "productivity" | "shopping" | "wellness" | "home" | "other";

export const CATEGORY_LABELS: Record<Category, string> = {
  productivity: "Productivity",
  shopping: "Shopping",
  wellness: "Wellness",
  home: "Home",
  other: "Other",
};

export const CATEGORY_ORDER: Category[] = [
  "productivity",
  "shopping",
  "wellness",
  "home",
  "other",
];

export const ENERGY_OPTIONS: { id: Energy; label: string }[] = [
  { id: "low", label: "Low energy" },
  { id: "medium", label: "Medium energy" },
  { id: "high", label: "High energy" },
];

export interface SprintSteps {
  goal: string;
  distractions: string;
  reminder: string;
}

export const SPRINT_STEPS: Record<Energy, SprintSteps> = {
  low: {
    goal: 'Write down one tiny, almost-effortless goal for the next 20 minutes, like "Open the document" or "Put 3 papers in a pile."',
    distractions:
      "Silence what you can. Phone face-down, one tab open, lights soft. Low energy is a signal to shrink the field, not to push harder.",
    reminder:
      "Progress counts even when it is small. One tiny step in 20 minutes is a win. Be gentle with yourself.",
  },
  medium: {
    goal: 'Write down a simple, achievable goal for the next 20 minutes, like "Write 100 words for a journal entry" or "Organize 5 papers on my desk."',
    distractions:
      "Close any unnecessary tabs on your computer, turn off notifications, and find a quiet space to work. You can also use a tool like a website blocker or a noise-cancelling app to help you stay focused.",
    reminder:
      "Remember, the goal is to make progress, not to finish everything in 20 minutes. Take it one step at a time.",
  },
  high: {
    goal: 'Write down a bold but doable goal for the next 20 minutes, like "Write 300 words" or "Clear the whole desk." Ride the wave while it lasts.',
    distractions:
      "Channel the energy: one target, notifications off, timer on. Park stray ideas on a scratch pad instead of chasing them.",
    reminder:
      "High energy is a gift. Spend it on the thing that matters most, then rest without guilt.",
  },
};

export const TINY_WINS: string[] = [
  "Drink water",
  "Take a short walk",
  "Stretch for a minute",
];

export const ENCOURAGEMENTS: string[] = [
  "Small steps count. You showed up, and that is the hardest part.",
  "Wins are welcome here, even the tiny ones. Especially the tiny ones.",
  "You do not need motivation to start. Starting creates motivation.",
  "Done is better than perfect. Messy progress still counts.",
  "Your brain is not broken. It just needs a gentler on-ramp.",
  "One plate in the sink is a cleaner kitchen than five minutes ago.",
  "Future you is already grateful for this one small thing.",
  "Rest is not quitting. Pausing is part of the sprint.",
];

export interface CoachAction {
  type: "start-sprint" | "add-win";
  minutes?: number;
  text?: string;
  effort?: Effort;
  important?: boolean;
  due?: string;
  category?: Category;
}

export interface CoachReply {
  reply: string;
  action?: CoachAction;
}

/* ---------- Dates (local timezone, YYYY-MM-DD) ---------- */

/** "2026-09-30" in the user's local timezone. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function addDaysISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "Today", "Tomorrow", or like "Thu, Oct 2". */
export function dueLabel(due: string): string {
  if (due <= todayISO()) return "Today";
  if (due === addDaysISO(1)) return "Tomorrow";
  return parseISODate(due).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Pull a due date ("tomorrow", "today", "next week", "in N days") out of free text. */
export function parseDue(raw: string): { due?: string; cleaned: string } {
  let cleaned = raw;
  let due: string | undefined;
  const take = (re: RegExp, days: number) => {
    if (due) return;
    const m = cleaned.match(re);
    if (m) {
      due = addDaysISO(days);
      cleaned = cleaned.replace(m[0], " ").replace(/\s+/g, " ").trim();
    }
  };
  take(/\bfor\s+tomorrow\b/i, 1);
  take(/\btomorrow\b/i, 1);
  take(/\bfor\s+today\b/i, 0);
  take(/\btoday\b/i, 0);
  take(/\bnext\s+week\b/i, 7);
  const inDays = cleaned.match(/\bin\s+(\d{1,2})\s+days?\b/i);
  if (!due && inDays) {
    due = addDaysISO(Math.min(parseInt(inDays[1], 10), 60));
    cleaned = cleaned.replace(inDays[0], " ").replace(/\s+/g, " ").trim();
  }
  // Tidy a dangling preposition left behind, e.g. "add dentist for".
  cleaned = cleaned.replace(/\s+(for|on|by)\s*$/i, "").trim();
  return { due, cleaned };
}

/* ---------- Task parsing ---------- */

const IMPORTANT_RE = /(important|urgent|deadline|priority|must[-\s]?do)/i;
const HARD_RE =
  /(hard|difficult|tough|big|deep work|report|taxes|exam|project|presentation|essay)/i;

export interface ParsedTask {
  text: string;
  effort: Effort;
  important: boolean;
  category: Category;
  due?: string;
}

/* ---------- Smart categorization (on-device, zero tokens) ---------- */

const CATEGORY_KEYWORDS: { cat: Category; re: RegExp }[] = [
  {
    cat: "shopping",
    re: /\b(buy|grocery|groceries|shopping|store|market|amazon|pick up|order)\b/i,
  },
  {
    cat: "productivity",
    re: /\b(call|email|e-mail|report|meeting|deadline|project|work|file|taxes|presentation|submit|review|write|prepare|message)\b/i,
  },
  {
    cat: "wellness",
    re: /\b(walk|water|stretch|exercise|gym|meditat|sleep|doctor|rest|yoga|run)\b/i,
  },
  {
    cat: "home",
    re: /\b(clean|laundry|dishes|cook|trash|vacuum|fix|tidy|organize|plate|sink)\b/i,
  },
];

/** Bucket a task into Shopping, Productivity, Wellness, Home, or Other. */
export function categorizeTask(text: string): Category {
  for (const { cat, re } of CATEGORY_KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return "other";
}

/** True when the text looks like a list or runs too long for a clean
 *  verbatim add. Those cases go to the LLM splitter instead. */
export function needsSmartParse(text: string): boolean {
  if (text.length > 45) return true;
  const commas = (text.match(/,/g) || []).length;
  if (commas >= 2) return true;
  if (commas >= 1 && /\band\b/i.test(text)) return true;
  return false;
}

/** Full task parse: text plus effort, importance, category, and due date. Null when no task found. */
export function parseTask(raw: string): ParsedTask | null {
  const { due, cleaned } = parseDue(raw);
  const text = extractTask(cleaned);
  if (!text) return null;
  const important = IMPORTANT_RE.test(raw);
  const effort: Effort = important || HARD_RE.test(raw) ? "hard" : "easy";
  return { text, effort, important, category: categorizeTask(text), due };
}

/* ---------- Energy-aware ordering ---------- */

export interface OrderableWin {
  done: boolean;
  effort?: Effort;
  important?: boolean;
}

/** Energy-aware ordering: high energy puts important and hard tasks first,
 *  low energy puts easy ones first. Done items always sink. Stable sort. */
export function orderWinsByEnergy<T extends OrderableWin>(
  wins: T[],
  energy: Energy
): T[] {
  const score = (w: T): number => {
    let s = 0;
    if (w.done) s += 1000;
    const effort = w.effort ?? "easy";
    const important = !!w.important;
    if (energy === "high") {
      if (important) s -= 30;
      if (effort === "hard") s -= 10;
    } else if (energy === "low") {
      if (!w.done && effort === "easy") s -= 20;
      if (important) s += 25;
    } else {
      if (!w.done && important) s -= 10;
    }
    return s;
  };
  return wins
    .map((w, i) => ({ w, i }))
    .sort((a, b) => score(a.w) - score(b.w) || a.i - b.i)
    .map((x) => x.w);
}

/** First incomplete win in energy order, or null when everything is done. */
export function nextUpForEnergy<T extends OrderableWin>(
  wins: T[],
  energy: Energy
): T | null {
  const ordered = orderWinsByEnergy(wins, energy);
  return ordered.find((w) => !w.done) ?? null;
}

/** Rule-based sprint debrief used when the LLM is unreachable. */
export function debriefFallback(minutes: number, doneCount: number): string {
  if (doneCount > 0) {
    return `Sprint complete, ${minutes} minutes banked and ${doneCount} win${
      doneCount === 1 ? "" : "s"
    } checked off. How did it feel? What helped the most?`;
  }
  return `Sprint complete. Showing up for ${minutes} minutes still counts. What got in the way, and what is one tiny tweak for next time?`;
}

/** Extract a task from "add X to my list" style messages. Null if none. */
export function extractTask(raw: string): string | null {
  const m = raw.match(
    /^(?:please\s+)?(?:add|remember to|remind me to|i need to|i have to|i've got to|i gotta|put|note down|note|can you add)\b\s*:?\s*(.+)$/i
  );
  if (!m) return null;
  const task = m[1]
    .trim()
    .replace(/\s+(to|on)\s+my\s+(tiny\s+wins?\s?)?lists?\.?$/i, "")
    .replace(/\s+(to|on)\s+the\s+lists?\.?$/i, "")
    .replace(/[.]+$/, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  if (task.length < 2) return null;
  return task.charAt(0).toUpperCase() + task.slice(1);
}

export function coachRespond(raw: string): CoachReply {
  const text = raw.toLowerCase();

  const task = parseTask(raw);
  if (task) {
    return {
      reply: "",
      action: {
        type: "add-win",
        text: task.text,
        effort: task.effort,
        important: task.important,
        category: task.category,
        due: task.due,
      },
    };
  }

  const sprintMatch =
    text.match(/sprint[^\d]*(\d+)\s*(min|minute)/) ||
    text.match(/(\d+)\s*(min|minute)[^\d]*sprint/);
  if (sprintMatch) {
    const minutes = Math.min(Math.max(parseInt(sprintMatch[1], 10), 1), 120);
    return {
      reply: `Sprint set for ${minutes} minutes. Pick one tiny goal, silence the noise, and go. I will keep time.`,
      action: { type: "start-sprint", minutes },
    };
  }

  if (
    /(start|begin).*(timer|sprint|focus)/.test(text) ||
    /help me (sprint|focus)/.test(text)
  ) {
    return {
      reply:
        "Let us do 20 minutes. One goal, one tab, notifications off. Tap Start when you are ready.",
      action: { type: "start-sprint", minutes: 20 },
    };
  }

  if (/(overwhelm|too much|so much to do|stressed)/.test(text)) {
    return {
      reply:
        "When everything feels like too much, the list is lying to you. There is only the next tiny step. Tell me one small thing and we will put it on your tiny wins.",
    };
  }

  if (/(guilt|guilty|ashamed|lazy|useless)/.test(text)) {
    return {
      reply:
        "You are not lazy. Guilt is just a sign you care. Let us trade it for one tiny, doable step. What is the smallest thing you could do right now?",
    };
  }

  if (/(distract|procrastinat|scrolling|doomscroll)/.test(text)) {
    return {
      reply:
        "Try this: close every tab except one, phone face-down, and a 20-minute timer. Your only job is the next tiny step, not the whole mountain.",
    };
  }

  if (/(anxious|anxiety|worried|scared|nervous)/.test(text)) {
    return {
      reply:
        "That tight feeling makes sense. Slow down with me: name one thing that is actually due today, and let the rest wait its turn. Want a short sprint to move through it?",
    };
  }

  if (/(sad|down|depress|lonely|hopeless)/.test(text)) {
    return {
      reply:
        "I hear you, and I am glad you told me. Be extra gentle with yourself today. One tiny win is plenty. If it gets heavy, please reach out to someone you trust.",
    };
  }

  if (/(happy|great|good|excited|proud|awesome)/.test(text)) {
    return {
      reply:
        "Yes. Soak that in for a second, you earned it. Want to ride the wave with a sprint while the energy is here?",
    };
  }

  if (/(bored|boring|restless)/.test(text)) {
    return {
      reply:
        "Restless brains need a target, not a lecture. Give me 20 minutes on one thing and let us see what happens. Or add something fun to your tiny wins.",
    };
  }

  if (/(what can you do|who are you|your name|help me$|help$)/.test(text)) {
    return {
      reply:
        'I am Porchlight, your focus companion. I can start a sprint timer ("sprint for 25 minutes"), add to your tiny wins ("add call mom for tomorrow" to plan ahead), or just talk things through.',
    };
  }

  if (/(distract|cannot focus|can't focus|lose focus)/.test(text)) {
    return {
      reply:
        "Try this: close every tab except one, phone face-down, and a 20-minute timer. Your only job is the next tiny step, not the whole mountain.",
    };
  }

  if (/(tired|exhausted|low energy|no energy|drained|burnout)/.test(text)) {
    return {
      reply:
        'Low energy is information, not failure. Shrink the goal until it feels silly-easy, like "open the document." Tiny wins still count.',
    };
  }

  if (/(thank|thanks)/.test(text)) {
    return { reply: "Anytime. I am here whenever the next sprint calls." };
  }

  if (/^(hi|hello|hey)\b/.test(text)) {
    return {
      reply:
        "Hey. How is your energy right now? Pick a level above and we will shape the next 20 minutes around it.",
    };
  }

  const pick = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  return {
    reply: `${pick} Want to sprint for 20 minutes? Try: "Help me sprint for 30 minutes".`,
  };
}
