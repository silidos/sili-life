import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Card, Divider, IconButton, Button } from 'react-native-paper';
import { useTasks } from '../store/tasks';
import ChecklistItem from './CheckListItem';

const EMPTY_SET: ReadonlySet<string> = new Set();

export default function CheckListCard() {
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const [expanded, setExpanded] = useState(false);
  const ymd = new Date().toISOString().slice(0, 10);

  const tasks = useTasks(s => s.tasks);
  const doneForToday = useTasks(s => s.completions[ymd] || EMPTY_SET);
  const toggle = useTasks(s => s.toggleToday);

  const items = useMemo(() => {
    return [...tasks]
      .sort((a, b) => a.sort - b.sort)
      .map(task => ({ task, checked: doneForToday.has(task.id) }));
  }, [tasks, doneForToday]);

  const visibleItems = expanded ? items : items.slice(0, 3);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);

  const onToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Today’s Checklist"
        subtitle={expanded ? undefined : hiddenCount > 0 ? `+${hiddenCount} more` : undefined}
        right={() => (
          <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            onPress={onToggleExpand}
            accessibilityLabel={expanded ? 'Collapse checklist' : 'Expand checklist'}
          />
        )}
      />
      <Card.Content>
        {visibleItems.map(({ task, checked }, i) => (
          <View key={task.id}>
            {i > 0 && <Divider style={{ opacity: 0.2 }} />}
            <ChecklistItem title={task.title} checked={checked} onToggle={() => toggle(task.id)} />
          </View>
        ))}

        {hiddenCount > 0 && !expanded && (
          <View style={styles.moreRow}>
            <Button compact onPress={onToggleExpand}>Show more</Button>
          </View>
        )}
        {expanded && items.length > 3 && (
          <View style={styles.moreRow}>
            <Button compact onPress={onToggleExpand}>Show less</Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16 },
  moreRow: { alignItems: 'center', paddingTop: 8 },
});
