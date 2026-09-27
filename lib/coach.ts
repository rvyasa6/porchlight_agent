/* Porchlight Agent coaching content + rule-based companion engine.
 * Fully client-side: no backend, no API costs. */

export type Energy = "low" | "medium" | "high";

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
  "Put one plate in the sink",
  "Reply to one simple message",
  "Fold three items of laundry",
  "Open the document and write one line",
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
  type: "start-sprint";
  minutes: number;
}

export interface CoachReply {
  reply: string;
  action?: CoachAction;
}

export function coachRespond(raw: string): CoachReply {
  const text = raw.toLowerCase();

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
