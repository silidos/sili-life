import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function History() {
  return (
    <View style={styles.screen}>
      <Text variant="headlineSmall">History</Text>
      <Text>Coming soon: scroll back by date and see what was completed.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12 },
});