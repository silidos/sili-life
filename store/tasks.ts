import { create } from 'zustand';
import dayjs from '../lib/dates';
import { db, migrate } from '../lib/db';

export type Task = { id: string; title: string; sort: number };

type TaskForDate = {
  task: Task;
  checked: boolean;
  isDefault: boolean;
  isDay: boolean;
};

type State = {
  tasks: Task[]; // defaults (archived filtered out)
  dayAdds: Record<string, Task[]>; // ymd -> Task[]
  dayRemovals: Record<string, Set<string>>; // ymd -> default task ids
  completions: Record<string, Set<string>>; // ymd -> completed ids
  hydrated: boolean;

  hydrate: (ymd?: string) => void;
  toggleToday: (taskId: string) => void;
  toggleForDate: (taskId: string, ymd: string) => void;
  tasksForDate: (ymd?: string) => TaskForDate[];

  addTask: (title: string) => void;
  removeTask: (taskId: string) => void;
  addDayTask: (title: string, ymd?: string) => void;
  removeDayTask: (taskId: string, ymd?: string) => void;
  removeDefaultForDate: (taskId: string, ymd?: string) => void;
  restoreDefaultForDate: (taskId: string, ymd?: string) => void;
};

function todayYMD() {
  return dayjs().format('YYYY-MM-DD');
}

function newId(prefix: string) {
  return `${prefix}${Date.now()}`;
}
function completionId(ymd: string, taskId: string) {
  return `c-${ymd}-${taskId}`;
}

