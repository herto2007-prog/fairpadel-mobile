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
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Edit3, LogOut, X, Camera, KeyRound, Bell, ChevronRight, Ticket, Power, User } from 'lucide-react-native';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { perfilService, PerfilJugador } from '../../src/services/perfilService';
import { PasswordModal } from '../../src/features/perfil/PasswordModal';
import { NotificacionesModal } from '../../src/features/perfil/NotificacionesModal';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../../src/lib/theme';

const ELEVADO = '#161b26';

const fmtFecha = (f?: string | null) => {
  if (!f) return null;
  const [y, m, d] = f.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : f;
};

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
  const docFijo = !!perfil.documento;
  const generoFijo = !!perfil.genero;
  const [documento, setDocumento] = useState(perfil.documento || '');
  const [genero, setGenero] = useState<'MASCULINO' | 'FEMENINO' | ''>((perfil.genero as any) || '');
  const [nacimiento, setNacimiento] = useState(perfil.fechaNacimiento?.slice(0, 10) || '');
  const [ciudad, setCiudad] = useState(perfil.ciudad || '');
  const [telefono, setTelefono] = useState(perfil.telefono || '');
  const [bio, setBio] = useState(perfil.bio || '');
  const [instagram, setInstagram] = useState(perfil.instagram || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setError('');
    if (nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(nacimiento.trim())) {
      setError('La fecha debe ser AAAA-MM-DD (ej: 1990-05-23)');
      return;
    }
    setSaving(true);
    try {
      // Identidad (solo se setea lo que falta)
      const completar: any = {};
      if (!docFijo && documento.trim()) completar.documento = documento.trim();
      if (!generoFijo && genero) completar.genero = genero;
      if (Object.keys(completar).length > 0) {
        await perfilService.completarDatos(completar);
      }
      // Resto, editable siempre
      await perfilService.updatePerfil({
        bio: bio.trim(),
        ciudad: ciudad.trim(),
        telefono: telefono.trim(),
        fechaNacimiento: nacimiento.trim() || undefined,
        instagram: instagram.trim(),
      });
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

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            {error ? <Text style={styles.modalError}>{error}</Text> : null}

            <Text style={styles.modalLabel}>Documento {docFijo ? '(no editable)' : ''}</Text>
            <TextInput
              style={[styles.modalInput, docFijo && styles.modalInputOff]}
              value={documento}
              onChangeText={setDocumento}
              editable={!docFijo}
              placeholder="Cédula (solo números)"
              placeholderTextColor={colors.gray500}
              keyboardType="number-pad"
            />

            <Text style={styles.modalLabel}>Género {generoFijo ? '(no editable)' : ''}</Text>
            <View style={styles.generoRow}>
              {(['MASCULINO', 'FEMENINO'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.generoPill, genero === g && styles.generoPillOn]}
                  onPress={() => !generoFijo && setGenero(g)}
                  activeOpacity={generoFijo ? 1 : 0.8}
                  disabled={generoFijo}
                >
                  <Text style={[styles.generoText, genero === g && styles.generoTextOn]}>
                    {g === 'MASCULINO' ? 'Masculino' : 'Femenino'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Fecha de nacimiento</Text>
            <TextInput
              style={styles.modalInput}
              value={nacimiento}
              onChangeText={setNacimiento}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.gray500}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.modalLabel}>Ciudad</Text>
            <TextInput style={styles.modalInput} value={ciudad} onChangeText={setCiudad} placeholder="Tu ciudad" placeholderTextColor={colors.gray500} />

            <Text style={styles.modalLabel}>Teléfono</Text>
            <TextInput style={styles.modalInput} value={telefono} onChangeText={setTelefono} placeholder="09XX XXX XXX" placeholderTextColor={colors.gray500} keyboardType="phone-pad" />

            <Text style={styles.modalLabel}>Instagram</Text>
            <TextInput style={styles.modalInput} value={instagram} onChangeText={setInstagram} placeholder="@usuario" placeholderTextColor={colors.gray500} autoCapitalize="none" />

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
          </ScrollView>

          <TouchableOpacity style={styles.modalSave} onPress={guardar} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.modalSaveText}>Guardar cambios</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PerfilSkeleton() {
  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <View style={[styles.headCard, { alignItems: 'center' }]}>
        <Skeleton style={{ width: 88, height: 88, borderRadius: 44 }} />
        <Skeleton style={{ height: 20, width: 180, marginTop: spacing.md }} />
        <Skeleton style={{ height: 13, width: 110, marginTop: spacing.sm }} />
      </View>
      <Skeleton style={{ height: 70, borderRadius: radius.lg, marginTop: spacing.lg }} />
      <Skeleton style={{ height: 220, borderRadius: radius.lg, marginTop: spacing.lg }} />
    </View>
  );
}

