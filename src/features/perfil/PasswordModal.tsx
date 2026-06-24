import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { perfilService } from '../../services/perfilService';
import { colors, spacing, radius } from '../../lib/theme';

export function PasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const cerrar = () => {
    setActual(''); setNueva(''); setConfirmar(''); setError(''); setOk(false);
    onClose();
  };

  const guardar = async () => {
    setError('');
    if (nueva.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden.'); return; }
    setSaving(true);
    try {
      await perfilService.updatePassword(actual, nueva);
      setOk(true);
      setTimeout(cerrar, 1200);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.title}>Cambiar contraseña</Text>
            <TouchableOpacity onPress={cerrar} hitSlop={8}><X size={22} color={colors.gray400} /></TouchableOpacity>
          </View>

          {ok ? (
            <View style={styles.okBox}><Check size={20} color={colors.green500} /><Text style={styles.okText}>Contraseña actualizada</Text></View>
          ) : (
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Text style={styles.label}>Contraseña actual</Text>
              <TextInput style={styles.input} value={actual} onChangeText={setActual} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.gray500} />
              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput style={styles.input} value={nueva} onChangeText={setNueva} secureTextEntry placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.gray500} />
              <Text style={styles.label}>Repetir nueva contraseña</Text>
              <TextInput style={styles.input} value={confirmar} onChangeText={setConfirmar} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.gray500} />
              <TouchableOpacity style={styles.save} onPress={guardar} disabled={saving || !actual || !nueva || !confirmar} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Guardar</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  label: { color: colors.gray400, fontSize: 13, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  input: { backgroundColor: colors.dark100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2, color: colors.white, fontSize: 15 },
  error: { color: '#fca5a5', fontSize: 14 },
  save: { backgroundColor: colors.primary, borderRadius: radius.lg, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  saveText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  okBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  okText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
