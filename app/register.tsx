import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../src/features/auth/context/AuthContext';
import { authService } from '../src/services/authService';
import { GoogleSignInButton } from '../src/features/auth/GoogleSignInButton';
import { colors, spacing, radius } from '../src/lib/theme';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { login } = useAuth();
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setField = (campo: keyof typeof form, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const puedeEnviar =
    form.nombre.trim().length >= 2 &&
    form.apellido.trim().length >= 2 &&
    emailRegex.test(form.email) &&
    form.password.length >= 6;

  const handleSubmit = async () => {
    if (!puedeEnviar || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await authService.register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // Entrar directo (el back permite navegar sin verificar el email aún)
      await login(form.email.trim(), form.password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo crear la cuenta. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.title}>Creá tu cuenta</Text>
          <Text style={styles.subtitle}>Es gratis y toma menos de un minuto.</Text>
        </View>

        <GoogleSignInButton onError={setError} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o con tu email</Text>
          <View style={styles.dividerLine} />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Nombre + Apellido */}
        <View style={styles.row}>
          <View style={[styles.inputWrap, styles.half]}>
            <User size={18} color={colors.gray500} />
            <TextInput
              style={styles.input}
              value={form.nombre}
              onChangeText={(v) => setField('nombre', v)}
              placeholder="Nombre"
              placeholderTextColor={colors.gray500}
            />
          </View>
          <View style={[styles.inputWrap, styles.half]}>
            <User size={18} color={colors.gray500} />
            <TextInput
              style={styles.input}
              value={form.apellido}
              onChangeText={(v) => setField('apellido', v)}
              placeholder="Apellido"
              placeholderTextColor={colors.gray500}
            />
          </View>
        </View>

        {/* Email */}
        <View style={[styles.inputWrap, styles.mt]}>
          <Mail size={18} color={colors.gray500} />
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => setField('email', v)}
            placeholder="tu@email.com"
            placeholderTextColor={colors.gray500}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        {/* Contraseña */}
        <View style={[styles.inputWrap, styles.mt]}>
          <Lock size={18} color={colors.gray500} />
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={(v) => setField('password', v)}
            placeholder="Contraseña (mínimo 6)"
            placeholderTextColor={colors.gray500}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
            {showPassword ? <EyeOff size={18} color={colors.gray500} /> : <Eye size={18} color={colors.gray500} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submit, !puedeEnviar && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!puedeEnviar || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.submitText}>Crear cuenta</Text>
              <ArrowRight size={18} color={colors.white} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>Al crear tu cuenta aceptás las normativas de FairPadel.</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.footerLink}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  head: { alignItems: 'center', marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: colors.gray400, fontSize: 14, marginTop: spacing.xs },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.gray500, fontSize: 12 },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  mt: { marginTop: spacing.sm + 4 },
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
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  legal: { color: colors.gray500, fontSize: 12, textAlign: 'center', marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { color: colors.gray400 },
  footerLink: { color: colors.primary, fontWeight: '700' },
});