function DatoRow({ label, value, onCompletar, last }: { label: string; value?: string | null; onCompletar: () => void; last?: boolean }) {
  return (
    <View style={[styles.datoRow, !last && styles.datoRowBorder]}>
      <Text style={styles.datoLabel}>{label}</Text>
      {value ? (
        <Text style={styles.datoValue} numberOfLines={1}>{value}</Text>
      ) : (
        <TouchableOpacity onPress={onCompletar} hitSlop={6}><Text style={styles.datoCompletar}>Completar</Text></TouchableOpacity>
      )}
    </View>
  );
}

function MenuRow({ icon, label, sub, onPress, color = colors.primary, textColor = colors.white }: { icon: React.ReactNode; label: string; sub?: string; onPress: () => void; color?: string; textColor?: string }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.menuChip, { backgroundColor: `${color}26` }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuText, { color: textColor }]}>{label}</Text>
        {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
      </View>
      <ChevronRight size={18} color={colors.gray500} />
    </TouchableOpacity>
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

  const handleDesactivar = () => {
    Alert.alert(
      'Desactivar mi cuenta',
      'No vas a poder iniciar sesión. Tu historial se conserva y podés pedir que la reactivemos cuando quieras.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await perfilService.desactivarCuenta();
              await logout();
              router.replace('/login');
            } catch {
              Alert.alert('Error', 'No se pudo desactivar la cuenta. Intentá de nuevo.');
            }
          },
        },
      ],
    );
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
      // silencioso
    } finally {
      setSubiendoFoto(false);
    }
  };

  const iniciales = perfil ? `${perfil.nombre?.[0] ?? ''}${perfil.apellido?.[0] ?? ''}`.toUpperCase() : '';

  // Completar perfil
  const campos: { ok: boolean; falta: string }[] = perfil
    ? [
        { ok: !!perfil.documento, falta: 'documento' },
        { ok: !!perfil.genero, falta: 'género' },
        { ok: !!perfil.fechaNacimiento, falta: 'fecha de nacimiento' },
        { ok: !!perfil.ciudad, falta: 'ciudad' },
        { ok: !!perfil.telefono, falta: 'teléfono' },
        { ok: !!perfil.fotoUrl, falta: 'foto' },
      ]
    : [];
  const completos = campos.filter((c) => c.ok).length;
  const pct = campos.length ? Math.round((completos / campos.length) * 100) : 100;
  const faltan = campos.filter((c) => !c.ok).map((c) => c.falta);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Mi perfil</Text>
        <TouchableOpacity style={styles.topEdit} onPress={() => setEditing(true)} activeOpacity={0.8} disabled={!perfil}>
          <Edit3 size={18} color={colors.gray400} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <PerfilSkeleton />
      ) : isError || !perfil ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>No pudimos cargar tu perfil</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.errorBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* Cabecera */}
          <View style={styles.headCard}>
            <TouchableOpacity onPress={cambiarFoto} activeOpacity={0.85} disabled={subiendoFoto}>
              {perfil.fotoUrl ? (
                <Image source={{ uri: perfil.fotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{iniciales}</Text></View>
              )}
              <View style={styles.camBadge}>
                {subiendoFoto ? <ActivityIndicator size="small" color={colors.white} /> : <Camera size={14} color={colors.white} />}
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{perfil.nombre} {perfil.apellido}</Text>
            {perfil.username ? <Text style={styles.username}>@{perfil.username}</Text> : null}
            <View style={styles.chipsRow}>
              {perfil.categoria && <View style={styles.chipRed}><Text style={styles.chipRedText}>{perfil.categoria.nombre}</Text></View>}
              {perfil.ranking?.[0] && <View style={styles.chipGray}><Text style={styles.chipGrayText}>Ranking #{perfil.ranking[0].posicion}</Text></View>}
            </View>
          </View>

          {/* Completar perfil */}
          {pct < 100 && (
            <TouchableOpacity style={styles.completarCard} activeOpacity={0.85} onPress={() => setEditing(true)}>
              <View style={styles.completarHead}>
                <Text style={styles.completarTitle}>Completá tu perfil</Text>
                <Text style={styles.completarPct}>{pct}%</Text>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
              {faltan.length > 0 && <Text style={styles.completarHint}>Te falta: {faltan.join(', ')}.</Text>}
            </TouchableOpacity>
          )}

          {/* Datos personales */}
          <Text style={styles.sectionLabel}>Datos personales</Text>
          <View style={styles.datosCard}>
            <DatoRow label="Documento" value={perfil.documento} onCompletar={() => setEditing(true)} />
            <DatoRow label="Género" value={perfil.genero === 'MASCULINO' ? 'Masculino' : perfil.genero === 'FEMENINO' ? 'Femenino' : null} onCompletar={() => setEditing(true)} />
            <DatoRow label="Nacimiento" value={fmtFecha(perfil.fechaNacimiento)} onCompletar={() => setEditing(true)} />
            <DatoRow label="Ciudad" value={perfil.ciudad} onCompletar={() => setEditing(true)} />
            <DatoRow label="Teléfono" value={perfil.telefono} onCompletar={() => setEditing(true)} />
            <DatoRow label="Email" value={perfil.email} onCompletar={() => setEditing(true)} last />
          </View>

          {/* Preferencias */}
          <Text style={styles.sectionLabel}>Preferencias</Text>
          <View style={styles.menuGroup}>
            <MenuRow icon={<User size={20} color={colors.primary} />} label="Editar perfil" onPress={() => setEditing(true)} />
            <MenuRow icon={<Bell size={20} color={colors.primary} />} label="Notificaciones" sub="Email · WhatsApp · Push" onPress={() => setNotifModal(true)} />
            <MenuRow icon={<KeyRound size={20} color={colors.primary} />} label="Contraseña" onPress={() => setPwModal(true)} />
          </View>

          {/* Mi actividad */}
          <Text style={styles.sectionLabel}>Mi actividad</Text>
          <View style={styles.menuGroup}>
            <MenuRow icon={<Ticket size={20} color={colors.primary} />} label="Mis inscripciones" onPress={() => router.push('/inscripciones')} />
          </View>

          {/* Cuenta */}
          <Text style={styles.sectionLabel}>Cuenta</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuRow} onPress={handleLogout} activeOpacity={0.8}>
              <View style={[styles.menuChip, { backgroundColor: 'rgba(239,68,68,0.13)' }]}><LogOut size={20} color={colors.red500} /></View>
              <Text style={[styles.menuText, { color: colors.red500, flex: 1 }]}>Cerrar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleDesactivar} activeOpacity={0.8}>
              <View style={[styles.menuChip, { backgroundColor: 'rgba(156,163,175,0.12)' }]}><Power size={20} color={colors.gray400} /></View>
              <Text style={[styles.menuText, { color: colors.gray400, flex: 1 }]}>Desactivar mi cuenta</Text>
            </TouchableOpacity>
          </View>

          <EditModal perfil={perfil} visible={editing} onClose={() => setEditing(false)} onSaved={() => qc.invalidateQueries({ queryKey: ['mi-perfil'] })} />
          <PasswordModal visible={pwModal} onClose={() => setPwModal(false)} />
          <NotificacionesModal perfil={perfil} visible={notifModal} onClose={() => setNotifModal(false)} onUpdate={() => qc.invalidateQueries({ queryKey: ['mi-perfil'] })} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  topTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  topEdit: { width: 38, height: 38, borderRadius: 19, backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  errorBox: { paddingTop: 60, alignItems: 'center', paddingHorizontal: spacing.xl },
  errorTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  errorBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg },
  errorBtnText: { color: colors.white, fontWeight: '700' },
  // Cabecera
  headCard: {
    backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 22,
    padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.primary },
  avatarFallback: { backgroundColor: '#22303f', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 30, fontWeight: '800' },
  camBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: ELEVADO,
  },
  name: { color: colors.white, fontSize: 20, fontWeight: 'bold', marginTop: spacing.md },
  username: { color: colors.gray500, fontSize: 13, marginTop: 2 },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  chipRed: { backgroundColor: 'rgba(223,37,49,0.16)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipRedText: { color: '#ff8a8a', fontSize: 12, fontWeight: '600' },
  chipGray: { backgroundColor: '#22303f', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipGrayText: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  // Completar perfil
  completarCard: {
    backgroundColor: ELEVADO, borderWidth: 1, borderColor: '#2a2030', borderRadius: 18,
    padding: spacing.md, marginTop: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  completarHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  completarTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },
  completarPct: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  progressTrack: { height: 7, backgroundColor: '#22303f', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  completarHint: { color: colors.gray400, fontSize: 12, marginTop: 9 },
  // Secciones
  sectionLabel: { color: colors.gray500, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xl, marginBottom: spacing.md, paddingHorizontal: 4 },
  // Datos personales
  datosCard: {
    backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  datoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  datoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  datoLabel: { color: colors.gray400, fontSize: 14 },
  datoValue: { color: colors.white, fontSize: 14, maxWidth: '60%' },
  datoCompletar: { color: colors.amber500, fontSize: 14, fontWeight: '600' },
  // Menú
  menuGroup: { gap: 12 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15,
    shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  menuChip: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menuText: { color: colors.white, fontSize: 15 },
  menuSub: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  // Modal
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  modalError: { color: '#fca5a5', fontSize: 13, marginBottom: spacing.sm },
  modalLabel: { color: colors.gray400, fontSize: 13, fontWeight: '600', marginTop: spacing.md, marginBottom: 6 },
  modalInput: { backgroundColor: colors.dark100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11, color: colors.white, fontSize: 15 },
  modalInputOff: { color: colors.gray500 },
  modalTextarea: { height: 90, textAlignVertical: 'top' },
  generoRow: { flexDirection: 'row', gap: spacing.sm },
  generoPill: { flex: 1, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.dark100 },
  generoPillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  generoText: { color: colors.gray400, fontSize: 14, fontWeight: '600' },
  generoTextOn: { color: colors.white },
  modalSave: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  modalSaveText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
