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
import {
  ArrowLeft, MapPin, ChevronDown, ChevronRight, Building2, Sun, Ticket, Clock,
} from 'lucide-react-native';
import { reservaService, SedeDisp, SlotDisp, CanchaDisp } from '../src/services/reservaService';
import { Skeleton } from '../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../src/lib/theme';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

interface DiaOpcion { iso: string; dow: string; day: number; mon: string; }

function buildDias(n: number): DiaOpcion[] {
  const base = new Date();
  const out: DiaOpcion[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    out.push({
      iso: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      dow: DIAS[d.getDay()],
      day,
      mon: MESES[m],
    });
  }
  return out;
}

const DURACIONES = [
  { label: '1h', v: 60 },
  { label: '1h 30', v: 90 },
  { label: '2h', v: 120 },
];

const fmtDuracion = (min: number) => (min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h ${min % 60}m`);

export default function ReservarScreen() {
  const insets = useSafeAreaInsets();
  const dias = buildDias(14);
  const [fecha, setFecha] = useState(dias[0].iso);
  const [duracion, setDuracion] = useState(120);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [reservando, setReservando] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['disponibilidad-global', fecha, duracion],
    queryFn: () => reservaService.getDisponibilidadGlobal(fecha, duracion),
  });
  const sedes = q.data ?? [];

  const confirmar = (sede: SedeDisp, cancha: CanchaDisp, slot: SlotDisp) => {
    const key = `${cancha.cancha.id}-${slot.horaInicio}`;
    Alert.alert(
      'Confirmar reserva',
      `${sede.sede.nombre}\n${cancha.cancha.nombre}\n${slot.horaInicio} - ${slot.horaFin}\nDuración: ${fmtDuracion(duracion)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reservar',
          onPress: async () => {
            setReservando(key);
            try {
              await reservaService.crearReserva({
                sedeCanchaId: cancha.cancha.id,
                fecha,
                horaInicio: slot.horaInicio,
                horaFin: slot.horaFin,
                duracionMinutos: duracion,
              });
              Alert.alert('¡Reservado!', 'Tu reserva quedó confirmada. La ves en "Mis reservas".');
              await q.refetch();
            } catch (e: any) {
              Alert.alert('No se pudo reservar', e?.response?.data?.message || 'Intentá de nuevo.');
            } finally {
              setReservando(null);
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
        <Text style={styles.title}>Reservar cancha</Text>
        <TouchableOpacity onPress={() => router.push('/mis-reservas')} style={styles.misBtn} activeOpacity={0.8}>
          <Ticket size={16} color={colors.primary} />
          <Text style={styles.misBtnText}>Mis reservas</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de día */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          style={{ marginBottom: spacing.sm }}
        >
          {dias.map((d) => {
            const on = d.iso === fecha;
            return (
              <TouchableOpacity
                key={d.iso}
                onPress={() => { setFecha(d.iso); setExpandida(null); }}
                activeOpacity={0.8}
                style={[styles.dia, on && styles.diaOn]}
              >
                <Text style={[styles.diaDow, on && styles.diaTextOn]}>{d.dow}</Text>
                <Text style={[styles.diaNum, on && styles.diaTextOn]}>{d.day}</Text>
                <Text style={[styles.diaMon, on && styles.diaTextOn]}>{d.mon}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selector de duración */}
        <View style={styles.duracionRow}>
          <Clock size={15} color={colors.gray400} />
          {DURACIONES.map((d) => {
            const on = d.v === duracion;
            return (
              <TouchableOpacity
                key={d.v}
                onPress={() => { setDuracion(d.v); setExpandida(null); }}
                activeOpacity={0.8}
                style={[styles.durChip, on && styles.durChipOn]}
              >
                <Text style={[styles.durText, on && styles.diaTextOn]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.primary} />}
      >
        {q.isLoading ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={styles.sedeCard}>
              <Skeleton style={{ width: 44, height: 44, borderRadius: radius.md }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={{ height: 16, width: '60%' }} />
                <Skeleton style={{ height: 12, width: '40%' }} />
              </View>
            </View>
          ))
        ) : sedes.length === 0 ? (
          <View style={styles.empty}>
            <Building2 size={40} color={colors.gray500} />
            <Text style={styles.emptyText}>
              No hay complejos con canchas libres para esta fecha y duración. Probá con otro día.
            </Text>
          </View>
        ) : (
          sedes.map((s) => {
            const abierta = expandida === s.sede.id;
            const canchas = s.canchas.filter((c) => c.slots.some((sl) => sl.disponible));
            return (
              <View key={s.sede.id} style={styles.sedeWrap}>
                <TouchableOpacity
                  style={styles.sedeCard}
                  activeOpacity={0.85}
                  onPress={() => setExpandida(abierta ? null : s.sede.id)}
                >
                  <View style={styles.sedeLogo}>
                    <Building2 size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sedeName} numberOfLines={1}>{s.sede.nombre}</Text>
                    <View style={styles.sedeMetaRow}>
                      <MapPin size={12} color={colors.gray500} />
                      <Text style={styles.sedeMeta} numberOfLines={1}>{s.sede.ciudad}</Text>
                    </View>
                    <Text style={styles.sedeLibres}>
                      {s.canchasDisponibles} cancha{s.canchasDisponibles !== 1 ? 's' : ''} con horarios libres
                    </Text>
                  </View>
                  {abierta ? <ChevronDown size={20} color={colors.gray500} /> : <ChevronRight size={20} color={colors.gray500} />}
                </TouchableOpacity>

                {abierta && (
                  <View style={styles.canchasBox}>
                    {canchas.map((c) => {
                      const libres = c.slots.filter((sl) => sl.disponible);
                      return (
                        <View key={c.cancha.id} style={styles.canchaBlock}>
                          <View style={styles.canchaHead}>
                            <Text style={styles.canchaName}>{c.cancha.nombre}</Text>
                            {c.cancha.tieneLuz && <Sun size={13} color={colors.amber500} />}
                          </View>
                          <View style={styles.slotsWrap}>
                            {libres.map((sl) => {
                              const key = `${c.cancha.id}-${sl.horaInicio}`;
                              const busy = reservando === key;
                              return (
                                <TouchableOpacity
                                  key={sl.horaInicio}
                                  style={[styles.slot, busy && styles.slotBusy]}
                                  activeOpacity={0.85}
                                  disabled={!!reservando}
                                  onPress={() => confirmar(s, c, sl)}
                                >
                                  <Text style={styles.slotText}>{sl.horaInicio}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}
                  </View>
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
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold', flex: 1 },
  misBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(223,37,49,0.12)', paddingHorizontal: spacing.md - 4, paddingVertical: 6, borderRadius: radius.md,
  },
  misBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  // Días
  dia: {
    width: 56, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  diaOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  diaDow: { color: colors.gray400, fontSize: 11, fontWeight: '600' },
  diaNum: { color: colors.white, fontSize: 18, fontWeight: '800', marginVertical: 1 },
  diaMon: { color: colors.gray500, fontSize: 10 },
  diaTextOn: { color: colors.white },
  // Duración
  duracionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  durChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  durChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  durText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  // Sede
  sedeWrap: { marginBottom: spacing.md },
  sedeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
  },
  sedeLogo: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(223,37,49,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  sedeName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  sedeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sedeMeta: { color: colors.gray500, fontSize: 12 },
  sedeLibres: { color: colors.green500, fontSize: 12, marginTop: 3 },
  canchasBox: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderTopWidth: 0,
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg,
    marginTop: -radius.lg, paddingTop: radius.lg + spacing.sm, padding: spacing.md, gap: spacing.md,
  },
  canchaBlock: { gap: spacing.sm },
  canchaHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  canchaName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: colors.dark100, borderWidth: 1, borderColor: colors.border,
  },
  slotBusy: { opacity: 0.4 },
  slotText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: 60 },
  emptyText: { color: colors.gray400, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.lg },
});
