import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Shield,
  MapPin,
  Calendar,
  Trophy,
  Activity,
  Star,
  Flame,
  Target,
  Award,
  TrendingUp,
  UserPlus,
  UserCheck,
  AlertCircle,
} from 'lucide-react-native';
import { perfilService, NivelLogro } from '../../src/services/perfilService';
import { socialService } from '../../src/services/socialService';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../../src/lib/theme';

const NIVEL_COLOR: Record<NivelLogro, string> = {
  oro: '#facc15',
  plata: '#d1d5db',
  bronce: '#d97706',
  especial: '#a78bfa',
};

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.counter}>
      <Text style={styles.counterValue}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

export default function JugadorPerfil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const esMiPerfil = user?.id === id;

  const perfilQ = useQuery({
    queryKey: ['perfil-jugador', id],
    queryFn: () => perfilService.getPerfilJugador(id),
    enabled: !!id,
  });
  const sigQ = useQuery({
    queryKey: ['siguiendo', id],
    queryFn: () => socialService.checkSiguiendo(id),
    enabled: !!id && !esMiPerfil,
  });

  const perfil = perfilQ.data;
  const [siguiendo, setSiguiendo] = useState(false);
  const [accion, setAccion] = useState(false);

  useEffect(() => {
    if (sigQ.data !== undefined) setSiguiendo(sigQ.data);
  }, [sigQ.data]);

  const toggleSeguir = async () => {
    if (accion) return;
    const nuevo = !siguiendo;
    setSiguiendo(nuevo); // optimista
    setAccion(true);
    try {
      if (nuevo) await socialService.seguir(id);
      else await socialService.dejarDeSeguir(id);
      qc.invalidateQueries({ queryKey: ['perfil-jugador', id] }); // refresca contador
    } catch {
      setSiguiendo(!nuevo); // revertir
    } finally {
      setAccion(false);
    }
  };

  const iniciales = perfil ? `${perfil.nombre?.[0] ?? ''}${perfil.apellido?.[0] ?? ''}`.toUpperCase() : '';

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Perfil'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={perfilQ.isRefetching} onRefresh={() => perfilQ.refetch()} tintColor={colors.primary} />
        }
      >
        {perfilQ.isLoading ? (
          <View style={styles.head}>
            <Skeleton style={{ width: 96, height: 96, borderRadius: 48 }} />
            <Skeleton style={{ height: 22, width: 180, marginTop: spacing.md }} />
            <Skeleton style={{ height: 14, width: 110, marginTop: spacing.sm }} />
            <Skeleton style={{ height: 44, width: '70%', borderRadius: radius.lg, marginTop: spacing.lg }} />
          </View>
        ) : perfilQ.isError || !perfil ? (
          <View style={styles.centered}>
            <AlertCircle size={40} color={colors.gray500} />
            <Text style={styles.emptyTitle}>No pudimos cargar el perfil</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => perfilQ.refetch()} activeOpacity={0.85}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.head}>
              {perfil.fotoUrl ? (
                <Image source={{ uri: perfil.fotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{iniciales}</Text></View>
              )}
              <Text style={styles.name}>{perfil.nombre} {perfil.apellido}</Text>
              {perfil.username ? <Text style={styles.username}>@{perfil.username}</Text> : null}

              <View style={styles.metaRow}>
                {perfil.categoria && (
                  <View style={styles.metaItem}><Shield size={14} color={colors.blue500} /><Text style={styles.metaText}>{perfil.categoria.nombre}</Text></View>
                )}
                <View style={styles.metaItem}><MapPin size={14} color={colors.gray400} /><Text style={styles.metaText}>{perfil.ciudad || 'Sin ciudad'}</Text></View>
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

              {!esMiPerfil && (
                <TouchableOpacity
                  style={[styles.followBtn, siguiendo && styles.followingBtn]}
                  onPress={toggleSeguir}
                  disabled={accion || sigQ.isLoading}
                  activeOpacity={0.85}
                >
                  {accion ? (
                    <ActivityIndicator size="small" color={siguiendo ? colors.white : colors.white} />
                  ) : siguiendo ? (
                    <><UserCheck size={16} color={colors.white} /><Text style={styles.followText}>Siguiendo</Text></>
                  ) : (
                    <><UserPlus size={16} color={colors.white} /><Text style={styles.followText}>Seguir</Text></>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Stat cards */}
            <View style={styles.statsGrid}>
              <StatCard icon={<Trophy size={18} color={colors.amber500} />} value={perfil.stats.torneosGanados} label="Torneos ganados" />
              <StatCard icon={<Activity size={18} color={colors.blue500} />} value={perfil.partidos.jugados} label="Partidos jugados" />
              <StatCard icon={<Star size={18} color="#a78bfa" />} value={perfil.ranking[0]?.puntosTotales ?? 0} label="Puntos" />
              <StatCard icon={<Flame size={18} color={colors.primary} />} value={perfil.partidos.rachaActual} label="Racha actual" />
            </View>

            {/* Ranking */}
            {perfil.ranking.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}><TrendingUp size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Ranking</Text></View>
                <View style={styles.card}>
                  <Text style={styles.rankPos}>
                    #{perfil.ranking[0].posicion}
                    <Text style={styles.rankScope}>  {perfil.ranking[0].alcanceNombre || perfil.ranking[0].alcance}</Text>
                  </Text>
                  <View style={styles.rankRows}>
                    <View style={styles.rankRow}><Text style={styles.rankK}>Puntos</Text><Text style={styles.rankV}>{perfil.ranking[0].puntosTotales}</Text></View>
                    <View style={styles.rankRow}><Text style={styles.rankK}>Victorias</Text><Text style={styles.rankV}>{perfil.partidos.ganados}</Text></View>
                    <View style={styles.rankRow}><Text style={styles.rankK}>Torneos</Text><Text style={styles.rankV}>{perfil.ranking[0].torneosJugados}</Text></View>
                  </View>
                </View>
              </View>
            )}

            {/* Efectividad */}
            <View style={styles.section}>
              <View style={styles.sectionHead}><Target size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Efectividad</Text></View>
              <View style={styles.efGrid}>
                <View style={styles.efBox}><Text style={[styles.efValue, { color: colors.green500 }]}>{perfil.partidos.efectividad}%</Text><Text style={styles.efLabel}>Victorias</Text></View>
                <View style={styles.efBox}><Text style={styles.efValue}>{perfil.partidos.ganados}</Text><Text style={styles.efLabel}>Ganados</Text></View>
                <View style={styles.efBox}><Text style={styles.efValue}>{perfil.partidos.perdidos}</Text><Text style={styles.efLabel}>Perdidos</Text></View>
              </View>
            </View>

            {/* Logros */}
            {perfil.logros.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}><Award size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Logros</Text><Text style={styles.count}>{perfil.logros.length}</Text></View>
                <View style={{ gap: spacing.sm }}>
                  {perfil.logros.map((l) => (
                    <View key={l.id} style={styles.logro}>
                      <View style={[styles.logroIcon, { backgroundColor: `${NIVEL_COLOR[l.nivel]}22` }]}>
                        <Award size={18} color={NIVEL_COLOR[l.nivel]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logroName} numberOfLines={1}>{l.nombre}</Text>
                        <Text style={styles.logroDesc} numberOfLines={1}>{l.descripcion}</Text>
                      </View>
                    </View>
                  ))}
                </View>
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
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, color: colors.white, fontSize: 18, fontWeight: 'bold' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  retryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg },
  retryText: { color: colors.white, fontWeight: '700' },
  head: { alignItems: 'center', paddingHorizontal: spacing.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: colors.primary },
  avatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  name: { color: colors.white, fontSize: 22, fontWeight: 'bold', marginTop: spacing.md },
  username: { color: colors.gray500, fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.gray400, fontSize: 13 },
  bio: { color: colors.gray400, fontSize: 14, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  counters: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.lg },
  counter: { alignItems: 'center' },
  counterValue: { color: colors.white, fontSize: 20, fontWeight: '800' },
  counterLabel: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  counterDivider: { width: 1, height: 28, backgroundColor: colors.border },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xl, marginTop: spacing.lg, minWidth: 160,
  },
  followingBtn: { backgroundColor: colors.dark200, borderWidth: 1, borderColor: colors.border },
  followText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md - 4, paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  statCard: { width: '47.5%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  statIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.dark100, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { color: colors.white, fontSize: 26, fontWeight: '800' },
  statLabel: { color: colors.gray400, fontSize: 12, marginTop: 2 },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  count: { color: colors.gray500, fontSize: 13, marginLeft: 'auto' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  rankPos: { color: colors.white, fontSize: 28, fontWeight: '800' },
  rankScope: { color: colors.gray400, fontSize: 14, fontWeight: '600' },
  rankRows: { marginTop: spacing.md, gap: spacing.sm },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rankK: { color: colors.gray400, fontSize: 14 },
  rankV: { color: colors.white, fontSize: 14, fontWeight: '600' },
  efGrid: { flexDirection: 'row', gap: spacing.md - 4 },
  efBox: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  efValue: { color: colors.white, fontSize: 22, fontWeight: '800' },
  efLabel: { color: colors.gray400, fontSize: 11, marginTop: 4 },
  logro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md - 2 },
  logroIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logroName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  logroDesc: { color: colors.gray500, fontSize: 12, marginTop: 1 },
});
