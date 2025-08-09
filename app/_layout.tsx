import { Stack } from 'expo-router';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const cozyPalette = {
  primary: '#6B5B95', // muted lavender
  secondary: '#E6B980', // warm latte
  tertiary: '#C06C84', // rosy accent
  backgroundLight: '#FFF9F2', // warm off-white
  backgroundDark: '#1A1718',
};

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: cozyPalette.primary,
    secondary: cozyPalette.secondary,
    surface: '#FFFFFF',
    background: cozyPalette.backgroundLight,
    elevation: { ...MD3LightTheme.colors.elevation },
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: cozyPalette.secondary,
    secondary: cozyPalette.tertiary,
    background: cozyPalette.backgroundDark,
  },
};

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <PaperProvider theme={scheme === 'dark' ? darkTheme : lightTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}