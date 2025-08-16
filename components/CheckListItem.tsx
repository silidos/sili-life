import { View, StyleSheet, Pressable } from 'react-native';
import { Checkbox, Text } from 'react-native-paper';

export default function ChecklistItem({ title, checked, onToggle, onLongPress }: {
  title: string;
  checked: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable onPress={onToggle} onLongPress={onLongPress} style={({ pressed }) => [styles.row, pressed && { opacity: .75 }]}>
      <Checkbox.Android
        status={checked ? 'checked' : 'unchecked'}
        onPress={onToggle}
        color="#6B5B95"
        uncheckedColor="#6B5B95"   // pick any visible color
        />
      <Text style={[styles.text, checked && styles.done]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  text: { fontSize: 16 },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
});