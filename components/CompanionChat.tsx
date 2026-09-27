"use client";

import { useEffect, useRef, useState } from "react";
import { coachRespond } from "../lib/coach";

interface Msg {
  from: "you" | "porch";
  text: string;
}

export function CompanionChat({ onStartSprint }: { onStartSprint: (minutes: number) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const { reply, action } = coachRespond(text);
    setMsgs((m) => [...m, { from: "you", text }, { from: "porch", text: reply }]);
    if (action?.type === "start-sprint") onStartSprint(action.minutes);
    setInput("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      {msgs.length > 0 && (
        <div className="max-h-56 overflow-y-auto mb-4 space-y-2 pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
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
          placeholder="Try: Help me sprint for 30 minutes"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
        />
        <button
          onClick={send}
          className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
