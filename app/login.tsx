import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/features/auth/context/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { colors, spacing, radius } from '../src/lib/theme';

export default function Login() {
  const { login } = useAuth();
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!documento || !password) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(documento, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🏆</Text>
          </View>
          <Text style={styles.title}>Fairpadel</Text>
          <Text style={styles.subtitle}>Tu comunidad de pádel</Text>
        </View>

        <Text style={styles.heading}>Iniciar sesión</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Documento"
          placeholder="Ingresa tu documento"
          value={documento}
          onChangeText={setDocumento}
          autoCapitalize="none"
        />

        <Input
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title="Ingresar"
          onPress={handleLogin}
          loading={loading}
          size="lg"
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tenés cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Registrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl + 8,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(223, 37, 49, 0.2)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.gray400,
    fontSize: 16,
    marginTop: spacing.xs,
  },
  heading: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: colors.red500,
    borderRadius: radius.lg,
    padding: spacing.md - 2,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.gray400,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
