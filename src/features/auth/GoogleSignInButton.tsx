import { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { GOOGLE_WEB_CLIENT_ID } from '../../config/google';
import { colors, radius, spacing } from '../../lib/theme';

// @react-native-google-signin es un módulo NATIVO: no existe en Expo Go.
// Por eso NO lo importamos arriba (rompería Expo Go) — lo cargamos con require()
// dentro del handler, solo cuando corre la app instalada.
const isExpoGo = Constants.appOwnership === 'expo';

export function GoogleSignInButton({ onError }: { onError?: (msg: string) => void }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    if (isExpoGo) {
      onError?.('El login con Google solo funciona en la app instalada (no en Expo Go).');
      return;
    }
    setLoading(true);
    try {
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res: any = await GoogleSignin.signIn();
      const idToken = res?.data?.idToken ?? res?.idToken;
      if (!idToken) {
        onError?.('No se recibió el token de Google');
        return;
      }
      await loginWithGoogle(idToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      // Cancelación del usuario = silencioso (códigos 'SIGN_IN_CANCELLED' / 'IN_PROGRESS')
      const code = e?.code;
      if (code === 'SIGN_IN_CANCELLED' || code === 'IN_PROGRESS' || code === '-5' || code === '12501') return;
      onError?.(e?.response?.data?.message || e?.message || 'No se pudo entrar con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.btn} disabled={loading} onPress={onPress} activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color="#1f2937" />
      ) : (
        <>
          <Text style={styles.g}>G</Text>
          <Text style={styles.text}>Continuar con Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    height: 52,
  },
  g: { color: '#4285F4', fontSize: 18, fontWeight: '800' },
  text: { color: '#1f2937', fontSize: 16, fontWeight: '700' },
});
