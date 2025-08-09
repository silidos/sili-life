import { useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { Portal, Dialog, Divider, IconButton, TextInput, Text, Button } from "react-native-paper";
import { useTasks } from "../store/tasks";

type ManageTasksDialogProps = { visible: boolean; onDismiss: () => void };

function ManageTasksDialog({ visible, onDismiss }: ManageTasksDialogProps) {
    const [defaultTaskText, setDefaultTaskText] = useState('');
    const [todayTaskText, setTodayTaskText] = useState('');
  
    const store = useTasks(s => s);
    const tasksToday = store.tasksForDate();
    const defaults = store.tasks;
    const { toggleToday, addTask, removeTask, addDayTask, removeDayTask, removeDefaultForDate } = store;
  
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={onDismiss}>
          <Dialog.Title>Manage Tasks</Dialog.Title>
  
          <Dialog.ScrollArea>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                {/* Add defaults */}
                <TextInput
                  mode="outlined"
                  dense
                  style={[styles.input, styles.inputField]}
                  placeholder="Add default task (every day)"
                  value={defaultTaskText}
                  onChangeText={setDefaultTaskText}
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
                  {tasksToday.map(({ task, checked, isDefault, isDay }) => (
                    <View key={task.id} style={styles.taskRow}>
                      <IconButton
                        icon={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        onPress={() => toggleToday(task.id)}
                        size={20}
                        style={styles.rowIcon}
                      />
                      <Text
                        variant="bodyMedium"
                        numberOfLines={2}
                        style={[styles.taskTitle, checked && styles.completed]}
                      >
                        {task.title}
                      </Text>
                      <IconButton
                        icon={isDefault ? 'eye-off-outline' : 'delete-outline'}
                        onPress={() => {
                          if (isDefault) removeDefaultForDate(task.id);
                          else if (isDay) removeDayTask(task.id);
                        }}
                        size={18}
                        style={styles.rowIcon}
                      />
                    </View>
                  ))}
                </View>
  
                <Divider style={{ marginVertical: 12 }} />
  
                {/* Defaults editor */}
                <View style={{ marginBottom: 4 }}>
                  <Text variant="labelLarge" style={styles.sectionLabel}>Defaults (every day)</Text>
                  {defaults.map((task) => (
                    <View key={task.id} style={styles.taskRow}>
                      <IconButton icon="dots-horizontal" disabled size={18} style={styles.rowIcon} />
                      <Text variant="bodyMedium" numberOfLines={2} style={styles.taskTitle}>
                        {task.title}
                      </Text>
                      <IconButton icon="delete-outline" onPress={() => removeTask(task.id)} size={18} style={styles.rowIcon} />
                    </View>
                  ))}
                </View>
              </View>
            </KeyboardAvoidingView>
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
  inputField: { marginTop: 6, marginBottom: 70 },
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
});

export default ManageTasksDialog;