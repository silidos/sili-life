import { create } from 'zustand';
import dayjs from '../lib/dates';

type Task = { id: string; title: string; sort: number; };

type State = {
  tasks: Task[];
  completions: Record<string, Set<string>>;
  toggleToday: (taskId: string) => void;
  tasksForDate: (ymd?: string) => { task: Task; checked: boolean }[];
  addTask: (title: string) => void;
};

const seedTasks: Task[] = [
  { id: 't1', title: 'Task 1', sort: 1 },
  { id: 't2', title: 'Task 2', sort: 2 },
  { id: 't3', title: 'Task 3', sort: 3 },
];

export const useTasks = create<State>((set, get) => ({
  tasks: seedTasks,
  completions: {},
  toggleToday: (taskId) => set((s) => {
    const ymd = dayjs().format('YYYY-MM-DD');
    const setForDay = new Set(s.completions[ymd] ?? []);
    if (setForDay.has(taskId)) setForDay.delete(taskId); else setForDay.add(taskId);
    return { completions: { ...s.completions, [ymd]: setForDay } };
  }),
  tasksForDate: (ymd = dayjs().format('YYYY-MM-DD')) => {
    const { tasks, completions } = get();
    const done = completions[ymd] ?? new Set<string>();
    return [...tasks].sort((a, b) => a.sort - b.sort).map(task => ({ task, checked: done.has(task.id) }));
  },
  addTask: (title) => set((s) => {
    const next: Task = { id: `t${Date.now()}`, title, sort: s.tasks.length + 1 };
    return { tasks: [...s.tasks, next] };
  }),
}));