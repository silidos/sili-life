import React, { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { Card, Divider, IconButton } from 'react-native-paper';
import { useTasks } from '../store/tasks';
import ChecklistItem from './CheckListItem';
// Simple, dependency-free drag-and-drop using PanResponder

export default function CheckListCard() {

  const ymd = new Date().toISOString().slice(0, 10);

  // Pull the merged list (defaults + day-only) with checked flags
  const store = useTasks(s => s);
  const items = store.tasksForDate(ymd);
  const toggle = store.toggleToday;
  const reorderDefaults = store.reorderDefaults;
  const reorderDay = store.reorderDay;

  // Separate defaults and day-only to keep their independent ordering persisted
  const grouped = useMemo(() => {
    const defaults: typeof items = [] as any;
    const dayOnly: typeof items = [] as any;
    for (const it of items) {
      if (it.isDay) dayOnly.push(it); else defaults.push(it);
    }
    return { defaults, dayOnly };
  }, [items]);

  const ROW_HEIGHT = 52;
  // Keep only ordering (ids). Pull title/checked live from store each render.
  const [defaultsOrder, setDefaultsOrder] = useState<string[]>(grouped.defaults.map(it => it.task.id));
  const [dayOrder, setDayOrder] = useState<string[]>(grouped.dayOnly.map(it => it.task.id));
  const defaultsOrderRef = useRef<string[]>(defaultsOrder);
  const dayOrderRef = useRef<string[]>(dayOrder);
  function setDefaults(next: string[]) { defaultsOrderRef.current = next; setDefaultsOrder(next); }
  function setDay(next: string[]) { dayOrderRef.current = next; setDayOrder(next); }

  // Keep local order arrays in sync with visible ids
  useEffect(() => {
    const visible = grouped.defaults.map(it => it.task.id);
    // Merge: keep existing order for ids that are still visible, append any new visible ids at the end (store order)
    const merged = [...defaultsOrderRef.current.filter(id => visible.includes(id)), ...visible.filter(id => !defaultsOrderRef.current.includes(id))];
    if (merged.length !== defaultsOrderRef.current.length || merged.some((id, i) => id !== defaultsOrderRef.current[i])) {
      setDefaults(merged);
    }
  }, [grouped.defaults]);
  useEffect(() => {
    const visible = grouped.dayOnly.map(it => it.task.id);
    const merged = [...dayOrderRef.current.filter(id => visible.includes(id)), ...visible.filter(id => !dayOrderRef.current.includes(id))];
    if (merged.length !== dayOrderRef.current.length || merged.some((id, i) => id !== dayOrderRef.current[i])) {
      setDay(merged);
    }
  }, [grouped.dayOnly]);

  const draggingKindRef = useRef<null | 'defaults' | 'day'>(null);
  const draggingIndexRef = useRef<number>(-1);

  function moveItemIds(list: string[], from: number, to: number) {
    const copy = list.slice();
    const [m] = copy.splice(from, 1);
    copy.splice(to, 0, m);
    return copy;
  }

  function createPanHandlers(kind: 'defaults' | 'day', index: number) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_evt: GestureResponderEvent, _gs: PanResponderGestureState) => {
        draggingKindRef.current = kind;
        draggingIndexRef.current = index;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (draggingKindRef.current == null) return;
        const offset = Math.round(gestureState.dy / ROW_HEIGHT);
        const from = draggingIndexRef.current;
        let to = from + offset;
        const list = draggingKindRef.current === 'defaults' ? defaultsOrderRef.current : dayOrderRef.current;
        if (to < 0) to = 0;
        if (to > list.length - 1) to = list.length - 1;
        if (to !== from) {
          const next = moveItemIds(list, from, to);
          if (draggingKindRef.current === 'defaults') setDefaults(next); else setDay(next);
          draggingIndexRef.current = to;
        }
      },
      onPanResponderRelease: () => {
        const kindNow = draggingKindRef.current;
        if (!kindNow) return;
        const list = kindNow === 'defaults' ? defaultsOrderRef.current : dayOrderRef.current;
        const ids = list;
        if (kindNow === 'defaults') {
          // Expand to full defaults order expected by reorderDefaults
          const visibleSet = new Set(grouped.defaults.map(it => it.task.id));
          const visibleOrdered = ids.filter(id => visibleSet.has(id));
          const fullDefaults = store.tasks.map(t => t.id);
          const hiddenOrOthers = fullDefaults.filter(id => !visibleOrdered.includes(id));
          reorderDefaults([...visibleOrdered, ...hiddenOrOthers]);
        } else {
          reorderDay(ids, ymd);
        }
        draggingKindRef.current = null;
        draggingIndexRef.current = -1;
      },
      onPanResponderTerminate: () => {
        const kindNow = draggingKindRef.current;
        if (!kindNow) return;
        const list = kindNow === 'defaults' ? defaultsOrderRef.current : dayOrderRef.current;
        const ids = list;
        if (kindNow === 'defaults') {
          const visibleSet = new Set(grouped.defaults.map(it => it.task.id));
          const visibleOrdered = ids.filter(id => visibleSet.has(id));
          const fullDefaults = store.tasks.map(t => t.id);
          const hiddenOrOthers = fullDefaults.filter(id => !visibleOrdered.includes(id));
          reorderDefaults([...visibleOrdered, ...hiddenOrOthers]);
        } else {
          reorderDay(ids, ymd);
        }
        draggingKindRef.current = null;
        draggingIndexRef.current = -1;
      },
    });
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="Today’s Checklist" />
      <Card.Content>
        {/* Defaults - drag and drop */}
        {defaultsOrder.map((id, i) => {
          const it = grouped.defaults.find(x => x.task.id === id) ?? grouped.defaults[i];
          const item = { id: id, title: it?.task.title ?? '', checked: it?.checked ?? false };
          const pan = createPanHandlers('defaults', i);
          return (
            <View key={item.id}>
              {i > 0 && <Divider style={{ opacity: 0.2 }} />}
              <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: ROW_HEIGHT }}>
                <View {...pan.panHandlers}>
                  <IconButton icon="drag-vertical" size={18} style={{ margin: 0 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <ChecklistItem title={item.title} checked={item.checked} onToggle={() => toggle(item.id)} />
                </View>
              </View>
            </View>
          );
        })}

        {/* Day-only - drag and drop */}
        {dayOrder.length > 0 && dayOrder.map((id, i) => {
          const it = grouped.dayOnly.find(x => x.task.id === id) ?? grouped.dayOnly[i];
          const item = { id: id, title: it?.task.title ?? '', checked: it?.checked ?? false };
          const pan = createPanHandlers('day', i);
          return (
            <View key={item.id}>
              <Divider style={{ opacity: 0.2 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: ROW_HEIGHT }}>
                <View {...pan.panHandlers}>
                  <IconButton icon="drag-vertical" size={18} style={{ margin: 0 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <ChecklistItem title={item.title} checked={item.checked} onToggle={() => toggle(item.id)} />
                </View>
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16 },
});
