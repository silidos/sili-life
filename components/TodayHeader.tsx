import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import dayjs from '../lib/dates';

export default function TodayHeader() {
  const now = dayjs();
  const greeting = (() => {
    const h = now.hour();
    if (h < 12) return 'Good morning Kevin! 🌅';
    if (h < 18) return 'Good afternoon Kevin! ☀️';
    return 'Good evening Kevin! 🌙';
  })();

  return (
    <View style={styles.wrapper}>
      <Text variant="headlineMedium" style={styles.greeting}>{greeting} </Text>
      <Text variant="titleMedium" style={styles.date}>{now.format('dddd, MMM D')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  greeting: { fontWeight: '600' },
  date: { opacity: 0.8 },
});