import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodayHeader from '../components/TodayHeader';
import CheckListCard from '../components/CheckListCard';
import { FAB, Button } from 'react-native-paper';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <TodayHeader />
      <CheckListCard />
      <Link href="/notes" asChild>
        <Button mode="contained-tonal" icon="note-text" style={styles.notesButton}>
          Open Notes
        </Button>
      </Link>
      <FAB icon="plus" style={styles.fab} onPress={() => { /* open add-task sheet */ }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  fab: { position: 'absolute', right: 20, bottom: 24 },
  notesButton: { marginTop: 8 },
});
