import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Appbar, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotes } from '../../store/notes';

export default function NoteEditor() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getNote = useNotes(s => s.getNote);
  const updateNote = useNotes(s => s.updateNote);

  const note = id ? getNote(id) : undefined;

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

  return (
    <SafeAreaView style={styles.root} edges={['top','left','right']}>
      <Appbar.Header mode="small" style={styles.appbar} elevated={false}>
        <Appbar.BackAction onPress={() => { onSave();}} />
        <Appbar.Content title={title} style={{ marginLeft: -3}} />
      </Appbar.Header>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
          <TextInput
            ref={inputRef}
            value={content}
            onChangeText={setContent}
            placeholder="Start writing…"
            mode="flat"
            autoFocus
            selectionColor="#6B5B95"        // caret & selection tint
            underlineColor="transparent"     // remove flat underline
            activeUnderlineColor="transparent"
            style={[styles.bodyInput, { backgroundColor: 'transparent' }]}
            contentStyle={{ backgroundColor: 'transparent' }}
            multiline
            numberOfLines={12}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 2 },
  appbar: {
    marginHorizontal: -24,
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
  bodyInput: { minHeight: 500, fontSize: 16, marginTop: -24 },
});