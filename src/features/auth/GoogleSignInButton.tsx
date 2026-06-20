import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from './context/AuthContext';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../../config/google';
import { colors, radius, spacing } from '../../lib/theme';

WebBrowser.maybeCompleteAuthSession();

export function GoogleSignInButton({ onError }: { onError?: (msg: string) => void }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (!idToken) {
        onError?.('No se recibió el token de Google');
        return;
      }
      setLoading(true);
      loginWithGoogle(idToken)
        .then(() => router.replace('/(tabs)'))
        .catch((e: any) => onError?.(e?.response?.data?.message || 'No se pudo entrar con Google'))
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      onError?.('No se pudo entrar con Google');
    }
  }, [response]);

  return (
    <TouchableOpacity
      style={styles.btn}
      disabled={!request || loading}
      onPress={() => promptAsync()}
      activeOpacity={0.85}
    >
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
