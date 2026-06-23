import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Ticket, MapPin, Clock, X } from 'lucide-react-native';
import { reservaService, MiReserva } from '../src/services/reservaService';
import { Skeleton } from '../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../src/lib/theme';

const ESTADO: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMADA: { label: 'Confirmada', color: colors.green500, bg: 'rgba(16,185,129,0.15)' },
  PENDIENTE: { label: 'Pendiente', color: colors.amber500, bg: 'rgba(245,158,11,0.15)' },
  CANCELADA: { label: 'Cancelada', color: colors.gray500, bg: 'rgba(107,114,128,0.18)' },
  RECHAZADA: { label: 'Rechazada', color: colors.red500, bg: 'rgba(239,68,68,0.15)' },
  COMPLETADA: { label: 'Completada', color: colors.blue500, bg: 'rgba(59,130,246,0.15)' },
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtFecha = (iso: string) => {
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

export default function MisReservasScreen() {
  const insets = useSafeAreaInsets();
  const [cancelando, setCancelando] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['mis-reservas'], queryFn: reservaService.getMisReservas });
  const reservas = q.data ?? [];

  const puedeCancelar = (r: MiReserva) =>
    (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE') && r.fecha.split('T')[0] >= todayIso();

  const cancelar = (r: MiReserva) => {
    Alert.alert(
      '¿Cancelar reserva?',
      `${r.sedeCancha?.sede?.nombre ?? ''} · ${fmtFecha(r.fecha)} ${r.horaInicio}`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar reserva',
          style: 'destructive',
          onPress: async () => {
            setCancelando(r.id);
            try {
              await reservaService.cancelarReserva(r.id);
              await q.refetch();
            } catch (e: any) {
              Alert.alert('No se pudo cancelar', e?.response?.data?.message || 'Intentá de nuevo.');
            } finally {
              setCancelando(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis reservas</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.primary} />}
      >
        {q.isLoading ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={styles.card}>
              <Skeleton style={{ height: 16, width: '55%' }} />
              <Skeleton style={{ height: 12, width: '40%', marginTop: 10 }} />
            </View>
          ))
        ) : reservas.length === 0 ? (
          <View style={styles.empty}>
            <Ticket size={40} color={colors.gray500} />
            <Text style={styles.emptyText}>Todavía no tenés reservas.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.replace('/reservar')} activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Reservar una cancha</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reservas.map((r) => {
            const e = ESTADO[r.estado] ?? ESTADO.PENDIENTE;
            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.sede} numberOfLines={1}>{r.sedeCancha?.sede?.nombre ?? 'Complejo'}</Text>
                  <View style={[styles.pill, { backgroundColor: e.bg }]}>
                    <Text style={[styles.pillText, { color: e.color }]}>{e.label}</Text>
                  </View>
                </View>
                <Text style={styles.cancha}>{r.sedeCancha?.nombre ?? ''}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.meta}><MapPin size={13} color={colors.gray500} /><Text style={styles.metaText}>{fmtFecha(r.fecha)}</Text></View>
                  <View style={styles.meta}><Clock size={13} color={colors.gray500} /><Text style={styles.metaText}>{r.horaInicio} - {r.horaFin}</Text></View>
                </View>

                {puedeCancelar(r) && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.85}
                    disabled={cancelando === r.id}
                    onPress={() => cancelar(r)}
                  >
                    <X size={15} color={colors.red500} />
                    <Text style={styles.cancelText}>{cancelando === r.id ? 'Cancelando...' : 'Cancelar reserva'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: { padding: 4 },
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sede: { color: colors.white, fontSize: 16, fontWeight: '700', flex: 1 },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  pillText: { fontSize: 11, fontWeight: '700' },
  cancha: { color: colors.gray400, fontSize: 13, marginTop: 3 },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.gray400, fontSize: 13 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: radius.md, paddingVertical: spacing.sm, marginTop: spacing.md,
  },
  cancelText: { color: colors.red500, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: 60 },
  emptyText: { color: colors.gray400, fontSize: 14, textAlign: 'center' },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.lg },
  emptyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
