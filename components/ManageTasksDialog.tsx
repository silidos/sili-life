import { useState } from "react";
import { View, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { Portal, Dialog, Divider, IconButton, TextInput, Text, Button } from "react-native-paper";
import { useTasks } from "../store/tasks";

type ManageTasksDialogProps = { visible: boolean; onDismiss: () => void };

function ManageTasksDialog({ visible, onDismiss }: ManageTasksDialogProps) {
    const [defaultTaskText, setDefaultTaskText] = useState('');
    const [todayTaskText, setTodayTaskText] = useState('');
  
    const store = useTasks(s => s);
    const defaults = store.tasks;
    const { addTask, removeTask, addDayTask, removeDayTask, removeDefaultForDate, restoreDefaultForDate } = store;

    // Build a Today list for the dialog that shows BOTH visible and hidden defaults, plus day-only tasks
    const ymd = new Date().toISOString().slice(0, 10);
    const hiddenSet = store.dayRemovals[ymd] ?? new Set<string>();
    const doneSet = store.completions[ymd] ?? new Set<string>();
    const dayOnly = store.dayAdds[ymd] ?? [];

    const todayItems = [
      // defaults (mark if hidden)
      ...defaults.map(task => ({
        task,
        isDefault: true as const,
        isDay: false as const,
        hidden: hiddenSet.has(task.id),
        checked: doneSet.has(task.id),
      })),
      // day-only tasks
      ...dayOnly.map(task => ({
        task,
        isDefault: false as const,
        isDay: true as const,
        hidden: false,
        checked: doneSet.has(task.id),
      })),
    ];
  
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
          <Dialog.Title>Manage Tasks</Dialog.Title>
  
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
              bounces
            >
              {/* Add defaults */}
              <TextInput
                mode="outlined"
                dense
                style={[styles.input, styles.inputField]}
                placeholder="Add default task (every day)"
                value={defaultTaskText}
                onChangeText={setDefaultTaskText}
                onSubmitEditing={() => {
                  const t = defaultTaskText.trim();
                  if (!t) { Keyboard.dismiss(); return; }
                  addTask(t);
                  setDefaultTaskText('');
                  Keyboard.dismiss();
                }}
                blurOnSubmit
                returnKeyType="done"
                right={
                  <TextInput.Icon
                    icon="plus"
                    onPress={() => {
                      const t = defaultTaskText.trim();
                      if (!t) return;
                      addTask(t);
                      setDefaultTaskText('');
                    }}
                  />
                }
              />

              {/* Add today-only */}
              <TextInput
                mode="outlined"
                dense
                style={[styles.input, styles.inputField]}
                placeholder="Add today-only task"
                value={todayTaskText}
                onChangeText={setTodayTaskText}
                onSubmitEditing={() => {
                  const t = todayTaskText.trim();
                  if (!t) { Keyboard.dismiss(); return; }
                  addDayTask(t);
                  setTodayTaskText('');
                  Keyboard.dismiss();
                }}
                blurOnSubmit
                returnKeyType="done"
                right={
                  <TextInput.Icon
                    icon="plus"
                    onPress={() => {
                      const t = todayTaskText.trim();
                      if (!t) return;
                      addDayTask(t);
                      setTodayTaskText('');
                    }}
                  />
                }
              />

              <Divider style={{ marginVertical: 12 }} />

              {/* Today's list */}
              <View style={{ marginBottom: 8 }}>
                <Text variant="labelLarge" style={styles.sectionLabel}>Today</Text>
                {todayItems.map(({ task, checked, isDefault, isDay, hidden }) => (
                  <View key={task.id} style={[styles.taskRow, hidden && styles.dimmed]}>
                    <Text
                      variant="bodyMedium"
                      numberOfLines={2}
                      style={[styles.taskTitle, checked && styles.completed]}
                    >
                      {task.title}
                    </Text>
                    {isDefault ? (
                      <IconButton
                        icon={hidden ? 'eye-off-outline' : 'eye-outline'}
                        onPress={() => {
                          if (hidden) restoreDefaultForDate(task.id); else removeDefaultForDate(task.id);
                        }}
                        size={18}
                        style={styles.rowIcon}
                      />
                    ) : (
                      <IconButton
                        icon="delete-outline"
                        onPress={() => removeDayTask(task.id)}
                        size={18}
                        style={styles.rowIcon}
                      />
                    )}
                  </View>
                ))}
              </View>

              <Divider style={{ marginVertical: 12 }} />

              {/* Defaults editor */}
              <View style={{ marginBottom: 4 }}>
                <Text variant="labelLarge" style={styles.sectionLabel}>Defaults (every day)</Text>
                {defaults.map((task) => (
                  <View key={task.id} style={styles.taskRow}>
                    <Text variant="bodyMedium" numberOfLines={2} style={styles.taskTitle}>
                      {task.title}
                    </Text>
                    <IconButton icon="delete-outline" onPress={() => removeTask(task.id)} size={18} style={styles.rowIcon} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
  
          <Dialog.Actions>
            <Button onPress={onDismiss}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

const styles = StyleSheet.create({
  input: { flex: 1, minWidth: 0 },
  inputField: { marginVertical: 8 },
  sectionLabel: { opacity: 0.6, marginBottom: 4, marginTop: 4 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  rowIcon: { margin: 0 },
  taskTitle: { flex: 1 },
  completed: { textDecorationLine: 'line-through', color: '#888' },
  dimmed: { opacity: 0.5 },
  dialog: { maxHeight: '100%' },
  scrollArea: { maxHeight: 520 },
});

export default ManageTasksDialog;