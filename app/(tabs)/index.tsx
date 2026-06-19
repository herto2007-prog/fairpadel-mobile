import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  LogOut,
  MapPin,
  Trophy,
  Sparkles,
  UserPlus,
  Activity,
  CalendarClock,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { jugadorService, FeedItem, NodoAgenda, Agenda } from '../../src/services/jugadorService';
import { colors, spacing, radius } from '../../src/lib/theme';

const FEED_CONFIG: Record<string, { Icon: any; color: string; bg: string }> = {
  resultado: { Icon: Trophy, color: colors.amber500, bg: 'rgba(245,158,11,0.16)' },
  torneo_nuevo: { Icon: Sparkles, color: colors.primary, bg: 'rgba(223,37,49,0.16)' },
  inscripcion_seguido: { Icon: UserPlus, color: colors.blue500, bg: 'rgba(59,130,246,0.16)' },
};

const fmtFecha = (f: string | null) => (f ? f.split('-').reverse().slice(0, 2).join('/') : '');
const cuando = (n: NodoAgenda) => (n.programado ? `${fmtFecha(n.fecha)} ${n.hora ?? ''}`.trim() : 'Por confirmar');

function hace(fechaISO: string): string {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} d`;
  return `hace ${Math.floor(dias / 7)} sem`;
}

function HeroProximoPartido({ agenda }: { agenda: Agenda }) {
  const p = agenda.proximoPartido!;
  const sedeCancha = [p.sede, p.cancha].filter(Boolean).join(' · ');
  return (
    <View style={styles.hero}>
      <Text style={styles.heroKicker}>TU PRÓXIMO PARTIDO</Text>
      <Text style={styles.heroMatch}>
        {p.fase}
        {p.rival ? ` · vs ${p.rival}` : ''}
      </Text>
      <Text style={styles.heroWhen}>{cuando(p)}</Text>
      <Text style={styles.heroTorneo} numberOfLines={1}>{agenda.torneo.nombre}</Text>
      {sedeCancha ? (
        <View style={styles.heroMeta}>
          <MapPin size={13} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroMetaText}>{sedeCancha}</Text>
        </View>
      ) : null}
    </View>
  );
}

function HeroVacio() {
  return (
    <View style={styles.heroEmpty}>
      <CalendarClock size={26} color={colors.gray400} />
      <Text style={styles.heroEmptyTitle}>Todavía no tenés partidos próximos</Text>
      <Text style={styles.heroEmptyText}>
        Inscribite a un torneo y, cuando se sortee el cuadro, vas a ver acá tu próximo partido.
      </Text>
      <TouchableOpacity style={styles.heroEmptyBtn} onPress={() => router.navigate('/torneos')} activeOpacity={0.85}>
        <Trophy size={16} color={colors.white} />
        <Text style={styles.heroEmptyBtnText}>Ver torneos abiertos</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const c = FEED_CONFIG[item.tipo] || { Icon: Activity, color: colors.gray400, bg: colors.dark100 };
  const { Icon } = c;
  return (
    <View style={styles.feedRow}>
      <View style={[styles.feedIcon, { backgroundColor: c.bg }]}>
        <Icon size={18} color={c.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.feedTitle} numberOfLines={2}>{item.titulo}</Text>
        {item.detalle ? <Text style={styles.feedDetail} numberOfLines={1}>{item.detalle}</Text> : null}
      </View>
      <Text style={styles.feedTime}>{hace(item.fecha)}</Text>
    </View>
  );
}

export default function HomeTab() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const agendaQ = useQuery({ queryKey: ['mi-agenda'], queryFn: jugadorService.getMiAgenda });
  const feedQ = useQuery({ queryKey: ['feed'], queryFn: jugadorService.getFeed });

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const refetchAll = () => {
    agendaQ.refetch();
    feedQ.refetch();
  };

  const agendaConPartido = (agendaQ.data ?? []).find((a) => a.proximoPartido);
  const feedItems = feedQ.data ?? [];
  const cargando = agendaQ.isLoading || feedQ.isLoading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={agendaQ.isRefetching || feedQ.isRefetching}
          onRefresh={refetchAll}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Buenas,</Text>
          <Text style={styles.name} numberOfLines={1}>{user?.nombre} {user?.apellido}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={colors.gray400} />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          {agendaConPartido ? <HeroProximoPartido agenda={agendaConPartido} /> : <HeroVacio />}

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Activity size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Pulso de tu pádel</Text>
            </View>

            {feedItems.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {feedItems.map((it) => <FeedRow key={it.id} item={it} />)}
              </View>
            ) : (
              <View style={styles.feedEmpty}>
                <Text style={styles.feedEmptyText}>Cuando haya novedades en tu mundo del pádel, aparecen acá.</Text>
                <TouchableOpacity style={styles.feedEmptyLink} onPress={() => router.navigate('/torneos')}>
                  <Text style={styles.feedEmptyLinkText}>Explorar torneos</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  greeting: { color: colors.gray400, fontSize: 14 },
  name: { color: colors.white, fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { paddingTop: 60, alignItems: 'center' },
  // Hero próximo partido
  hero: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroMatch: { color: colors.white, fontSize: 20, fontWeight: '800', marginTop: 8 },
  heroWhen: { color: colors.white, fontSize: 15, fontWeight: '700', marginTop: 4 },
  heroTorneo: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 8 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  heroMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  // Hero vacío
  heroEmpty: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroEmptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  heroEmptyText: { color: colors.gray400, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  heroEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  heroEmptyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  // Sección feed
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md - 2,
  },
  feedIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  feedTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  feedDetail: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  feedTime: { color: colors.gray500, fontSize: 11 },
  feedEmpty: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  feedEmptyText: { color: colors.gray400, fontSize: 13, textAlign: 'center' },
  feedEmptyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  feedEmptyLinkText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
