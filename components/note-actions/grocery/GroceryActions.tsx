import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { IconButton, Text, TextInput, Snackbar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotes } from '../../../store/notes';

// ────────────────────────────────────────────────────────────────────────────────
// Helpers: parse <-> stringify checklist
// Stored format remains plain text lines like "- [ ] Milk" / "- [x] Eggs"
// ────────────────────────────────────────────────────────────────────────────────

type Line = { id: string; text: string; checked: boolean };

function parse(content: string): Line[] {
  const lines = (content || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');
  return lines.map((raw, i) => {
    const checked = /^\s*-\s*\[x\]\s+/i.test(raw);
    const unchecked = /^\s*-\s*\[\s\]\s+/.test(raw);
    let text = raw.replace(/^\s*-\s*\[(x|\s)\]\s+/i, '');
    if (!checked && !unchecked) text = raw.replace(/^\s*[-*+]\s+/, '');
    return { id: `g${i}_${Date.now()}`, text, checked };
  });
}

function stringify(items: Line[]): string {
  return items
    .filter(it => it.text.trim().length > 0 || it.checked) // drop totally empty trailing blanks
    .map(it => `- [${it.checked ? 'x' : ' '}] ${it.text}`)
    .join('\n');
}

function makeId() {
  return `g${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function FancyCheckbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ padding: 2 }}>
      <MaterialCommunityIcons
        name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
        size={22}
        color={checked ? '#6B5B95' : '#3A3A3A'}
      />
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Component: Toolbar + Inline Editor (no separate dialog)
// ────────────────────────────────────────────────────────────────────────────────

export default function GroceryActions({ noteId }: { noteId: string }) {
  const note = useNotes(s => s.getNote(noteId));
  const updateNote = useNotes(s => s.updateNote);

  const [items, setItems] = useState<Line[]>(() => parse(note?.content || ''));
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  // Keep local items in sync if note content changes elsewhere
  useEffect(() => {
    const incoming = note?.content || '';
    const current = stringify(items);
    if (incoming !== current) {
      setItems(parse(incoming));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.content]);

  // Push changes back to the store (avoid loops by comparing)
  useEffect(() => {
    const next = stringify(items);
    if ((note?.content || '') !== next) {
      updateNote(noteId, { content: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Ensure at least one empty line exists to start typing
  useEffect(() => {
    if (!items.length) setItems([{ id: makeId(), text: '', checked: false }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Manage focus per row so new rows are immediately editable
  const inputRefs = useRef<Record<string, React.ComponentRef<typeof TextInput> | null>>({});
  const focus = (id: string) => requestAnimationFrame(() => inputRefs.current[id]?.focus?.());

  const toggle = (id: string) => setItems(list => list.map(it => (it.id === id ? { ...it, checked: !it.checked } : it)));
  const remove = (id: string) => setItems(list => list.filter(it => it.id !== id));

  const changeText = (id: string, txt: string) => {
    if (txt.includes('\n')) {
      // Split on newline: current row keeps first line, subsequent lines create new items
      const lines = txt.replace(/\r/g, '').split('\n');
      const first = lines[0];
      const rest = lines.slice(1).filter(Boolean);
      setItems(list => {
        const idx = list.findIndex(it => it.id === id);
        if (idx < 0) return list;
        const before = list.slice(0, idx);
        const after = list.slice(idx + 1);
        const current = { ...list[idx], text: first };
        const newOnes = rest.map(l => ({ id: makeId(), text: l, checked: false }));
        const next = [...before, current, ...newOnes, ...after];
        if (newOnes.length) setTimeout(() => focus(newOnes[0].id), 0);
        return next;
      });
    } else {
      setItems(list => list.map(it => (it.id === id ? { ...it, text: txt } : it)));
    }
  };

  const submitLine = (id: string) => {
    // pressing return on a row inserts a new row below and focuses it
    setItems(list => {
      const idx = list.findIndex(it => it.id === id);
      if (idx < 0) return list;
      const newItem = { id: makeId(), text: '', checked: false };
      const next = [...list.slice(0, idx + 1), newItem, ...list.slice(idx + 1)];
      setTimeout(() => focus(newItem.id), 0);
      return next;
    });
  };

  const addItem = () => {
    const id = makeId();
    setItems(list => [...list, { id, text: '', checked: false }]);
    setTimeout(() => focus(id), 0);
  };

  // Bulk actions (toolbar)
  const onCheckAll = () => {
    try {
      setItems(list => list.map(it => ({ ...it, checked: true })));
    } catch {
      setSnack({ visible: true, text: 'Could not check all.' });
    }
  };

  const onUncheckAll = () => {
    try {
      setItems(list => list.map(it => ({ ...it, checked: false })));
    } catch {
      setSnack({ visible: true, text: 'Could not uncheck all.' });
    }
  };

  const onClearCompleted = () => {
    try {
      setItems(list => list.filter(it => !it.checked || it.text.trim().length === 0));
    } catch {
      setSnack({ visible: true, text: 'Could not clear completed.' });
    }
  };

  const renderItem = ({ item }: { item: Line }) => (
    <View style={styles.row}>
      <FancyCheckbox checked={item.checked} onPress={() => toggle(item.id)} />
      <TextInput
        ref={(r: React.ComponentRef<typeof TextInput> | null) => { if (r) inputRefs.current[item.id] = r; }}
        value={item.text}
        onChangeText={txt => changeText(item.id, txt)}
        onSubmitEditing={() => submitLine(item.id)}
        placeholder="Item"
        mode="flat"
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        style={styles.itemInput}
        dense
        blurOnSubmit={false}
        returnKeyType="next"
      />
      <IconButton icon="close" onPress={() => remove(item.id)} accessibilityLabel="Remove item" style={styles.rowIcon} />
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Inline editable checklist (non-virtualized since parent provides scrolling) */}
      <View style={{ paddingBottom: 72 }}>
        {items.map(item => (
          <View key={item.id} style={styles.row}>
            <FancyCheckbox checked={item.checked} onPress={() => toggle(item.id)} />
            <TextInput
              ref={(r: React.ComponentRef<typeof TextInput> | null) => { if (r) inputRefs.current[item.id] = r; }}
              value={item.text}
              onChangeText={txt => changeText(item.id, txt)}
              onSubmitEditing={() => submitLine(item.id)}
              placeholder="Item"
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={styles.itemInput}
              dense
              blurOnSubmit={false}
              returnKeyType="next"
            />
            <IconButton icon="close" onPress={() => remove(item.id)} accessibilityLabel="Remove item" style={styles.rowIcon} />
          </View>
        ))}
      </View>

        <FAB icon="plus" style={styles.fab} onPress={addItem} />

      {items.length === 0 && (
        <Text style={styles.hint}>Type an item and press return to add another</Text>
      )}

      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, text: '' })} duration={1600}>
        {snack.text}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '92%', maxWidth: 560, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rowIcon: { margin: 0 },
  itemInput: { flex: 1, backgroundColor: 'transparent' },
  hint: { opacity: 0.6, marginTop: 8, textAlign: 'center' },
  fab: { position: 'absolute', right: 5, bottom: 24 },
});