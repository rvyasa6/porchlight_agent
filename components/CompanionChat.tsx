"use client";

import { useEffect, useRef, useState } from "react";
import { askLLM, askDebrief, splitTasks, buildCompanionSystem } from "../lib/llm";
import {
  buildContextLine,
  dayGreeting,
  planMyDay,
  prettyDate,
} from "../lib/companion";
import { orderWinsByEnergy, nextUpForEnergy, type Energy } from "../lib/coach";
import { smartAddTasks, type Task } from "../lib/taskStore";
import { Lantern } from "./Lantern";
import { SendIcon, FlameIcon } from "./Icons";

const CHIPS = ["Plan my day", "Start a sprint", "Brain dump", "I'm scattered"];

interface Msg {
  id: number;
  role: "user" | "porchlight";
  text: string;
}

interface Props {
  tasks: Task[];
  energy: Energy;
  streak: number;
  winsToday: number;
  onStartSprint: (goal: string) => void;
  onShowTasks: (highlightId: string | null, toast: string) => void;
}

function stripAddPrefix(text: string): string {
  return text
    .replace(
      /^(please\s+)?(add|create|new|remember to|remind me to|i need to|i have to|note down|jot down)\b[:\s]*/i,
      ""
    )
    .trim();
}

function extractPlannedFor(text: string): { text: string; plannedFor?: string } {
  const m = text.match(/plan(?:ned)? for (.+)$/i);
  if (!m) return { text };
  return {
    text: text.slice(0, m.index).trim(),
    plannedFor: m[1].trim(),
  };
}

let msgId = 1;

