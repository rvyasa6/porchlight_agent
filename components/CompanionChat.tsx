"use client";

import { useEffect, useRef, useState } from "react";
import {
  coachRespond,
  dueLabel,
  type CoachAction,
  type Effort,
} from "../lib/coach";
import { fetchLLMReply, parseLLMTags } from "../lib/llm";
import type { AddWinOptions, AddWinResult } from "../hooks/useTinyWins";

interface Msg {
  from: "you" | "porch";
  text: string;
}

interface Props {
  onStartSprint: (minutes: number) => void;
  onAddWin: (text: string, opts?: AddWinOptions) => AddWinResult;
  /** Messages pushed in from outside the chat, e.g. the end-of-sprint debrief. */
  incoming: { id: number; text: string } | null;
}

export function CompanionChat({ onStartSprint, onAddWin, incoming }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIncomingId = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, thinking]);

  // External messages (sprint debrief) join the conversation once.
  useEffect(() => {
    if (incoming && incoming.id !== lastIncomingId.current) {
      lastIncomingId.current = incoming.id;
      setMsgs((m) => [...m, { from: "porch", text: incoming.text }]);
    }
  }, [incoming]);

  const confirmAddWin = (
    text: string,
    opts?: AddWinOptions
  ): string => {
    const res = onAddWin(text, opts);
    if (res === "added") {
      const when = opts?.due ? ` for ${dueLabel(opts.due)}` : "";
      const flag = opts?.important ? " Marked as a key task." : "";
      return `Added "${text}"${when} to your tiny wins.${flag} Small steps count.`;
    }
    if (res === "duplicate") return `"${text}" is already on your tiny wins list.`;
    return `I did not catch a task there. Try "Add drink water to my list".`;
  };

  const applyAction = (action: CoachAction, say: (t: string) => void) => {
    if (action.type === "start-sprint" && action.minutes) {
      onStartSprint(action.minutes);
    } else if (action.type === "add-win" && action.text) {
      say(
        confirmAddWin(action.text, {
          effort: action.effort as Effort | undefined,
          important: action.important,
          due: action.due,
        })
      );
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setMsgs((m) => [...m, { from: "you", text }]);
    const say = (t: string) =>
      setMsgs((m) => [...m, { from: "porch", text: t }]);

    // Rule-based engine first: instant for commands like sprints and tasks.
    const { reply, action } = coachRespond(text);
    if (action?.type === "add-win") {
      applyAction(action, say);
      return;
    }
    if (action?.type === "start-sprint") {
      applyAction(action, say);
      say(reply);
      return;
    }

    // Free LLM for open conversation, with the rule-based reply as fallback.
    setThinking(true);
    try {
      const llm = await fetchLLMReply(text);
      if (llm) {
        const { clean, tasks, sprintMinutes } = parseLLMTags(llm);
        if (clean) say(clean);
        tasks.forEach((t) => say(confirmAddWin(t)));
        if (sprintMinutes) onStartSprint(sprintMinutes);
        if (!clean && tasks.length === 0 && !sprintMinutes) say(reply);
      } else {
        say(reply);
      }
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-500">Porchlight chat</h2>
        <span className="text-[11px] text-gray-400">AI companion · free</span>
      </div>

      {msgs.length > 0 && (
        <div className="max-h-56 overflow-y-auto mb-4 space-y-2 pr-1">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  m.from === "you"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 rounded-2xl rounded-bl-md px-3 py-2 text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">·</span>
                  <span className="animate-pulse">·</span>
                  <span className="animate-pulse">·</span>
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <label className="text-xs text-gray-400 block mb-1.5">Type a message</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder='Try: Add call mom for tomorrow'
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
        />
        <button
          onClick={send}
          disabled={thinking}
          className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        AI replies use a free public model. Your check-ins and wins stay on
        this device.
      </p>
    </div>
  );
}
