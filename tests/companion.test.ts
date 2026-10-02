import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dayGreeting,
  buildContextLine,
  planMyDay,
  getStreak,
  last7Days,
} from "../lib/companion.js";
import { splitTasks } from "../lib/llm.js";
import { buildCompanionSystem } from "../lib/llm.js";
import type { Task } from "../lib/taskStore.js";

test("dayGreeting matches the hour", () => {
  assert.equal(dayGreeting(new Date(2026, 9, 1, 8)), "Good morning");
  assert.equal(dayGreeting(new Date(2026, 9, 1, 13)), "Good afternoon");
  assert.equal(dayGreeting(new Date(2026, 9, 1, 20)), "Good evening");
  assert.equal(dayGreeting(new Date(2026, 9, 1, 2)), "Up late");
});

test("streak helpers are safe without a browser", () => {
  assert.equal(getStreak(), 0);
  assert.equal(last7Days().length, 7);
});

test("buildContextLine summarizes the day", () => {
  const line = buildContextLine({
    tasks: [
      {
        id: "1",
        title: "Buy milk",
        category: "shopping",
        done: true,
        createdAt: 1,
      },
      {
        id: "2",
        title: "Write report",
        category: "productivity",
        done: false,
        createdAt: 2,
      },
    ] as Task[],
    energy: "low",
    streak: 3,
    winsToday: 1,
  });
  assert.match(line, /1\/2 tasks done/);
  assert.match(line, /low/);
  assert.match(line, /3 day/);
});

test("planMyDay is empty-state aware", () => {
  assert.match(planMyDay([], "high"), /list is clear/);
});

test("planMyDay orders overdue and key tasks first", () => {
  const tasks: Task[] = [
    { id: "a", title: "Easy thing", category: "other", done: false, createdAt: 1 },
    {
      id: "b",
      title: "Overdue bill",
      category: "productivity",
      done: false,
      createdAt: 2,
      due: "2026-01-01",
    },
    {
      id: "c",
      title: "Key launch",
      category: "productivity",
      done: false,
      createdAt: 3,
      key: true,
    },
  ];
  const plan = planMyDay(tasks, "medium", "2026-10-01");
  const lines = plan.split("\n").filter((l) => /^\d\./.test(l));
  assert.match(lines[0], /Overdue bill/);
  assert.match(lines[1], /Key launch/);
  assert.match(plan, /overdue, do this first/);
});

test("splitTasks breaks messy input into clean items", () => {
  const out = splitTasks("buy milk, eggs and bread; call mom");
  assert.ok(out.length >= 3);
  assert.ok(out.every((t) => t.length >= 2));
  assert.equal(splitTasks("   ").length, 0);
  assert.ok(splitTasks("1. buy milk 2. call mom").length >= 2);
});

test("buildCompanionSystem carries energy and context", () => {
  const s = buildCompanionSystem("low", "Today: 0/0 tasks done.");
  assert.match(s, /low energy/);
  assert.match(s, /Today: 0\/0/);
  assert.match(s, /45 words/);
});
