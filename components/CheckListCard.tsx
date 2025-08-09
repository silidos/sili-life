import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { useTasks } from '../store/tasks';
import ChecklistItem from './CheckListItem';

export default function CheckListCard() {

  const ymd = new Date().toISOString().slice(0, 10);

  // Pull the merged list (defaults + day-only) with checked flags
  const store = useTasks(s => s);
  const items = store.tasksForDate(ymd);
  const toggle = store.toggleToday;

  return (
    <Card style={styles.card}>
      <Card.Title title="Today’s Checklist" />
      <Card.Content>
        {items.map(({ task, checked }, i) => (
          <View key={task.id}>
            {i > 0 && <Divider style={{ opacity: 0.2 }} />}
            <ChecklistItem title={task.title} checked={checked} onToggle={() => toggle(task.id)} />
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16 },
});
