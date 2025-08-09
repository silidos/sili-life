import dayjs from 'dayjs';
import { db } from './db';
import { v4 as uuid } from 'uuid';

export function getTasksForDate(ymd = dayjs().format('YYYY-MM-DD')) {
  const tasks = db.getAllSync<{id:string; title:string; sort:number; archived:number}>(
    'SELECT * FROM tasks WHERE archived = 0 ORDER BY sort ASC'
  );
  const done = new Set(
    db.getAllSync<{taskId:string}>('SELECT taskId FROM task_completions WHERE ymd = ?', [ymd]).map(r => r.taskId)
  );
  return tasks.map(t => ({ ...t, checked: done.has(t.id) }));
}

export function toggleTaskForToday(taskId: string) {
  const ymd = dayjs().format('YYYY-MM-DD');
  try {
    db.execSync(
      `INSERT INTO task_completions (id, taskId, ymd, completed) VALUES ('${uuid()}', '${taskId}', '${ymd}', 1)`
    );
  } catch {
    // already exists -> uncheck
    db.execSync(`DELETE FROM task_completions WHERE taskId='${taskId}' AND ymd='${ymd}'`);
  }
}
