import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { X, Check, Mail, MessageCircle, Bell } from 'lucide-react-native';
import { perfilService, PerfilJugador, PreferenciaNotif } from '../../services/perfilService';
import { colors, spacing, radius } from '../../lib/theme';

const OPCIONES: { key: PreferenciaNotif; Icon: any; title: string; desc: string }[] = [
  { key: 'EMAIL', Icon: Mail, title: 'Solo Email', desc: 'Todas las notificaciones por correo' },
  { key: 'WHATSAPP', Icon: MessageCircle, title: 'Solo WhatsApp', desc: 'Mensajes de WhatsApp, sin emails' },
  { key: 'AMBOS', Icon: Bell, title: 'Email y WhatsApp', desc: 'En ambos canales' },
];

export function NotificacionesModal({
  perfil, visible, onClose, onUpdate,
}: { perfil: PerfilJugador; visible: boolean; onClose: () => void; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const wa = perfil.whatsapp;
  const pref: PreferenciaNotif = wa?.preferenciaNotificacion || 'EMAIL';
  const waConfirmado = wa?.consentStatus === 'CONFIRMADO';

  const cambiarPref = async (nueva: PreferenciaNotif) => {
    if (nueva === pref) return;
    if (nueva !== 'EMAIL' && !waConfirmado) return;
    setLoading(true); setError(''); setMsg('');
    try {
      const r = await perfilService.updatePreferenciasNotificacion(nueva);
      setMsg(r?.message || 'Preferencia actualizada'); onUpdate();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo actualizar.');
    } finally { setLoading(false); }
  };

  const activarWa = async () => {
    setLoading(true); setError(''); setMsg('');
    try {
      const r = await perfilService.solicitarWhatsapp();
      setMsg(r?.message || 'Te enviamos un mensaje de confirmación por WhatsApp.'); onUpdate();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo activar.');
    } finally { setLoading(false); }
  };

  const revocarWa = async () => {
    setLoading(true); setError(''); setMsg('');
    try {
      const r = await perfilService.revocarWhatsapp();
      setMsg(r?.message || 'WhatsApp desactivado.'); onUpdate();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo revocar.');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.title}>Notificaciones</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}><X size={22} color={colors.gray400} /></TouchableOpacity>
          </View>
          <Text style={styles.sub}>Elegí cómo querés recibir los avisos.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {msg ? <Text style={styles.msg}>{msg}</Text> : null}

          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {OPCIONES.map((o) => {
              const activa = pref === o.key;
              const bloqueada = o.key !== 'EMAIL' && !waConfirmado;
              return (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.opt, activa && styles.optOn, bloqueada && styles.optOff]}
                  disabled={loading || bloqueada}
                  onPress={() => cambiarPref(o.key)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.optIcon, activa && styles.optIconOn]}><o.Icon size={18} color={activa ? colors.primary : colors.gray400} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optTitle, activa && { color: colors.white }]}>{o.title}</Text>
                    <Text style={styles.optDesc}>{bloqueada ? 'Activá WhatsApp primero' : o.desc}</Text>
                  </View>
                  {activa && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Estado / acciones de WhatsApp */}
          <View style={styles.waBox}>
            {!wa?.consentCheckbox || wa?.consentStatus === 'RECHAZADO' || wa?.consentStatus === 'REVOCADO' ? (
              perfil.telefono ? (
                <TouchableOpacity style={styles.waActivar} onPress={activarWa} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#34d399" /> : <Text style={styles.waActivarText}>Activar WhatsApp</Text>}
                </TouchableOpacity>
              ) : (
                <Text style={styles.waHint}>Agregá tu teléfono en "Editar perfil" para activar WhatsApp.</Text>
              )
            ) : wa?.consentStatus === 'PENDIENTE' ? (
              <Text style={styles.waHint}>Te enviamos un WhatsApp a {perfil.telefono}. Respondé "SI" para activarlo.</Text>
            ) : wa?.consentStatus === 'CONFIRMADO' ? (
              <View>
                <Text style={styles.waOk}>WhatsApp activo en {perfil.telefono}</Text>
                <TouchableOpacity onPress={revocarWa} disabled={loading}><Text style={styles.waRevocar}>Desactivar WhatsApp</Text></TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  sub: { color: colors.gray400, fontSize: 13, marginTop: 2 },
  error: { color: '#fca5a5', fontSize: 14, marginTop: spacing.md },
  msg: { color: '#34d399', fontSize: 14, marginTop: spacing.md },
  opt: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.dark100 },
  optOn: { borderColor: colors.primary, backgroundColor: 'rgba(223,37,49,0.10)' },
  optOff: { opacity: 0.45 },
  optIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  optIconOn: { backgroundColor: 'rgba(223,37,49,0.18)' },
  optTitle: { color: colors.gray400, fontSize: 14, fontWeight: '600' },
  optDesc: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  waBox: { marginTop: spacing.lg },
  waActivar: { backgroundColor: 'rgba(16,185,129,0.16)', borderRadius: radius.lg, paddingVertical: spacing.md - 2, alignItems: 'center' },
  waActivarText: { color: '#34d399', fontWeight: '700', fontSize: 14 },
  waHint: { color: colors.gray400, fontSize: 13, lineHeight: 19 },
  waOk: { color: colors.gray400, fontSize: 13 },
  waRevocar: { color: colors.red500, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
});
