"use client";

import type { Energy } from "../lib/coach";

const GLOW: Record<Energy, string> = {
  high: "opacity-90 scale-100",
  medium: "opacity-55 scale-90",
  low: "opacity-30 scale-75",
};

/** The little paper lantern mark. Glows brighter with higher energy. */
export function Lantern({
  energy,
  size = 64,
}: {
  energy: Energy;
  size?: number;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size * 1.35 }}
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 rounded-full bg-amber-400 blur-2xl transition-all duration-700 ${GLOW[energy]}`}
      />
      <svg
        viewBox="0 0 64 92"
        className="lantern-sway relative w-full h-full"
      >
        <defs>
          <radialGradient id="pl-body" cx="42%" cy="36%" r="75%">
            <stop offset="0%" stopColor="#ffd97a" />
            <stop offset="60%" stopColor="#f5b942" />
            <stop offset="100%" stopColor="#dd9426" />
          </radialGradient>
        </defs>
        <line x1="32" y1="0" x2="32" y2="9" stroke="#7a5c2e" strokeWidth="2.5" />
        <rect x="22" y="9" width="20" height="8" rx="3.5" fill="#2c2113" />
        <ellipse cx="32" cy="48" rx="22" ry="29" fill="url(#pl-body)" />
        <path
          d="M32 19v58M18.5 26c-4 6-4 32 0 44M45.5 26c4 6 4 32 0 44"
          stroke="#b97a1e"
          strokeWidth="1.6"
          fill="none"
          opacity="0.55"
        />
        <ellipse cx="25" cy="38" rx="6" ry="10" fill="#ffe9b8" opacity="0.5" />
        <rect x="22" y="77" width="20" height="8" rx="3.5" fill="#2c2113" />
        <line x1="32" y1="85" x2="32" y2="91" stroke="#7a5c2e" strokeWidth="2" />
        <circle cx="32" cy="91" r="1.6" fill="#f5b942" />
      </svg>
    </div>
  );
}

const FLIES = [
  { left: "6%", top: "18%", s: 7, d: "8s", dl: "0s" },
  { left: "14%", top: "64%", s: 5, d: "6.5s", dl: "1.2s" },
  { left: "22%", top: "34%", s: 6, d: "9s", dl: "0.6s" },
  { left: "35%", top: "78%", s: 5, d: "7.5s", dl: "2s" },
  { left: "48%", top: "12%", s: 7, d: "8.5s", dl: "0.3s" },
  { left: "58%", top: "52%", s: 5, d: "6s", dl: "1.6s" },
  { left: "70%", top: "26%", s: 6, d: "9.5s", dl: "0.9s" },
  { left: "78%", top: "70%", s: 5, d: "7s", dl: "2.4s" },
  { left: "88%", top: "42%", s: 7, d: "8s", dl: "1.1s" },
  { left: "93%", top: "14%", s: 5, d: "6.8s", dl: "0.2s" },
  { left: "42%", top: "90%", s: 6, d: "9.2s", dl: "1.9s" },
  { left: "64%", top: "86%", s: 5, d: "7.8s", dl: "0.5s" },
];

/** Drifting firefly dots across the night sky. Pure CSS, zero cost. */
export function Fireflies() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {FLIES.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={{
            left: f.left,
            top: f.top,
            width: f.s,
            height: f.s,
            animationDuration: f.d,
            animationDelay: f.dl,
          }}
        />
      ))}
    </div>
  );
}
