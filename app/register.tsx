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
import { authService } from '../src/services/authService';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { colors, spacing, radius } from '../src/lib/theme';

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    email: '',
    telefono: '',
    password: '',
    fechaNacimiento: '',
    genero: 'MASCULINO' as 'MASCULINO' | 'FEMENINO',
    ciudad: '',
    categoria: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.documento || !form.email || !form.password) {
      setError('Completa los campos obligatorios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.register(form);
      router.replace('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🏆</Text>
          </View>
          <Text style={styles.title}>Crear cuenta</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        <Input label="Nombre *" placeholder="Tu nombre" value={form.nombre} onChangeText={(v) => updateField('nombre', v)} />
        <Input label="Apellido *" placeholder="Tu apellido" value={form.apellido} onChangeText={(v) => updateField('apellido', v)} />
        <Input label="Documento *" placeholder="Tu documento" value={form.documento} onChangeText={(v) => updateField('documento', v)} />
        <Input label="Email *" placeholder="tu@email.com" value={form.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Teléfono" placeholder="09XX XXX XXX" value={form.telefono} onChangeText={(v) => updateField('telefono', v)} keyboardType="phone-pad" />
        <Input label="Contraseña *" placeholder="Mínimo 6 caracteres" value={form.password} onChangeText={(v) => updateField('password', v)} secureTextEntry />
        <Input label="Ciudad" placeholder="Tu ciudad" value={form.ciudad} onChangeText={(v) => updateField('ciudad', v)} />

        <Button title="Registrarme" onPress={handleRegister} loading={loading} size="lg" />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Iniciar sesión</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 16,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(223, 37, 49, 0.2)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md - 4,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
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
