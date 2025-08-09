import React, { useState } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodayHeader from '../components/TodayHeader';
import CheckListCard from '../components/CheckListCard';
import { FAB, Button, Portal, Dialog, TextInput, Divider, Text, IconButton } from 'react-native-paper';
import { Link } from 'expo-router';
import ManageTasksDialog from '../components/ManageTasksDialog';

export default function HomeScreen() {
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <TodayHeader />
      <CheckListCard />
      <Link href="/notes" asChild>
        <Button mode="contained-tonal" icon="note-text" style={styles.notesButton}>
          Open Notes
        </Button>
      </Link>
      <FAB icon="cog" style={styles.fab} onPress={() => setManageOpen(true)} />
      <ManageTasksDialog visible={manageOpen} onDismiss={() => setManageOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  fab: { position: 'absolute', right: 20, bottom: 24 },
  notesButton: { marginTop: 8 },
  addRow: { display: 'none' },
  input: { flex: 1, minWidth: 0 },
  inputField: { marginTop: 6, marginBottom: 50 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  rowIcon: { margin: 0 },
  taskTitle: { flex: 1 },
  completed: { textDecorationLine: 'line-through', color: '#888' },
  sectionLabel: { opacity: 0.6, marginBottom: 4, marginTop: 4 },
});
