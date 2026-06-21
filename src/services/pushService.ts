import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from './api';

let tokenActual: string | null = null;

/**
 * Pide permiso, obtiene el Expo Push Token y lo registra en el backend.
 * Guards: no corre en Expo Go (SDK 53+ no soporta push remoto) ni en emulador
 * sin dispositivo. Nunca lanza: si algo falla, devuelve null.
 */
export async function registrarPush(): Promise<string | null> {
  try {
    // Expo Go no recibe push remoto -> evitar (solo build/APK).
    if (Constants.appOwnership === 'expo') return null;
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#df2531',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return null;

    tokenActual = token;
    await api.post('/push/registrar', { token, platform: Platform.OS });
    return token;
  } catch {
    return null;
  }
}

/** Quita el token del backend (al cerrar sesión). */
export async function desregistrarPush(): Promise<void> {
  try {
    if (!tokenActual) return;
    await api.delete('/push/registrar', { data: { token: tokenActual } });
    tokenActual = null;
  } catch {
    // silencioso
  }
}
