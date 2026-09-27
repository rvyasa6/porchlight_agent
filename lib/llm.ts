/* Free LLM layer for Porchlight's companion chat.
 * Uses the Pollinations free text API (no key, no account). The rule-based
 * coach in coach.ts always stays as the instant fallback, so chat never
 * breaks when the network or the free API is unavailable.
 * Only the chat message text is sent; check-ins and wins stay on-device. */

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
