"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { categorizeTask, type Category } from "./coach";
import { parseTasks, splitTasks } from "./llm";
import { touchStreakDay } from "./companion";

export interface Task {
  id: string;
  title: string;
  category: Category;
  done: boolean;
  createdAt: number;
  plannedFor?: string;
  key?: boolean;
  due?: string;
}

export interface NewTask {
  title: string;
  category: Category;
  plannedFor?: string;
  due?: string;
}

const KEY = "porchlight:tasks:v1";

function load(): Task[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t) => t && typeof t.title === "string")
      .map((t) => ({
        id: String(
          t.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        ),
        title: String(t.title),
        category: (t.category as Category) ?? "other",
        done: !!t.done,
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        plannedFor:
          typeof t.plannedFor === "string" ? t.plannedFor : undefined,
        key: !!t.key,
        due: typeof t.due === "string" ? t.due : undefined,
      }));
  } catch {
    return [];
  }
}

function persist(tasks: Task[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    /* ignore */
  }
}

export function toTasks(items: NewTask[]): Task[] {
  const now = Date.now();
  return items.map((it, i) => ({
    id: `${now}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    title: it.title,
    category: it.category,
    done: false,
    createdAt: now + i,
    plannedFor: it.plannedFor,
    due: it.due,
  }));
}

/** Split messy input into clean categorized tasks: LLM first, rules fallback. */
export async function smartAddTasks(
  text: string,
  plannedFor?: string,
  due?: string
): Promise<NewTask[]> {
  try {
    const titles = await parseTasks(text);
    return titles.map((title) => ({
      title,
      category: categorizeTask(title),
      plannedFor,
      due,
    }));
  } catch {
    return splitTasks(text).map((title) => ({
      title,
      category: categorizeTask(title),
      plannedFor,
      due,
    }));
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const ref = useRef<Task[]>([]);

  useEffect(() => {
    const t = load();
    ref.current = t;
    setTasks(t);
  }, []);

  const update = useCallback((fn: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const next = fn(prev);
      ref.current = next;
      persist(next);
      return next;
    });
  }, []);

  const addTasks = useCallback(
    (items: NewTask[]) => {
      if (!items.length) return;
      update((prev) => [...toTasks(items), ...prev]);
    },
    [update]
  );

  const toggleTask = useCallback(
    (id: string) => {
      update((prev) => {
        const t = prev.find((x) => x.id === id);
        if (t && !t.done) touchStreakDay();
        return prev.map((x) =>
          x.id === id ? { ...x, done: !x.done } : x
        );
      });
    },
    [update]
  );

  const removeTask = useCallback(
    (id: string) => {
      update((prev) => prev.filter((t) => t.id !== id));
    },
    [update]
  );

  const toggleKey = useCallback(
    (id: string) => {
      update((prev) =>
        prev.map((t) => (t.id === id ? { ...t, key: !t.key } : t))
      );
    },
    [update]
  );

  const clearDone = useCallback(() => {
    update((prev) => prev.filter((t) => !t.done));
  }, [update]);

  const moveToToday = useCallback(
    (id: string) => {
      update((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, plannedFor: undefined } : t
        )
      );
    },
    [update]
  );

  // Bridge so the chat can add/complete tasks via CustomEvents.
  useEffect(() => {
    const onAdd = (e: Event) => {
      const items = (e as CustomEvent).detail?.tasks as
        | NewTask[]
        | undefined;
      if (items && items.length) addTasks(items);
    };
    const onComplete = (e: Event) => {
      const title = String((e as CustomEvent).detail?.title ?? "")
        .trim()
        .toLowerCase();
      if (!title) return;
      update((prev) => {
        const idx = prev.findIndex(
          (t) => !t.done && t.title.toLowerCase().includes(title)
        );
        if (idx === -1) return prev;
        touchStreakDay();
        const next = [...prev];
        next[idx] = { ...next[idx], done: true };
        return next;
      });
    };
    window.addEventListener("porchlight:add-tasks", onAdd);
    window.addEventListener("porchlight:complete-task", onComplete);
    return () => {
      window.removeEventListener("porchlight:add-tasks", onAdd);
      window.removeEventListener("porchlight:complete-task", onComplete);
    };
  }, [addTasks, update]);

  return {
    tasks,
    addTasks,
    toggleTask,
    removeTask,
    toggleKey,
    clearDone,
    moveToToday,
  };
}

export type UseTasks = ReturnType<typeof useTasks>;
