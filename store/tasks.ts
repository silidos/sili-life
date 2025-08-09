import { create } from 'zustand';
import dayjs from '../lib/dates';

export type Task = { id: string; title: string; sort: number };

type TaskForDate = {
  task: Task;
  checked: boolean;
  isDefault: boolean;
  isDay: boolean;
};

type State = {
  tasks: Task[]; // default/master tasks
  dayAdds: Record<string, Task[]>; // tasks that exist only on a given date
  dayRemovals: Record<string, Set<string>>; // default task ids hidden for a date
  completions: Record<string, Set<string>>; // per-date completions

  toggleToday: (taskId: string) => void;
  toggleForDate: (taskId: string, ymd: string) => void;

  tasksForDate: (ymd?: string) => TaskForDate[];

  addTask: (title: string) => void;            // add default
  removeTask: (taskId: string) => void;        // remove default everywhere

  addDayTask: (title: string, ymd?: string) => void;     // add only for date
  removeDayTask: (taskId: string, ymd?: string) => void; // remove only for date

  removeDefaultForDate: (taskId: string, ymd?: string) => void; // hide default on date
  restoreDefaultForDate: (taskId: string, ymd?: string) => void; // unhide default on date
};

const seedTasks: Task[] = [
  { id: 't1', title: 'Task 1', sort: 1 },
  { id: 't2', title: 'Task 2', sort: 2 },
  { id: 't3', title: 'Task 3', sort: 3 },
];

function todayYMD() {
  return dayjs().format('YYYY-MM-DD');
}

export const useTasks = create<State>((set, get) => ({
  tasks: seedTasks,
  dayAdds: {},
  dayRemovals: {},
  completions: {},

  toggleToday: (taskId) => {
    const ymd = todayYMD();
    get().toggleForDate(taskId, ymd);
  },

  toggleForDate: (taskId, ymd) =>
    set((s) => {
      const setForDay = new Set(s.completions[ymd] ?? []);
      if (setForDay.has(taskId)) setForDay.delete(taskId);
      else setForDay.add(taskId);
      return { completions: { ...s.completions, [ymd]: setForDay } };
    }),

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

  addTask: (title) =>
    set((s) => {
      const next: Task = { id: `t${Date.now()}`, title, sort: s.tasks.length + 1 };
      return { tasks: [...s.tasks, next] };
    }),

  removeTask: (taskId) =>
    set((s) => {
      const tasks = s.tasks.filter((t) => t.id !== taskId);

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
    }),

  addDayTask: (title, ymd = todayYMD()) =>
    set((s) => {
      const list = s.dayAdds[ymd] ? [...s.dayAdds[ymd]] : [];
      const next: Task = { id: `d-${ymd}-${Date.now()}`, title, sort: (s.tasks.length + list.length + 1) };
      list.push(next);
      return { dayAdds: { ...s.dayAdds, [ymd]: list } };
    }),

  removeDayTask: (taskId, ymd = todayYMD()) =>
    set((s) => {
      const list = s.dayAdds[ymd] ? s.dayAdds[ymd].filter((t) => t.id !== taskId) : [];
      const comp = new Set(s.completions[ymd] ?? []);
      comp.delete(taskId);
      return { dayAdds: { ...s.dayAdds, [ymd]: list }, completions: { ...s.completions, [ymd]: comp } };
    }),

  removeDefaultForDate: (taskId, ymd = todayYMD()) =>
    set((s) => {
      const setForDay = new Set(s.dayRemovals[ymd] ?? []);
      setForDay.add(taskId);
      const comp = new Set(s.completions[ymd] ?? []);
      comp.delete(taskId);
      return {
        dayRemovals: { ...s.dayRemovals, [ymd]: setForDay },
        completions: { ...s.completions, [ymd]: comp },
      };
    }),

  restoreDefaultForDate: (taskId, ymd = todayYMD()) =>
    set((s) => {
      const setForDay = new Set(s.dayRemovals[ymd] ?? []);
      setForDay.delete(taskId);
      return { dayRemovals: { ...s.dayRemovals, [ymd]: setForDay } };
    }),
}));