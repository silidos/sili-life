import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Appbar, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotes } from '../../store/notes';
import NoteTypeActions from '../../components/note-actions/NoteTypeActions';
import Markdown from 'react-native-markdown-display';

export default function NoteEditor() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const updateNote = useNotes(s => s.updateNote);
  const note = useNotes(s => s.notes.find(n => n.id === id));

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');

  useEffect(() => {
    if (!note) {
      // If user navigated here without a valid note, go back gracefully
      router.back();
    } else {
      // Initialize inputs if note arrives late
      setTitle(note.title);
      setContent(note.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
  }, [note?.updatedAt]); 

  const inputRef = useRef<any>(null);
  useEffect(() => {
    // Ensure caret blinks and keyboard shows on open
    const t = setTimeout(() => inputRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [id]);

  const onSave = () => {
    if (!id) return;
    updateNote(id, { title, content });
    router.back();
  };

  function stripFrontMatter(md?: string) {
    if (!md) return '';
    const m = md.match(/^---\n[\s\S]*?\n---\n?/);
    return m ? md.slice(m[0].length) : md;
  }

  function prepareForRender(md?: string) {
    if (!md) return '';
    // Strip YAML front-matter first
    let out = stripFrontMatter(md);
    // Remove empty unordered list items like "-"
    out = out.replace(/^\s*-\s*$/gm, '');
    // Remove empty ordered list items like "1."
    out = out.replace(/^\s*\d+\.\s*$/gm, '');
    // Remove empty fenced code blocks like ```lang ... ```
    out = out.replace(/```[a-zA-Z0-9]*\n\s*```/g, '');
    // Collapse excessive blank lines
    out = out.replace(/\n{3,}/g, '\n\n');
    return out.trim();
  }

  return (
    <SafeAreaView style={styles.root} edges={['top','left','right']}>
      <Appbar.Header mode="small" style={styles.appbar} elevated={false}>
        <Appbar.BackAction onPress={() => { onSave();}} />
        <Appbar.Content title={title} style={{ marginLeft: -3}} />
        {note ? (
          <NoteTypeActions type={note.type} noteId={note.id} />
        ) : null}
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={56} // approximate Appbar height; tweak if needed
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 24, paddingHorizontal: 16 }}>
          {note?.type === 'chatgpt' ? (
            <Markdown
              style={{
                body: { fontSize: 16, lineHeight: 22 },
                paragraph: { marginTop: 6, marginBottom: 6 },
                heading1: { fontSize: 22, marginTop: 12, marginBottom: 6, fontWeight: '700' },
                heading2: { fontSize: 20, marginTop: 10, marginBottom: 6, fontWeight: '700' },
                heading3: { fontSize: 18, marginTop: 8, marginBottom: 6, fontWeight: '700' },
                bullet_list: { marginVertical: 6 },
                ordered_list: { marginVertical: 6 },
                list_item: { marginVertical: 2 },
                code_block: { fontSize: 13, padding: 12, borderRadius: 6, backgroundColor: '#f4f4f5' },
                fence: { fontSize: 13 },
                hr: { marginVertical: 12 },
              }}
            >
              {prepareForRender(content || '')}
            </Markdown>
          ) : (
            <TextInput
              ref={inputRef}
              value={content}
              onChangeText={setContent}
              placeholder="Start writing…"
              mode="flat"
              autoFocus
              selectionColor="#6B5B95"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={[styles.bodyInput, { backgroundColor: 'transparent' }, { flex: 1 }]}
              contentStyle={{ backgroundColor: 'transparent' }}
              multiline
              textAlignVertical="top"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 2 },
  appbar: {
    marginHorizontal: -12,
    marginTop: -80,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    borderBottomWidth: 0,
  },
  titleInput: { fontSize: 22, marginBottom: 8 },
  bodyInput: { fontSize: 16, marginTop: -24 },
});