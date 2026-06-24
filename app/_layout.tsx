import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { queryClient } from '../src/lib/queryClient';

export default function RootLayout() {
  // expo-notifications fue removido de Expo Go (SDK 53+) y rompe al importarse.
  // Por eso se carga DIFERIDO y solo en build nativo (Expo Go: appOwnership 'expo').
  useEffect(() => {
    if (Constants.appOwnership === 'expo') return;
    try {
      const Notifications = require('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch {
      // sin notificaciones (p. ej. Expo Go)
    }
  }, []);

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
            <Stack.Screen name="torneo/inscriptos" />
            <Stack.Screen name="torneo/llave" />
            <Stack.Screen name="torneo/campeones" />
            <Stack.Screen name="inscribirse/[slug]" />
            <Stack.Screen name="inscripciones" />
            <Stack.Screen name="jugador/[id]" />
            <Stack.Screen name="seguidores" />
            <Stack.Screen name="notificaciones" />
            <Stack.Screen name="crear-post" />
            <Stack.Screen name="circuitos" />
            <Stack.Screen name="circuito/[slug]" />
            <Stack.Screen name="reservar" />
            <Stack.Screen name="mis-reservas" />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
