import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Pressable, PanResponder } from 'react-native';
import { Text, FAB, Card, List, Divider, Dialog, Portal, Button, TextInput, SegmentedButtons, Appbar, Menu, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useNotes } from '../store/notes';

// Local note type for MVP; can be moved to SQLite later
export type NoteType = 'free' | 'chatgpt' | 'recipe' | 'workout' | 'grocery' | 'todo';

type Note = {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  createdAt: number;
};

export default function Notes() {
  const router = useRouter();
  const notes = useNotes(s => s.notes);
  const reorderNotes = useNotes(s => (s as any).reorderNotes);
  const addNoteToStore = useNotes(s => s.addNote);
  const deleteNoteFromStore = useNotes(s => s.deleteNote);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<NoteType>('free');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  // Filter state
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState<string>('');

  const [menuForId, setMenuForId] = useState<string | null>(null);

  const addNote = () => {
    const id = addNoteToStore(draftType, draftTitle || defaultTitle(draftType));
    setDraftTitle('');
    setDraftContent('');
    setDraftType('free');
    setOpen(false);
    router.push(`/notes/${id}`);
  };

  // Filtered notes and empty state
  const filteredNotes = notes.filter(n => filterType === 'all' ? true : n.type === filterType);
  const [orderIds, setOrderIds] = useState<string[]>(filteredNotes.map(n => n.id));
  const [isDragging, setIsDragging] = useState(false);
  const orderRef = React.useRef(orderIds);
  function setOrder(next: string[]) { orderRef.current = next; setOrderIds(next); }
  React.useEffect(() => {
    const visible = filteredNotes.map(n => n.id);
    const merged = [...orderRef.current.filter(id => visible.includes(id)), ...visible.filter(id => !orderRef.current.includes(id))];
    if (merged.length !== orderRef.current.length || merged.some((id, i) => id !== orderRef.current[i])) {
      setOrder(merged);
    }
  }, [filteredNotes]);

  const ROW_HEIGHT = 82; // approximate card height for drag math
  const draggingIndexRef = React.useRef<number>(-1);
  const panResponderFor = (index: number) => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dy) > 10,
    onMoveShouldSetPanResponderCapture: (_evt, g) => Math.abs(g.dy) > 10,
    onPanResponderGrant: () => {
      draggingIndexRef.current = index;
    },
    onPanResponderMove: (_evt, gesture) => {
      if (!isDragging) setIsDragging(true);
      const from = draggingIndexRef.current;
      const desired = Math.round(from + gesture.dy / ROW_HEIGHT);
      let to = desired;
      if (to < 0) to = 0;
      if (to > orderRef.current.length - 1) to = orderRef.current.length - 1;
      if (to !== from) {
        const next = orderRef.current.slice();
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        setOrder(next);
        draggingIndexRef.current = to;
      }
    },
    onPanResponderRelease: () => {
      if (isDragging) {
        reorderNotes(orderRef.current);
        setIsDragging(false);
      }
      draggingIndexRef.current = -1;
    },
    onPanResponderTerminate: () => {
      if (isDragging) {
        reorderNotes(orderRef.current);
        setIsDragging(false);
      }
      draggingIndexRef.current = -1;
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });
  const empty = filteredNotes.length === 0;

  const renderItem = ({ item, index }: { item: Note; index: number }) => {
    const preview = (item.content || '').split(/\r?\n/)[0];
    const pan = panResponderFor(index);
  
    return (
      <Card
        style={[styles.card, styles.cardSpacing]}
        onPress={() => { if (!isDragging) router.push(`/notes/${item.id}`); }}
      >
        <Card.Title
          title={item.title}
          subtitle={`${prettyType(item.type)} • ${new Date(item.createdAt).toLocaleString()}`}
          right={(props) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View {...pan.panHandlers}>
                <IconButton {...props} icon="drag-vertical" onPress={() => {}} accessibilityLabel="Reorder" />
              </View>
              <Menu
                visible={menuForId === item.id}
                onDismiss={() => setMenuForId(null)}
                anchor={<IconButton {...props} icon="dots-vertical" onPress={() => setMenuForId(item.id)} />}
              >
                <Menu.Item
                  leadingIcon="pencil-outline"
                  title="Open"
                  onPress={() => { setMenuForId(null); router.push(`/notes/${item.id}`); }}
                />
                <Menu.Item
                  leadingIcon="delete-outline"
                  title="Delete"
                  onPress={() => {
                    setMenuForId(null);
                    setConfirmDeleteId(item.id);
                    setConfirmDeleteTitle(item.title || 'this note');
                  }}
                />
              </Menu>
            </View>
          )}
        />
        {item.content ? (
          <Card.Content>
            <Text style={{ opacity: 0.9 }} numberOfLines={1} ellipsizeMode="tail">{preview}</Text>
          </Card.Content>
        ) : null}
      </Card>
    );
  };

  const typeLabel = (t: NoteType) => prettyType(t);

  return (
    <SafeAreaView style={styles.screen} edges={['top','left','right']}>
      <Appbar.Header mode="small" style={styles.appbar} elevated={false}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notes" subtitle={filterType === 'all' ? 'All' : prettyType(filterType)} />
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Appbar.Action icon="filter-variant" onPress={() => setFilterMenuVisible(true)} accessibilityLabel="Filter notes" />
          }
          anchorPosition="bottom"
        >
          <Menu.Item onPress={() => { setFilterType('all'); setFilterMenuVisible(false); }} title={`All${filterType==='all' ? ' ✓' : ''}`} />
          <Menu.Item onPress={() => { setFilterType('free'); setFilterMenuVisible(false); }} title={`Freeform${filterType==='free' ? ' ✓' : ''}`} />
          <Menu.Item onPress={() => { setFilterType('chatgpt'); setFilterMenuVisible(false); }} title={`ChatGPT${filterType==='chatgpt' ? ' ✓' : ''}`} />
          <Menu.Item onPress={() => { setFilterType('recipe'); setFilterMenuVisible(false); }} title={`Recipe${filterType==='recipe' ? ' ✓' : ''}`} />
          <Menu.Item onPress={() => { setFilterType('workout'); setFilterMenuVisible(false); }} title={`Workout${filterType==='workout' ? ' ✓' : ''}`} />
          <Menu.Item onPress={() => { setFilterType('grocery'); setFilterMenuVisible(false); }} title={`Grocery${filterType==='grocery' ? ' ✓' : ''}`} />
          <Menu.Item onPress={() => { setFilterType('todo'); setFilterMenuVisible(false); }} title={`To‑Do${filterType==='todo' ? ' ✓' : ''}`} />
        </Menu>
      </Appbar.Header>

      {empty ? (
        <List.Section>
          <List.Item title="No notes yet" description="Tap the + to add a note" left={props => <List.Icon {...props} icon="note-text" />} />
        </List.Section>
      ) : (
        <FlatList
          data={orderIds.map(id => filteredNotes.find(n => n.id === id)).filter(Boolean) as Note[]}
          keyExtractor={n => n.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 96 }}
          scrollEnabled={!isDragging}
          scrollEventThrottle={16}
        />
      )}

      {/* Add Note FAB */}
      <FAB icon="plus" style={styles.fab} onPress={() => setOpen(true)} />

      {/* Add Note Dialog */}
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)}>
          <Dialog.Title>New Note</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 320 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              <Menu
                visible={typeMenuVisible}
                onDismiss={() => setTypeMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setTypeMenuVisible(true)}
                    compact
                    style={{ marginBottom: 12, alignSelf: 'flex-start' }}
                    contentStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text>{`Type: ${typeLabel(draftType)}`}</Text>
                      <List.Icon icon="menu-down" />
                    </View>
                  </Button>
                }
                anchorPosition="bottom"
                contentStyle={{ marginTop: -13 }}
              >
                <Menu.Item onPress={() => { setDraftType('free'); setTypeMenuVisible(false); }} title="Freeform" />
                <Menu.Item onPress={() => { setDraftType('chatgpt'); setTypeMenuVisible(false); }} title="ChatGPT" />
                <Menu.Item onPress={() => { setDraftType('recipe'); setTypeMenuVisible(false); }} title="Recipe" />
                <Menu.Item onPress={() => { setDraftType('workout'); setTypeMenuVisible(false); }} title="Workout" />
                <Menu.Item onPress={() => { setDraftType('grocery'); setTypeMenuVisible(false); }} title="Grocery" />
                <Menu.Item onPress={() => { setDraftType('todo'); setTypeMenuVisible(false); }} title="To‑Do" />
              </Menu>
              <TextInput
                label="Title"
                value={draftTitle}
                onChangeText={setDraftTitle}
                mode="outlined"
                style={{ marginBottom: 12 }}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>Cancel</Button>
            <Button mode="contained" onPress={addNote}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!confirmDeleteId} onDismiss={() => setConfirmDeleteId(null)}>
          <Dialog.Title>Delete note?</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete “{confirmDeleteTitle}”?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={async () => {
                const id = confirmDeleteId!;
                setConfirmDeleteId(null);
                await deleteNoteFromStore(id);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

function defaultTitle(t: NoteType): string {
  switch (t) {
    case 'chatgpt': return 'ChatGPT Note';
    case 'recipe': return 'New Recipe';
    case 'workout': return 'Workout Plan';
    case 'grocery': return 'Grocery List';
    case 'todo': return 'To‑Do List';
    default: return 'Untitled Note';
  }
}

function labelForType(t: NoteType): string {
  switch (t) {
    case 'chatgpt': return 'Paste conversation/export here';
    case 'recipe': return 'Ingredients / steps';
    case 'workout': return 'Sets / reps / notes';
    case 'grocery': return 'Items (one per line)';
    case 'todo': return 'Tasks (one per line)';
    default: return 'Write your note';
  }
}

function prettyType(t: NoteType): string {
  switch (t) {
    case 'chatgpt': return 'ChatGPT';
    case 'recipe': return 'Recipe';
    case 'workout': return 'Workout';
    case 'grocery': return 'Grocery';
    case 'todo': return 'To‑Do';
    default: return 'Freeform';
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12 },
  fab: { position: 'absolute', right: 20, bottom: 24 },
  card: { borderRadius: 12 },
  cardSpacing: { marginBottom: 10 },
  appbar: {
    marginHorizontal: -16,
    marginTop: -80,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    borderBottomWidth: 0,
  },
});