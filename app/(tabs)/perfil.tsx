import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Shield, MapPin, Calendar, Edit3, LogOut, X, Camera, KeyRound, Bell, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { perfilService, PerfilJugador } from '../../src/services/perfilService';
import { PasswordModal } from '../../src/features/perfil/PasswordModal';
import { NotificacionesModal } from '../../src/features/perfil/NotificacionesModal';
import { colors, spacing, radius } from '../../src/lib/theme';

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.counter}>
      <Text style={styles.counterValue}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

function EditModal({
  perfil,
  visible,
  onClose,
  onSaved,
}: {
  perfil: PerfilJugador;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [bio, setBio] = useState(perfil.bio || '');
  const [ciudad, setCiudad] = useState(perfil.ciudad || '');
  const [telefono, setTelefono] = useState(perfil.telefono || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setSaving(true);
    setError('');
    try {
      await perfilService.updatePerfil({ bio: bio.trim(), ciudad: ciudad.trim(), telefono: telefono.trim() });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}><X size={22} color={colors.gray400} /></TouchableOpacity>
          </View>

          {error ? <Text style={styles.modalError}>{error}</Text> : null}

          <Text style={styles.modalLabel}>Biografía</Text>
          <TextInput
            style={[styles.modalInput, styles.modalTextarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Contanos sobre vos…"
            placeholderTextColor={colors.gray500}
            multiline
            maxLength={500}
          />

          <Text style={styles.modalLabel}>Ciudad</Text>
          <TextInput
            style={styles.modalInput}
            value={ciudad}
            onChangeText={setCiudad}
            placeholder="Tu ciudad"
            placeholderTextColor={colors.gray500}
          />

          <Text style={styles.modalLabel}>Teléfono</Text>
          <TextInput
            style={styles.modalInput}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="09XX XXX XXX"
            placeholderTextColor={colors.gray500}
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.modalSave} onPress={guardar} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.modalSaveText}>Guardar cambios</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PerfilTab() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const { data: perfil, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['mi-perfil'],
    queryFn: perfilService.getMiPerfil,
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const cambiarFoto = async () => {
    if (subiendoFoto) return;
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    setSubiendoFoto(true);
    try {
      await perfilService.updateFoto(res.assets[0].uri);
      qc.invalidateQueries({ queryKey: ['mi-perfil'] });
    } catch {
      // silencioso; el avatar queda como estaba
    } finally {
      setSubiendoFoto(false);
    }
  };

  const iniciales = perfil ? `${perfil.nombre?.[0] ?? ''}${perfil.apellido?.[0] ?? ''}`.toUpperCase() : '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : isError || !perfil ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>No pudimos cargar tu perfil</Text>
          <Text style={styles.errorText}>Revisá tu conexión e intentá de nuevo.</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.errorBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.head}>
            <TouchableOpacity onPress={cambiarFoto} activeOpacity={0.85} disabled={subiendoFoto}>
              {perfil.fotoUrl ? (
                <Image source={{ uri: perfil.fotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{iniciales}</Text></View>
              )}
              <View style={styles.camBadge}>
                {subiendoFoto ? <ActivityIndicator size="small" color={colors.white} /> : <Camera size={15} color={colors.white} />}
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{perfil.nombre} {perfil.apellido}</Text>
            {perfil.username ? <Text style={styles.username}>@{perfil.username}</Text> : null}

            <View style={styles.metaRow}>
              {perfil.categoria && (
                <View style={styles.metaItem}><Shield size={14} color={colors.blue500} /><Text style={styles.metaText}>{perfil.categoria.nombre}</Text></View>
              )}
              <View style={styles.metaItem}><MapPin size={14} color={colors.gray400} /><Text style={styles.metaText}>{perfil.ciudad || 'Sin ciudad'}{perfil.pais ? `, ${perfil.pais}` : ''}</Text></View>
              {perfil.edad ? (
                <View style={styles.metaItem}><Calendar size={14} color={colors.gray400} /><Text style={styles.metaText}>{perfil.edad} años</Text></View>
              ) : null}
            </View>

            {perfil.bio ? <Text style={styles.bio}>{perfil.bio}</Text> : null}

            <View style={styles.counters}>
              <Counter value={perfil.seguidores} label="Seguidores" />
              <View style={styles.counterDivider} />
              <Counter value={perfil.siguiendo} label="Siguiendo" />
              <View style={styles.counterDivider} />
              <Counter value={perfil.stats.torneosJugados} label="Torneos" />
            </View>

            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} activeOpacity={0.85}>
              <Edit3 size={16} color={colors.white} />
              <Text style={styles.editText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Datos de cuenta */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{perfil.email}</Text>
            </View>
            {perfil.telefono ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{perfil.telefono}</Text>
              </View>
            ) : null}
          </View>

          {/* Configuración */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Configuración</Text>
            <TouchableOpacity style={styles.configRow} onPress={() => setNotifModal(true)} activeOpacity={0.8}>
              <View style={styles.configIcon}><Bell size={18} color={colors.gray400} /></View>
              <Text style={styles.configText}>Notificaciones</Text>
              <ChevronRight size={20} color={colors.gray500} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.configRow} onPress={() => setPwModal(true)} activeOpacity={0.8}>
              <View style={styles.configIcon}><KeyRound size={18} color={colors.gray400} /></View>
              <Text style={styles.configText}>Cambiar contraseña</Text>
              <ChevronRight size={20} color={colors.gray500} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <LogOut size={18} color={colors.red500} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <EditModal
            perfil={perfil}
            visible={editing}
            onClose={() => setEditing(false)}
            onSaved={() => qc.invalidateQueries({ queryKey: ['mi-perfil'] })}
          />
          <PasswordModal visible={pwModal} onClose={() => setPwModal(false)} />
          <NotificacionesModal
            perfil={perfil}
            visible={notifModal}
            onClose={() => setNotifModal(false)}
            onUpdate={() => qc.invalidateQueries({ queryKey: ['mi-perfil'] })}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { paddingTop: 60, alignItems: 'center' },
  errorBox: { paddingTop: 60, alignItems: 'center', paddingHorizontal: spacing.xl },
  errorTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  errorText: { color: colors.gray400, fontSize: 14, marginTop: 4, textAlign: 'center' },
  errorBtn: {
    marginTop: spacing.lg, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg,
  },
  errorBtnText: { color: colors.white, fontWeight: '700' },
  head: { alignItems: 'center', paddingHorizontal: spacing.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: colors.primary },
  avatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  camBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  sectionLabel: { color: colors.gray500, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  configRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  configIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.dark100, alignItems: 'center', justifyContent: 'center' },
  configText: { flex: 1, color: colors.white, fontSize: 15, fontWeight: '600' },
  name: { color: colors.white, fontSize: 22, fontWeight: 'bold', marginTop: spacing.md },
  username: { color: colors.gray500, fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.gray400, fontSize: 13 },
  bio: { color: colors.gray400, fontSize: 14, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  counters: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, marginTop: spacing.lg,
  },
  counter: { alignItems: 'center' },
  counterValue: { color: colors.white, fontSize: 20, fontWeight: '800' },
  counterLabel: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  counterDivider: { width: 1, height: 28, backgroundColor: colors.border },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.dark200, borderRadius: radius.lg, paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xl, marginTop: spacing.lg,
  },
  editText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.sm },
  infoCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
  },
  infoLabel: { color: colors.gray500, fontSize: 12 },
  infoValue: { color: colors.white, fontSize: 15, fontWeight: '600', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingVertical: spacing.md,
  },
  logoutText: { color: colors.red500, fontWeight: '700', fontSize: 15 },
  // Modal
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  modalError: { color: '#fca5a5', fontSize: 14, marginBottom: spacing.sm },
  modalLabel: { color: colors.gray400, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.md },
  modalInput: {
    backgroundColor: colors.dark100, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2,
    color: colors.white, fontSize: 15,
  },
  modalTextarea: { height: 90, textAlignVertical: 'top' },
  modalSave: {
    backgroundColor: colors.primary, borderRadius: radius.lg, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  modalSaveText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
