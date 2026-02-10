import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "../context/theme-context";
import { LanguageProvider } from "../context/language-context";
import { View } from "react-native";

function AppContent() {
  const { isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#ffffff' }} className={isDark ? 'dark' : ''}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={isDark ? "#111827" : "#ffffff"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
