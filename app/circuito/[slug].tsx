import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, TrendingUp, CalendarDays } from 'lucide-react-native';
import { circuitoService } from '../../src/services/circuitoService';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../../src/lib/theme';

const fmtFecha = (f?: string | null) =>
  f ? f.slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '';

function Avatar({ uri, ini }: { uri?: string | null; ini: string }) {
  if (uri) return <Image source={{ uri }} style={styles.avatar} />;
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarIni}>{ini}</Text>
    </View>
  );
}

export default function CircuitoDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();

  const detalleQ = useQuery({
    queryKey: ['circuito', slug],
    queryFn: () => circuitoService.getBySlug(slug),
    enabled: !!slug,
  });
  const circuito = detalleQ.data;

  const rankingQ = useQuery({
    queryKey: ['circuito-ranking', circuito?.id],
    queryFn: () => circuitoService.getRanking(circuito!.id),
    enabled: !!circuito?.id,
  });
  const ranking = rankingQ.data ?? [];
  const torneos = circuito?.torneos ?? [];

  const refetchAll = () => {
    detalleQ.refetch();
    rankingQ.refetch();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{circuito?.nombre ?? 'Circuito'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={detalleQ.isRefetching || rankingQ.isRefetching}
            onRefresh={refetchAll}
            tintColor={colors.primary}
          />
        }
      >
        {detalleQ.isLoading ? (
          <>
            <Skeleton style={{ height: 14, width: '50%', marginBottom: spacing.lg }} />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: 48, marginBottom: spacing.sm, borderRadius: radius.md }} />
            ))}
          </>
        ) : !circuito ? (
          <Text style={styles.emptyText}>No se encontró el circuito.</Text>
        ) : (
          <>
            <Text style={styles.meta}>
              {circuito.ciudad} · Temporada {circuito.temporada}
            </Text>
            {!!circuito.descripcion && <Text style={styles.desc}>{circuito.descripcion}</Text>}

            {/* Ranking */}
            <View style={styles.sectionHead}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Ranking</Text>
            </View>

            {rankingQ.isLoading ? (
              [0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 44, marginBottom: spacing.sm, borderRadius: radius.md }} />
              ))
            ) : ranking.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>
                  Todavía no hay puntos en este circuito. Aparecerán cuando se finalicen sus torneos.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {ranking.map((f) => {
                  const esYo = f.jugadorId === user?.id;
                  const nombre = f.jugador ? `${f.jugador.nombre} ${f.jugador.apellido}` : 'Jugador';
                  const ini = f.jugador ? `${f.jugador.nombre[0] ?? ''}${f.jugador.apellido[0] ?? ''}` : '?';
                  return (
                    <TouchableOpacity
                      key={f.jugadorId}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/jugador/${f.jugadorId}`)}
                      style={[styles.rankRow, esYo && styles.rankRowYo]}
                    >
                      <Text style={[
                        styles.pos,
                        f.posicion === 1 && { color: '#facc15' },
                        f.posicion === 2 && { color: '#d1d5db' },
                        f.posicion === 3 && { color: '#d97706' },
                      ]}>{f.posicion}</Text>
                      <Avatar uri={f.jugador?.fotoUrl} ini={ini} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rankName} numberOfLines={1}>
                          {nombre}{esYo ? ' · vos' : ''}
                        </Text>
                        <Text style={styles.rankSub}>
                          {f.torneosJugados} torneo(s)
                          {f.jugador?.categoriaActual?.nombre ? ` · ${f.jugador.categoriaActual.nombre}` : ''}
                        </Text>
                      </View>
                      <View style={styles.ptsBox}>
                        <Text style={styles.pts}>{f.puntosAcumulados}</Text>
                        <Text style={styles.ptsUnit}>pts</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Torneos */}
            <View style={styles.sectionHead}>
              <Trophy size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Torneos del circuito</Text>
            </View>
            {torneos.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Todavía no hay torneos en este circuito.</Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {torneos.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.8}
                    disabled={!t.torneo.slug}
                    onPress={() => t.torneo.slug && router.push(`/torneo/${t.torneo.slug}`)}
                    style={styles.torneoRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.torneoName} numberOfLines={1}>{t.torneo.nombre}</Text>
                      <View style={styles.torneoMeta}>
                        <CalendarDays size={12} color={colors.gray400} />
                        <Text style={styles.torneoMetaText}>
                          {fmtFecha(t.torneo.fechaInicio)} · {t.torneo.ciudad}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.torneoEstado}>{t.torneo.estado?.replace(/_/g, ' ').toLowerCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
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
  title: { color: colors.white, fontSize: 20, fontWeight: 'bold', flex: 1 },
  meta: { color: colors.gray400, fontSize: 14 },
  desc: { color: colors.gray400, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  emptyText: { color: colors.gray400, fontSize: 13, lineHeight: 19 },
  // Ranking row
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  rankRowYo: { borderColor: colors.primary, backgroundColor: 'rgba(223,37,49,0.08)' },
  pos: { color: colors.gray400, fontSize: 15, fontWeight: '800', width: 26, textAlign: 'center' },
  posTop: { color: colors.amber500 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dark100 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarIni: { color: colors.gray400, fontSize: 13, fontWeight: '700' },
  rankName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  rankSub: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  ptsBox: { alignItems: 'flex-end' },
  pts: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  ptsUnit: { color: colors.gray500, fontSize: 10, fontWeight: '600', marginTop: -2 },
  // Torneo row
  torneoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
  },
  torneoName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  torneoMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  torneoMetaText: { color: colors.gray400, fontSize: 12 },
  torneoEstado: { color: colors.gray500, fontSize: 11, textTransform: 'capitalize' },
});
