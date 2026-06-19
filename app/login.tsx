import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../src/features/auth/context/AuthContext';
import { authService } from '../src/services/authService';
import { colors, spacing, radius } from '../src/lib/theme';

const LOGO_URL = 'https://res.cloudinary.com/dncjaaybv/image/upload/v1773057029/logo_h4y1tl.png';

export default function Login() {
  const { login } = useAuth();
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recuperar contraseña
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    if (!documento || !password) {
      setError('Completá todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(documento.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return;
    setLoading(true);
    try {
      await authService.forgotPassword({ email: forgotEmail.trim() });
    } catch {
      // Por seguridad no mostramos error
    } finally {
      setResetSent(true);
      setLoading(false);
    }
  };

  const resetForgot = () => {
    setShowForgot(false);
    setResetSent(false);
    setForgotEmail('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoBox}>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>
        </View>

        {!showForgot ? (
          <>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email o cédula */}
            <Text style={styles.label}>Email o cédula</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.gray500} />
              <TextInput
                style={styles.input}
                value={documento}
                onChangeText={setDocumento}
                placeholder="tu@email.com o 1234567"
                placeholderTextColor={colors.gray500}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Contraseña */}
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={colors.gray500} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.gray500}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                {showPassword ? <EyeOff size={18} color={colors.gray500} /> : <Eye size={18} color={colors.gray500} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotLink} onPress={() => { setError(''); setShowForgot(true); }}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submit} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>Iniciar sesión</Text>
                  <ArrowRight size={18} color={colors.white} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tenés cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.footerLink}>Registrate gratis</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : !resetSent ? (
          <>
            <TouchableOpacity style={styles.backLink} onPress={resetForgot}>
              <ArrowLeft size={16} color={colors.gray400} />
              <Text style={styles.backText}>Volver al login</Text>
            </TouchableOpacity>

            <Text style={styles.forgotTitle}>Recuperar contraseña</Text>
            <Text style={styles.forgotSubtitle}>
              Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
            </Text>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.gray500} />
              <TextInput
                style={styles.input}
                value={forgotEmail}
                onChangeText={setForgotEmail}
                placeholder="tu@email.com"
                placeholderTextColor={colors.gray500}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity style={styles.submit} onPress={handleForgot} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Enviar enlace</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.sentBox}>
            <View style={styles.sentIcon}>
              <CheckCircle2 size={40} color={colors.green500} />
            </View>
            <Text style={styles.sentTitle}>¡Revisá tu email!</Text>
            <Text style={styles.sentText}>
              Enviamos un enlace de recuperación a{'\n'}
              <Text style={{ color: colors.primary }}>{forgotEmail}</Text>
            </Text>
            <TouchableOpacity onPress={resetForgot}>
              <Text style={styles.footerLink}>Volver al login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  logoBox: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { height: 72, width: 180, marginBottom: spacing.md },
  title: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: colors.gray400, fontSize: 15, marginTop: spacing.xs },
  label: { color: colors.gray400, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: { flex: 1, color: colors.white, fontSize: 15, paddingVertical: 0 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: colors.red500,
    borderRadius: radius.md,
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  errorText: { color: '#fca5a5', fontSize: 14 },
  forgotLink: { alignSelf: 'flex-end', marginTop: spacing.md },
  forgotText: { color: colors.gray400, fontSize: 13 },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 52,
    marginTop: spacing.lg,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { color: colors.gray400 },
  footerLink: { color: colors.primary, fontWeight: '700' },
  // Forgot
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  backText: { color: colors.gray400, fontSize: 14 },
  forgotTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  forgotSubtitle: { color: colors.gray400, fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  sentBox: { alignItems: 'center', paddingVertical: spacing.lg },
  sentIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  sentTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold', marginBottom: spacing.sm },
  sentText: { color: colors.gray400, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: spacing.lg },
});
