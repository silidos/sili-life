import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function Notes() {
  return (
    <View style={styles.screen}>
      <Text variant="headlineSmall">Notes</Text>
      <Text>Coming soon: recipes, workouts, grocery/todo, free text.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12 },
});