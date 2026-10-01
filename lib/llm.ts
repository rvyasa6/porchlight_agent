/* Free LLM layer for Porchlight's companion chat.
 * Uses the Pollinations free text API (no key, no account). The rule-based
 * coach in coach.ts always stays as the instant fallback, so chat never
 * breaks when the network or the free API is unavailable.
 * Only the chat message text is sent; check-ins and wins stay on-device.
 *
 * Token budget: open chat messages are capped at 150 tokens; the
 * end-of-sprint debrief below fires at most once per finished sprint
 * and is capped at 90 tokens. All scheduling and energy-aware ordering
 * is computed on-device with zero LLM calls. */

import type { Category, Energy } from "./coach";
import { CATEGORY_LABELS } from "./coach";

const SYSTEM = `You are Porchlight, a warm and gentle companion for adults with ADHD. You help with focus, energy awareness, and celebrating tiny wins.

Style: kind, brief (2 to 4 short sentences), practical, never clinical. No em dashes. Never give medical advice. Never judge or lecture.

You may use these tags at the very end of your reply when they fit:
- [ADD_TASK: the task] when the user wants to add a task, reminder, or tiny win to their list.
- [START_SPRINT: minutes] when the user wants to start a focus sprint or timer (use 10, 20, 30, or 45).

Otherwise just reply warmly and conversationally.`;

export interface ParsedLLM {
  clean: string;
  tasks: string[];
  sprintMinutes?: number;
}

export function parseLLMTags(text: string): ParsedLLM {
  const tasks: string[] = [];
  const taskRe = /\[ADD_TASK:\s*([^\]]+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = taskRe.exec(text)) !== null) {
    const t = m[1].trim();
    if (t) tasks.push(t);
  }
  let sprintMinutes: number | undefined;
  const s = text.match(/\[START_SPRINT:\s*(\d+)\s*\]/i);
  if (s) sprintMinutes = Math.min(Math.max(parseInt(s[1], 10), 1), 120);
  const clean = text
    .replace(/\[ADD_TASK:\s*[^\]]+\]/gi, "")
    .replace(/\[START_SPRINT:\s*\d+\s*\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { clean, tasks, sprintMinutes };
}

/** Returns the model's reply text, or null when unavailable. */
export async function fetchLLMReply(userText: string): Promise<string | null> {
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userText },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim()
      ? content.trim()
      : null;
  } catch {
    return null;
  }
}

export interface DebriefContext {
  minutes: number;
  energy: Energy;
  doneCount: number;
  pendingCount: number;
}

/** One short interactive debrief when a sprint ends. Fires at most once per
 *  finished sprint, capped at 90 tokens. Null when the free API is down. */export async function fetchDebriefReply(
  ctx: DebriefContext
): Promise<string | null> {
  const prompt =
    `The user just finished a ${ctx.minutes}-minute focus sprint feeling ${ctx.energy} energy. ` +
    `Tiny wins completed: ${ctx.doneCount}. Still open: ${ctx.pendingCount}. ` +
    `In 2 short sentences: celebrate warmly, then ask one specific reflective question about how the sprint went. ` +
    `No em dashes. Never give medical advice.`;
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 90,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim()
      ? content.trim()
      : null;
  } catch {
    return null;
  }
}

export interface ParsedTaskItem {
  title: string;
  category: Category;
}

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

/** Split a messy message into clean individual tasks with categories.
 *  Used only when the text looks like a list or runs long; simple adds
 *  stay on-device. Capped at ~160 tokens. Null when the free API is down
 *  or the reply is unusable. */
export async function fetchTaskParse(
  userText: string
): Promise<ParsedTaskItem[] | null> {
  const prompt =
    `Split this message into individual to-do tasks. Reply with ONLY a JSON array like ` +
    `[{"title":"Buy cauliflower","category":"shopping"}]. Rules: each title max 8 words, ` +
    `imperative mood ("Buy milk", not "milk"); split lists into separate items; max 5 items; ` +
    `category must be one of: productivity, shopping, wellness, home, other. ` +
    `Message: "${userText.slice(0, 300)}"`;
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 160,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const jsonStart = content.indexOf("[");
    const jsonEnd = content.lastIndexOf("]");
    if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
    const parsed: unknown = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const items: ParsedTaskItem[] = [];
    for (const entry of parsed.slice(0, 5)) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as { title?: unknown; category?: unknown };
      if (typeof e.title !== "string" || !e.title.trim()) continue;
      const title =
        e.title.trim().slice(0, 60).charAt(0).toUpperCase() +
        e.title.trim().slice(1, 60);
      const category: Category =
        typeof e.category === "string" &&
        (VALID_CATEGORIES as string[]).includes(e.category)
          ? (e.category as Category)
          : "other";
      items.push({ title, category });
    }
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}
