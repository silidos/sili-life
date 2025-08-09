import * as SQLite from 'expo-sqlite';
export const db = SQLite.openDatabaseSync('daily_nest.db');

export function migrate() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, sort INTEGER NOT NULL, archived INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS task_completions (
      id TEXT PRIMARY KEY, taskId TEXT NOT NULL, ymd TEXT NOT NULL, completed INTEGER NOT NULL,
      UNIQUE(taskId, ymd)
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT, content TEXT NOT NULL,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
  `);
  db.execSync(`
    PRAGMA journal_mode = WAL;
  
    -- existing tables you already have...
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sort INTEGER NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );
  
    CREATE TABLE IF NOT EXISTS task_completions (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      ymd TEXT NOT NULL,
      completed INTEGER NOT NULL,
      UNIQUE(taskId, ymd)
    );
  
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  
    -- NEW: tasks added only for a specific date
    CREATE TABLE IF NOT EXISTS day_adds (
      id TEXT PRIMARY KEY,
      ymd TEXT NOT NULL,
      title TEXT NOT NULL,
      sort INTEGER NOT NULL
    );
  
    -- NEW: hide a default task for a specific date
    CREATE TABLE IF NOT EXISTS day_hides (
      ymd TEXT NOT NULL,
      taskId TEXT NOT NULL,
      PRIMARY KEY (ymd, taskId)
    );
  
    -- helpful indexes
    CREATE INDEX IF NOT EXISTS idx_day_adds_ymd ON day_adds(ymd);
    CREATE INDEX IF NOT EXISTS idx_completions_ymd ON task_completions(ymd);
  `);
}
