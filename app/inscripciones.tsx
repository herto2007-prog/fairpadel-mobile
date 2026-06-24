import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Trophy,
  MapPin,
  CalendarDays,
  Users,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react-native';
import {
  inscripcionService,
  MiInscripcion,
  InscripcionEstado,
} from '../src/services/inscripcionService';
import { useAuth } from '../src/features/auth/context/AuthContext';
import { Skeleton } from '../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../src/lib/theme';
import { formatDatePYShort } from '../src/utils/date';

const ESTADO: Record<InscripcionEstado, { label: string; color: string }> = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', color: colors.amber500 },
  PENDIENTE_CONFIRMACION: { label: 'Pendiente de confirmación', color: colors.blue500 },
  CONFIRMADA: { label: 'Confirmada', color: colors.green500 },
  CANCELADA: { label: 'Cancelada', color: colors.gray500 },
};

const ymd = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

function ListSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <Skeleton style={{ height: 18, width: '65%' }} />
          <Skeleton style={{ height: 13, width: '45%', marginTop: spacing.md }} />
          <Skeleton style={{ height: 13, width: '55%', marginTop: spacing.sm }} />
          <Skeleton style={{ height: 26, width: 140, borderRadius: 999, marginTop: spacing.md }} />
        </View>
      ))}
    </View>
  );
}

function InscripcionCard({
  ins,
  esJugador1,
  onCancelar,
  cancelando,
}: {
  ins: MiInscripcion;
  esJugador1: boolean;
  onCancelar: () => void;
  cancelando: boolean;
}) {
  const cfg = ESTADO[ins.estado];
  const pareja = ins.jugador2 ? `${ins.jugador2.nombre} ${ins.jugador2.apellido}`.trim() : null;
  const fecha = ymd(ins.tournament?.fechaInicio);
  // El back decide si se puede (solo jugador 1, antes del sorteo). El front refleja.
  const puedeCancelar = !!ins.puedeCancelar;
  // Soy el dueño de la inscripción pero ya no puedo bajarme solo (cuadro armado).
  const avisarOrganizador = esJugador1 && !puedeCancelar && ins.estado !== 'CANCELADA';

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Trophy size={18} color={colors.primary} />
        <Text style={styles.torneo} numberOfLines={2}>{ins.tournament?.nombre ?? 'Torneo'}</Text>
      </View>

      <View style={styles.metaRow}>
        {ins.category?.nombre ? (
          <View style={styles.metaItem}>
            <Users size={14} color={colors.gray400} />
            <Text style={styles.metaText}>{ins.category.nombre}</Text>
          </View>
        ) : null}
        {ins.tournament?.ciudad ? (
          <View style={styles.metaItem}>
            <MapPin size={14} color={colors.gray400} />
            <Text style={styles.metaText}>{ins.tournament.ciudad}</Text>
          </View>
        ) : null}
        {fecha ? (
          <View style={styles.metaItem}>
            <CalendarDays size={14} color={colors.gray400} />
            <Text style={styles.metaText}>{formatDatePYShort(fecha)}</Text>
          </View>
        ) : null}
      </View>

      {pareja ? (
        <Text style={styles.pareja}>Pareja: {pareja}</Text>
      ) : (
        <Text style={styles.parejaSoft}>Pareja: a confirmar</Text>
      )}

      <View style={styles.footer}>
        <View style={[styles.pill, { backgroundColor: `${cfg.color}1a` }]}>
          <Clock size={13} color={cfg.color} />
          <Text style={[styles.pillText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {puedeCancelar && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancelar}
            disabled={cancelando}
            activeOpacity={0.8}
          >
            <XCircle size={15} color={colors.red500} />
            <Text style={styles.cancelText}>{cancelando ? 'Cancelando…' : 'Cancelar'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {avisarOrganizador && (
        <Text style={styles.nota}>
          El cuadro ya está armado. Si necesitás bajarte, contactá al organizador.
        </Text>
      )}
    </View>
  );
}

export default function MisInscripcionesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['mis-inscripciones'],
    queryFn: inscripcionService.getMisInscripciones,
  });

  const cancelarMut = useMutation({
    mutationFn: (id: string) => inscripcionService.cancelar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-inscripciones'] });
      qc.invalidateQueries({ queryKey: ['mi-agenda'] });
    },
    onError: (e: any) => {
      Alert.alert('No se pudo cancelar', e?.response?.data?.message || 'Intentá de nuevo más tarde.');
    },
  });

  const inscripciones = data ?? [];

  const now = new Date();
  const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const esPasada = (ins: MiInscripcion) => {
    if (ins.estado === 'CANCELADA') return true;
    const f = ymd(ins.tournament?.fechaInicio);
    return !!f && f < hoy;
  };
  const activas = inscripciones.filter((i) => !esPasada(i));
  const pasadas = inscripciones.filter(esPasada);

  const confirmarCancelar = (ins: MiInscripcion) => {
    Alert.alert(
      'Cancelar inscripción',
      `¿Seguro que querés cancelar tu inscripción en "${ins.tournament?.nombre ?? 'este torneo'}"? No se puede deshacer.`,
      [
        { text: 'No, volver', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelarMut.mutate(ins.id) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis inscripciones</Text>
      </View>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <View style={styles.centered}>
          <AlertCircle size={40} color={colors.gray500} />
          <Text style={styles.emptyTitle}>No pudimos cargar tus inscripciones</Text>
          <Text style={styles.emptyText}>Revisá tu conexión e intentá de nuevo.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : inscripciones.length === 0 ? (
        <View style={styles.centered}>
          <Trophy size={44} color={colors.gray500} />
          <Text style={styles.emptyTitle}>Todavía no tenés inscripciones</Text>
          <Text style={styles.emptyText}>Explorá los torneos abiertos y sumate.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.navigate('/torneos')} activeOpacity={0.85}>
            <Text style={styles.retryText}>Ver torneos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {activas.length > 0 && (
            <>
              <Text style={styles.groupLabel}>Activas</Text>
              {activas.map((ins) => (
                <InscripcionCard
                  key={ins.id}
                  ins={ins}
                  esJugador1={ins.jugador1Id === user?.id}
                  cancelando={cancelarMut.isPending && cancelarMut.variables === ins.id}
                  onCancelar={() => confirmarCancelar(ins)}
                />
              ))}
            </>
          )}
          {pasadas.length > 0 && (
            <>
              <Text style={[styles.groupLabel, activas.length > 0 && { marginTop: spacing.lg }]}>Finalizadas</Text>
              {pasadas.map((ins) => (
                <InscripcionCard
                  key={ins.id}
                  ins={ins}
                  esJugador1={ins.jugador1Id === user?.id}
                  cancelando={cancelarMut.isPending && cancelarMut.variables === ins.id}
                  onCancelar={() => confirmarCancelar(ins)}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.md },
  groupLabel: { color: colors.gray500, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: -2 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  torneo: { flex: 1, color: colors.white, fontSize: 16, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.gray400, fontSize: 13 },
  pareja: { color: colors.gray400, fontSize: 13, marginTop: spacing.sm },
  parejaSoft: { color: colors.gray500, fontSize: 13, fontStyle: 'italic', marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cancelText: { color: colors.red500, fontSize: 13, fontWeight: '700' },
  nota: { color: colors.gray500, fontSize: 12, fontStyle: 'italic', marginTop: spacing.sm, lineHeight: 17 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  emptyText: { color: colors.gray400, fontSize: 14, marginTop: 4, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.lg, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg,
  },
  retryText: { color: colors.white, fontWeight: '700' },
});
