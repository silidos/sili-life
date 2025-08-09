// components/note-actions/NoteTypeActions.tsx
import React from 'react';
import ChatGPTActions from './chatgpt/ChatGPTActions';

export type NoteType = 'free' | 'chatgpt' | 'recipe' | 'workout' | 'grocery' | 'todo';

export default function NoteTypeActions({
  type, noteId,
}: { type: NoteType; noteId: string }) {
  switch (type) {
    case 'chatgpt':
      return <ChatGPTActions noteId={noteId} />;
    default:
      return null; // add other type-specific toolbars later
  }
}