import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { queryClient } from '../src/lib/queryClient';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="torneo/[slug]" />
            <Stack.Screen name="inscribirse/[slug]" />
            <Stack.Screen name="inscripciones" />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
