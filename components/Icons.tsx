import type { ReactNode } from "react";

type P = { className?: string; filled?: boolean };

function Svg({
  className,
  filled,
  children,
}: P & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ChatIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
);

export const TasksIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M9 6h12M9 12h12M9 18h12" />
    <path d="m3.5 6 1 1 2-2" />
    <path d="m3.5 12 1 1 2-2" />
    <path d="m3.5 18 1 1 2-2" />
  </Svg>
);

export const TimerIcon = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5" />
    <path d="M9 2h6" />
  </Svg>
);

export const WinsIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </Svg>
);

export const SendIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </Svg>
);

export const PlusIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const StarIcon = ({ className, filled }: P) => (
  <Svg className={className} filled={filled}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
  </Svg>
);

export const PlayIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M7 4.5v15l12-7.5z" />
  </Svg>
);

export const PauseIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M9 4.5v15M15 4.5v15" />
  </Svg>
);

export const XIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const CheckIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const CalendarIcon = ({ className }: P) => (
  <Svg className={className}>
    <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
    <path d="M8 2.5v4M16 2.5v4M3 10h18" />
  </Svg>
);

export const FlameIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.1-2-5.3-3.7-7C14.2 6 13 4.5 13 2.5c-3 2-4.5 4.2-5.3 6.3-.4-1-.6-2-.7-3.1C5.4 7.3 4.5 9.9 4.5 12.4 4.5 18 7.6 22 12 22z" />
  </Svg>
);

export const TrashIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Svg>
);

export const ZapIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
  </Svg>
);

export const ChevronRightIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

export const TargetIcon = ({ className }: P) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" />
  </Svg>
);

export const EyeOffIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
    <path d="m1 1 22 22" />
  </Svg>
);

export const BellIcon = ({ className }: P) => (
  <Svg className={className}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
);