export function CompanionChat({
  tasks,
  energy,
  streak,
  winsToday,
  onStartSprint,
  onShowTasks,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingDump, setAwaitingDump] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  const push = (role: Msg["role"], text: string) =>
    setMessages((m) => [...m, { id: msgId++, role, text }]);

  const replyLLM = async (
    history: { role: "user" | "porchlight"; text: string }[]
  ) => {
    const system = buildCompanionSystem(
      energy,
      buildContextLine({ tasks, energy, streak, winsToday })
    );
    try {
      const text = await askLLM(
        [
          { role: "system", content: system },
          ...history.map((h) => ({
            role: (h.role === "user" ? "user" : "assistant") as
              | "user"
              | "assistant",
            content: h.text,
          })),
        ],
        90
      );
      push("porchlight", text);
    } catch {
      push(
        "porchlight",
        "My words are taking a nap, but I am still here. Tell me one thing on your mind and we will take it from there."
      );
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    push("user", text);
    setInput("");
    const lower = text.toLowerCase();

    try {
      // 1. Brain dump follow-up: turn the mess into clean tasks.
      if (awaitingDump) {
        setAwaitingDump(false);
        const items = await smartAddTasks(text);
        if (items.length === 0) {
          push(
            "porchlight",
            "Nothing to sort in there. Try again, messy is fine."
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("porchlight:add-tasks", { detail: { tasks: items } })
          );
          push(
            "porchlight",
            `Sorted into ${items.length} clean task${
              items.length === 1 ? "" : "s"
            }. ${items
              .slice(0, 3)
              .map((t) => t.title)
              .join(", ")}${items.length > 3 ? ", and more" : ""}. Find them in Tasks.`
          );
        }
        return;
      }

      // 2. Plan my day (deterministic, on-device).
      if (/plan (my|the) day|plan today|today'?s plan/.test(lower)) {
        push("porchlight", planMyDay(tasks, energy));
        return;
      }

      // 3. Brain dump opener.
      if (/brain ?dump/.test(lower)) {
        setAwaitingDump(true);
        push(
          "porchlight",
          "Dump it all here, messy is fine. One message, everything on your mind, and I will turn it into clean tasks."
        );
        return;
      }

      // 4. Overwhelm: calm down to exactly one thing.
      if (
        /overwhelm|scatter|anxious|stressed|stuck|don'?t know where/.test(lower)
      ) {
        const open = tasks.filter((t) => !t.done);
        const top = nextUpForEnergy(open, energy);
        push(
          "porchlight",
          top
            ? `Breathe. Forget the whole list. There is exactly one thing: ${top.title}. Give it twenty gentle minutes, then come back.`
            : "Breathe. The list is empty, so there is nothing to be behind on. Tell me one thing weighing on you."
        );
        return;
      }

      // 5. Dopamine / motivation: surface the up-next pick in Tasks.
      if (/dopamine|motivat|nudge|push me|what (should|do) i do/.test(lower)) {
        const open = tasks.filter((t) => !t.done);
        const top = nextUpForEnergy(open, energy);
        if (top) {
          onShowTasks(top.id, `Start with: ${top.title}`);
          push(
            "porchlight",
            `I put ${top.title} at the top of your Up Next. One small start is all it takes.`
          );
        } else {
          push(
            "porchlight",
            "Nothing waiting, which means you get to choose something just for you. What sounds good?"
          );
        }
        return;
      }

      // 6. Add tasks.
      const wantsAdd =
        /^(please\s+)?(add|create|new|remember to|remind me to|i need to|i have to|note down|jot down)\b/i.test(
          text
        ) || /plan(?:ned)? for .+$/i.test(text);
      if (wantsAdd) {
        const stripped = stripAddPrefix(text);
        const { text: core, plannedFor } = extractPlannedFor(stripped);
        if (!core) {
          push(
            "porchlight",
            "What should I add? Give me the task and I will file it."
          );
          return;
        }
        const items = await smartAddTasks(core, plannedFor);
        if (items.length === 0) {
          push(
            "porchlight",
            "I could not make sense of that. Try shorter bits, like: Add buy milk."
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("porchlight:add-tasks", { detail: { tasks: items } })
          );
          push(
            "porchlight",
            items.length === 1
              ? `Added: ${items[0].title}${
                  plannedFor ? ` (planned for ${plannedFor})` : ""
                }.`
              : `Added ${items.length} tasks${
                  plannedFor ? ` (planned for ${plannedFor})` : ""
                }. ${items
                  .slice(0, 3)
                  .map((t) => t.title)
                  .join(", ")}${items.length > 3 ? ", and more" : ""}.`
          );
        }
        return;
      }

      // 7. Complete a task.
      const doneM = text.match(
        /^(done|finished|completed|did|mark done|check off|knocked out)\b[:\s]*(.+)?$/i
      );
      if (doneM) {
        const title = (doneM[2] || "").trim();
        if (!title) {
          push(
            "porchlight",
            "Which one did you finish? Tell me and I will check it off."
          );
          return;
        }
        window.dispatchEvent(
          new CustomEvent("porchlight:complete-task", { detail: { title } })
        );
        push(
          "porchlight",
          `Done: ${title}. Small steps count, and that one counted.`
        );
        return;
      }

      // 8. List tasks (answered from props, no round trip).
      if (
        /^(what'?s|what is|show|list|my)\b.*(on |my )?(list|tasks|to-?do)/i.test(
          text
        ) ||
        /my list/.test(lower)
      ) {
        const open = tasks.filter((t) => !t.done);
        if (open.length === 0) {
          push(
            "porchlight",
            "Your list is empty. Beautiful. Want to add something, or enjoy the clear sky?"
          );
        } else {
          const top = orderWinsByEnergy(open, energy)
            .slice(0, 4)
            .map((t, i) => `${i + 1}. ${t.title}`)
            .join("\n");
          push(
            "porchlight",
            `You have ${open.length} open. For ${energy} energy, I would start here:\n${top}`
          );
        }
        return;
      }

      // 9. Sprint.
      if (/sprint|focus|timer|pomodoro/.test(lower)) {
        const m = text.match(/sprint (?:on|for)?\s*(.+)/i);
        const goal =
          m?.[1]?.trim() ||
          nextUpForEnergy(tasks.filter((t) => !t.done), energy)?.title ||
          "";
        onStartSprint(goal);
        push(
          "porchlight",
          goal
            ? `Locked in: ${goal}. I opened the timer in Focus, tap Start when you are ready.`
            : "What should we sprint on? Name it and I will set the timer."
        );
        return;
      }

      // 10. Debrief.
      if (/debrief|reflect|retro/.test(lower)) {
        try {
          const rawS = localStorage.getItem("porchlight:last-sprint:v1");
          if (!rawS) {
            push(
              "porchlight",
              "No finished sprint found yet. Run one in Focus, then come back and we will debrief."
            );
            return;
          }
          const s = JSON.parse(rawS);
          const summary = await askDebrief(
            s.goal || "a focus sprint",
            s.minutes || 20
          );
          push("porchlight", summary);
        } catch {
          push(
            "porchlight",
            "The debrief gremlins ate that one. Tell me how the sprint went in your own words?"
          );
        }
        return;
      }

      // 11. Free conversation.
      await replyLLM([...messages, { role: "user", text }]);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="pl-card p-5">
      {/* Hero */}
      <div className="flex items-center gap-4 mb-4">
        <Lantern energy={energy} size={52} />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg text-[#f3ecdc]">
            {dayGreeting()}, I am Porchlight
          </h2>
          <p className="text-xs text-[#8b93ab]">{prettyDate()}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-amber-300 text-sm font-semibold shrink-0">
            <FlameIcon className="w-4 h-4" />
            {streak}
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => send(c)}
            disabled={busy}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20 transition disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-2.5 mb-4 max-h-72 overflow-y-auto pr-0.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`msg-in flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-amber-400 text-[#1a1206] rounded-br-md font-medium"
                    : "bg-white/[0.07] text-[#e9e2d0] border border-white/10 rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-white/[0.07] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="typing-dot w-1.5 h-1.5 rounded-full bg-amber-300"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            awaitingDump
              ? "Dump everything here..."
              : "Talk to me, or try: Add buy milk"
          }
          className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f3ecdc] placeholder-[#6b7390] outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20 transition"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="bg-amber-400 text-[#1a1206] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-amber-300 transition disabled:opacity-40 flex items-center"
          aria-label="Send message"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </form>
      <p className="text-[11px] text-[#6b7390] mt-2">
        AI replies use a free public model. Your tasks and check-ins stay on
        this device.
      </p>
    </div>
  );
}

// Re-exported for tests: rule-based splitting used as the offline fallback.
export { splitTasks };
