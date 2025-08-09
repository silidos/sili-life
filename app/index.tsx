import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodayHeader from '../components/TodayHeader';
import CheckListCard from '../components/CheckListCard';
import { FAB } from 'react-native-paper';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <TodayHeader />
      <CheckListCard />
      <FAB icon="plus" style={styles.fab} onPress={() => { /* open add-task sheet */ }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  fab: { position: 'absolute', right: 20, bottom: 24 },
});
