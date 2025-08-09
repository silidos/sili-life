import { create } from 'zustand';
import { db, migrate } from '../lib/db';

export type NoteType = 'free' | 'chatgpt' | 'recipe' | 'workout' | 'grocery' | 'todo';
export type Note = { id: string; type: NoteType; title: string; content: string; createdAt: number; updatedAt: number };

type State = {
  notes: Note[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addNote: (type: NoteType, title: string) => Promise<string>;
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) => Promise<void>;
  getNote: (id: string) => Note | undefined;
};

export const useNotes = create<State>((set, get) => ({
  notes: [],
  hydrated: false,

  hydrate: async () => {
    try {
      migrate();

      const rows = db.getAllSync<{ id: string; type: NoteType; title: string; content: string; createdAt: number; updatedAt: number }>(
        'SELECT id, type, title, content, createdAt, updatedAt FROM notes ORDER BY updatedAt DESC'
      );

      const notes: Note[] = rows.map((row) => ({
        id: String(row.id),
        type: row.type,
        title: row.title ?? '',
        content: row.content ?? '',
        createdAt: Number(row.createdAt),
        updatedAt: Number(row.updatedAt),
      }));

      set({ notes, hydrated: true });
    } catch (err) {
      console.error('Error hydrating notes from DB:', err);
      set(s => ({ ...s, hydrated: true }));
    }
  },

  addNote: async (type, title) => {
    const id = String(Date.now());
    const now = Date.now();
    const note: Note = { id, type, title, content: '', createdAt: now, updatedAt: now };

    try {
      db.runSync(
        'INSERT OR REPLACE INTO notes (id, type, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [note.id, note.type, note.title, note.content, note.createdAt, note.updatedAt]
      );
    } catch (err) {
      console.error('Error inserting note into DB:', err);
    }

    set(s => ({ notes: [note, ...s.notes] }));
    return id;
  },

  updateNote: async (id, patch) => {
    const now = Date.now();
    try {
      db.runSync(
        'UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), updatedAt = ? WHERE id = ?',
        [
          patch.title !== undefined ? patch.title : null,
          patch.content !== undefined ? patch.content : null,
          now,
          id,
        ]
      );
    } catch (err) {
      console.error('Error updating note in DB:', err);
    }

    set(s => ({
      notes: s.notes.map(n =>
        n.id === id ? { ...n, ...patch, updatedAt: now } : n
      ),
    }));
  },

  getNote: (id) => get().notes.find(n => n.id === id),
}));