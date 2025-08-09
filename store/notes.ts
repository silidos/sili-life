import { create } from 'zustand';

export type NoteType = 'free' | 'chatgpt' | 'recipe' | 'workout' | 'grocery' | 'todo';
export type Note = { id: string; type: NoteType; title: string; content: string; createdAt: number; updatedAt: number };

type State = {
  notes: Note[];
  addNote: (type: NoteType, title: string) => string;
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'content'>>) => void;
  getNote: (id: string) => Note | undefined;
};

export const useNotes = create<State>((set, get) => ({
  notes: [],
  addNote: (type, title) => {
    const id = String(Date.now());
    const now = Date.now();
    const note: Note = { id, type, title, content: '', createdAt: now, updatedAt: now };
    set(s => ({ notes: [note, ...s.notes] }));
    return id;
  },
  updateNote: (id, patch) => {
    set(s => ({
      notes: s.notes.map(n => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    }));
  },
  getNote: (id) => get().notes.find(n => n.id === id),
}));