// Ensure tables needed by the store exist (without modifying db.ts)
function ensureExtraTables() {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS day_adds (
        id TEXT PRIMARY KEY,
        ymd TEXT NOT NULL,
        title TEXT NOT NULL,
        sort INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS day_hides (
        ymd TEXT NOT NULL,
        taskId TEXT NOT NULL,
        PRIMARY KEY (ymd, taskId)
      );
      CREATE INDEX IF NOT EXISTS idx_day_adds_ymd ON day_adds(ymd);
      CREATE INDEX IF NOT EXISTS idx_task_completions_ymd ON task_completions(ymd);
    `);
  } catch (e) {
    console.warn('ensureExtraTables failed', e);
  }
}

export const useTasks = create<State>((set, get) => ({
  tasks: [],
  dayAdds: {},
  dayRemovals: {},
  completions: {},
  hydrated: false,

  hydrate: (ymd = todayYMD()) => {
    try {
      migrate();            // from db.ts
      ensureExtraTables();  // store-local
    } catch (e) {
      console.warn('migrate/ensure tables failed', e);
    }
    try {
      const defaults = db.getAllSync<{ id: string; title: string; sort: number }>(
        `SELECT id, title, sort FROM tasks WHERE archived = 0 ORDER BY sort ASC`
      );
      const addRows = db.getAllSync<{ id: string; title: string; sort: number }>(
        `SELECT id, title, sort FROM day_adds WHERE ymd = ? ORDER BY sort ASC`,
        [ymd]
      );
      const hideRows = db.getAllSync<{ taskId: string }>(
        `SELECT taskId FROM day_hides WHERE ymd = ?`,
        [ymd]
      );
      const compRows = db.getAllSync<{ taskId: string }>(
        `SELECT taskId FROM task_completions WHERE ymd = ? AND completed = 1`,
        [ymd]
      );

      set(s => ({
        tasks: defaults as Task[],
        dayAdds: { ...s.dayAdds, [ymd]: addRows as Task[] },
        dayRemovals: { ...s.dayRemovals, [ymd]: new Set(hideRows.map(r => r.taskId)) },
        completions: { ...s.completions, [ymd]: new Set(compRows.map(r => r.taskId)) },
        hydrated: true,
      }));
    } catch (e) {
      console.warn('hydrate() failed', e);
    }
  },

  toggleToday: (taskId) => {
    const ymd = todayYMD();
    get().toggleForDate(taskId, ymd);
  },

  toggleForDate: (taskId, ymd) => {
    const current = get().completions[ymd] ?? new Set<string>();
    const next = new Set(current);
    const has = next.has(taskId);

    if (has) {
      try {
        db.runSync(`DELETE FROM task_completions WHERE ymd = ? AND taskId = ?`, [ymd, taskId]);
      } catch {}
      next.delete(taskId);
    } else {
      try {
        db.runSync(
          `INSERT OR REPLACE INTO task_completions (id, taskId, ymd, completed) VALUES (?,?,?,1)`,
          [completionId(ymd, taskId), taskId, ymd]
        );
      } catch {}
      next.add(taskId);
    }
    set(s => ({ completions: { ...s.completions, [ymd]: next } }));
  },

  tasksForDate: (ymd = todayYMD()) => {
    const { tasks, dayAdds, dayRemovals, completions } = get();
    const removed = dayRemovals[ymd] ?? new Set<string>();
    const added = dayAdds[ymd] ?? [];
    const done = completions[ymd] ?? new Set<string>();

    const visibleDefaults = tasks
      .filter((t) => !removed.has(t.id))
      .map((t) => ({ task: t, isDefault: true as const, isDay: false as const }));

    const dayOnly = added.map((t) => ({ task: t, isDefault: false as const, isDay: true as const }));

    const merged = [
      ...visibleDefaults.sort((a, b) => a.task.sort - b.task.sort),
      ...dayOnly.sort((a, b) => a.task.sort - b.task.sort),
    ];

    return merged.map(({ task, isDefault, isDay }) => ({
      task,
      isDefault,
      isDay,
      checked: done.has(task.id),
    }));
  },

  addTask: (title) => {
    const next: Task = { id: newId('t'), title, sort: get().tasks.length + 1 };
    try {
      db.runSync(`INSERT INTO tasks (id, title, sort, archived) VALUES (?,?,?,0)`, [
        next.id,
        next.title,
        next.sort,
      ]);
    } catch (e) {
      console.warn('addTask failed', e);
    }
    set(s => ({ tasks: [...s.tasks, next] }));
  },

  removeTask: (taskId) => {
    try {
      db.runSync(`UPDATE tasks SET archived = 1 WHERE id = ?`, [taskId]);
      db.runSync(`DELETE FROM day_hides WHERE taskId = ?`, [taskId]);
      db.runSync(`DELETE FROM task_completions WHERE taskId = ?`, [taskId]);
    } catch (e) {
      console.warn('removeTask failed', e);
    }

    set(s => {
      const tasks = s.tasks.filter(t => t.id !== taskId);
      const dayRemovals: State['dayRemovals'] = {};
      for (const [k, setIds] of Object.entries(s.dayRemovals)) {
        const clone = new Set(setIds);
        clone.delete(taskId);
        dayRemovals[k] = clone;
      }
      const completions: State['completions'] = {};
      for (const [k, setIds] of Object.entries(s.completions)) {
        const clone = new Set(setIds);
        clone.delete(taskId);
        completions[k] = clone;
      }
      return { tasks, dayRemovals, completions };
    });
  },

  addDayTask: (title, ymd = todayYMD()) => {
    const id = `d-${ymd}-${Date.now()}`;
    const sort = get().tasks.length + (get().dayAdds[ymd]?.length ?? 0) + 1;
    try {
      db.runSync(`INSERT INTO day_adds (id, ymd, title, sort) VALUES (?,?,?,?)`, [
        id, ymd, title, sort,
      ]);
    } catch (e) {
      console.warn('addDayTask failed', e);
    }
    set(s => {
      const list = s.dayAdds[ymd] ? [...s.dayAdds[ymd]] : [];
      list.push({ id, title, sort });
      return { dayAdds: { ...s.dayAdds, [ymd]: list } };
    });
  },

  removeDayTask: (taskId, ymd = todayYMD()) => {
    try {
      db.runSync(`DELETE FROM day_adds WHERE id = ?`, [taskId]);
      db.runSync(`DELETE FROM task_completions WHERE ymd = ? AND taskId = ?`, [ymd, taskId]);
    } catch (e) {
      console.warn('removeDayTask failed', e);
    }
    set(s => {
      const list = s.dayAdds[ymd] ? s.dayAdds[ymd].filter(t => t.id !== taskId) : [];
      const comp = new Set(s.completions[ymd] ?? []);
      comp.delete(taskId);
      return { dayAdds: { ...s.dayAdds, [ymd]: list }, completions: { ...s.completions, [ymd]: comp } };
    });
  },

  removeDefaultForDate: (taskId, ymd = todayYMD()) => {
    try {
      db.runSync(`INSERT OR IGNORE INTO day_hides (ymd, taskId) VALUES (?,?)`, [ymd, taskId]);
      db.runSync(`DELETE FROM task_completions WHERE ymd = ? AND taskId = ?`, [ymd, taskId]);
    } catch (e) {
      console.warn('removeDefaultForDate failed', e);
    }
    set(s => {
      const setForDay = new Set(s.dayRemovals[ymd] ?? []);
      setForDay.add(taskId);
      const comp = new Set(s.completions[ymd] ?? []);
      comp.delete(taskId);
      return {
        dayRemovals: { ...s.dayRemovals, [ymd]: setForDay },
        completions: { ...s.completions, [ymd]: comp },
      };
    });
  },

  restoreDefaultForDate: (taskId, ymd = todayYMD()) => {
    try {
      db.runSync(`DELETE FROM day_hides WHERE ymd = ? AND taskId = ?`, [ymd, taskId]);
    } catch (e) {
      console.warn('restoreDefaultForDate failed', e);
    }
    set(s => {
      const setForDay = new Set(s.dayRemovals[ymd] ?? []);
      setForDay.delete(taskId);
      return { dayRemovals: { ...s.dayRemovals, [ymd]: setForDay } };
    });
  },
}));