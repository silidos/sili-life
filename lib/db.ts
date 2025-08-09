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
}
