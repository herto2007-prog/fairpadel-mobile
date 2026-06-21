import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Bell,
  Heart,
  Trophy,
  Activity,
  Ticket,
  TrendingUp,
  Wallet,
  MessageCircle,
  CheckCheck,
} from 'lucide-react-native';
import { notificacionService, Notificacion, TipoNotificacion } from '../src/services/notificacionService';
import { Skeleton } from '../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../src/lib/theme';

const ICONO: Record<string, { Icon: any; color: string }> = {
  SOCIAL: { Icon: Heart, color: colors.primary },
  TORNEO: { Icon: Trophy, color: colors.amber500 },
  PARTIDO: { Icon: Activity, color: colors.blue500 },
  INSCRIPCION: { Icon: Ticket, color: colors.green500 },
  RANKING: { Icon: TrendingUp, color: '#a78bfa' },
  PAGO: { Icon: Wallet, color: colors.green500 },
  MENSAJE: { Icon: MessageCircle, color: colors.blue500 },
  SISTEMA: { Icon: Bell, color: colors.gray400 },
};

function hace(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ayer';
  if (d < 7) return `hace ${d} d`;
  return `hace ${Math.floor(d / 7)} sem`;
}

export default function NotificacionesScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: notificacionService.getNotificaciones,
  });
  const lista = data ?? [];
  const hayNoLeidas = lista.some((n) => !n.leida);

  const refrescarContador = () => qc.invalidateQueries({ queryKey: ['notif-count'] });

  const abrir = async (n: Notificacion) => {
    if (!n.leida) {
      qc.setQueryData<Notificacion[]>(['notificaciones'], (prev) =>
        (prev ?? []).map((x) => (x.id === n.id ? { ...x, leida: true } : x)),
      );
      notificacionService.marcarLeida(n.id).then(refrescarContador).catch(() => undefined);
    }
    if (n.enlace) router.push(n.enlace as any);
  };

  const marcarTodas = async () => {
    qc.setQueryData<Notificacion[]>(['notificaciones'], (prev) =>
      (prev ?? []).map((x) => ({ ...x, leida: true })),
    );
    await notificacionService.marcarTodasLeidas().catch(() => undefined);
    refrescarContador();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        {hayNoLeidas && (
          <TouchableOpacity onPress={marcarTodas} style={styles.markAll} hitSlop={6}>
            <CheckCheck size={16} color={colors.primary} />
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.row}>
              <Skeleton style={{ width: 40, height: 40, borderRadius: radius.md }} />
              <View style={{ flex: 1 }}>
                <Skeleton style={{ height: 14, width: '55%' }} />
                <Skeleton style={{ height: 12, width: '80%', marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Bell size={40} color={colors.gray500} />
          <Text style={styles.emptyTitle}>No pudimos cargar tus notificaciones</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : lista.length === 0 ? (
        <View style={styles.centered}>
          <Bell size={44} color={colors.gray500} />
          <Text style={styles.emptyTitle}>Todavía no tenés notificaciones</Text>
          <Text style={styles.emptyText}>Cuando pase algo en tu mundo del pádel, te avisamos acá.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          {lista.map((n) => {
            const cfg = ICONO[n.tipo] || ICONO.SISTEMA;
            const { Icon } = cfg;
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.row, !n.leida && styles.rowUnread]}
                activeOpacity={0.8}
                onPress={() => abrir(n)}
              >
                <View style={[styles.icon, { backgroundColor: `${cfg.color}22` }]}>
                  <Icon size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  {n.titulo ? <Text style={styles.rowTitle} numberOfLines={1}>{n.titulo}</Text> : null}
                  <Text style={styles.rowText} numberOfLines={2}>{n.contenido}</Text>
                  <Text style={styles.rowTime}>{hace(n.createdAt)}</Text>
                </View>
                {!n.leida && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.white, fontSize: 22, fontWeight: 'bold' },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md - 2,
  },
  rowUnread: { backgroundColor: 'rgba(223,37,49,0.06)', borderColor: 'rgba(223,37,49,0.25)' },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },
  rowText: { color: colors.gray400, fontSize: 13, marginTop: 1 },
  rowTime: { color: colors.gray500, fontSize: 11, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  emptyText: { color: colors.gray400, fontSize: 14, marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg },
  retryText: { color: colors.white, fontWeight: '700' },
});
