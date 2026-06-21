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
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  Activity,
  Star,
  Flame,
  Target,
  Award,
  TrendingUp,
  MapPin,
  CalendarClock,
  TrendingDown,
} from 'lucide-react-native';
import { perfilService, NivelLogro } from '../../src/services/perfilService';
import { jugadorService, NodoAgenda } from '../../src/services/jugadorService';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../../src/lib/theme';

const NIVEL_COLOR: Record<NivelLogro, string> = {
  oro: '#facc15',
  plata: '#d1d5db',
  bronce: '#d97706',
  especial: '#a78bfa',
};

const fmtFecha = (f: string | null) => (f ? f.split('-').reverse().slice(0, 2).join('/') : '');
const cuando = (n: NodoAgenda) => (n.programado ? `${fmtFecha(n.fecha)} ${n.hora ?? ''}`.trim() : 'Por confirmar');

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiJuegoSkeleton() {
  return (
    <>
      <View style={styles.statsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton style={{ width: 36, height: 36, borderRadius: radius.md }} />
            <Skeleton style={{ height: 24, width: 50, marginTop: spacing.sm }} />
            <Skeleton style={{ height: 11, width: '80%', marginTop: 6 }} />
          </View>
        ))}
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={styles.section}>
          <Skeleton style={{ height: 16, width: 120, marginBottom: spacing.md }} />
          <View style={styles.card}>
            <Skeleton style={{ height: 26, width: '45%' }} />
            <Skeleton style={{ height: 13, width: '70%', marginTop: spacing.md }} />
            <Skeleton style={{ height: 13, width: '55%', marginTop: spacing.sm }} />
          </View>
        </View>
      ))}
    </>
  );
}

function NodoLinea({ n }: { n: NodoAgenda }) {
  return (
    <View style={styles.nodo}>
      <Text style={styles.nodoFase}>{n.fase}</Text>
      <Text style={styles.nodoRival} numberOfLines={1}>{n.rival ? `vs ${n.rival}` : ''}</Text>
      <Text style={[styles.nodoWhen, !n.programado && styles.nodoWhenSoft]}>{cuando(n)}</Text>
    </View>
  );
}

export default function MiJuegoTab() {
  const insets = useSafeAreaInsets();
  const perfilQ = useQuery({ queryKey: ['mi-perfil'], queryFn: perfilService.getMiPerfil });
  const agendaQ = useQuery({ queryKey: ['mi-agenda'], queryFn: jugadorService.getMiAgenda });

  const perfil = perfilQ.data;
  const agendas = agendaQ.data ?? [];

  const refetchAll = () => {
    perfilQ.refetch();
    agendaQ.refetch();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={perfilQ.isRefetching || agendaQ.isRefetching}
          onRefresh={refetchAll}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mi juego</Text>
        {perfil?.categoria && <Text style={styles.subtitle}>{perfil.categoria.nombre}</Text>}
      </View>

      {perfilQ.isLoading ? (
        <MiJuegoSkeleton />
      ) : !perfil ? (
        <View style={styles.section}>
          <Text style={styles.emptyText}>No pudimos cargar tus datos. Deslizá para reintentar.</Text>
        </View>
      ) : (
        <>
          {/* Stat cards */}
          <View style={styles.statsGrid}>
            <StatCard icon={<Trophy size={18} color={colors.amber500} />} value={perfil.stats.torneosGanados} label="Torneos ganados" />
            <StatCard icon={<Activity size={18} color={colors.blue500} />} value={perfil.partidos.jugados} label="Partidos jugados" />
            <StatCard icon={<Star size={18} color="#a78bfa" />} value={perfil.ranking[0]?.puntosTotales ?? 0} label="Puntos" />
            <StatCard icon={<Flame size={18} color={colors.primary} />} value={perfil.partidos.rachaActual} label="Racha actual" />
          </View>

          {/* Ranking */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Mi ranking</Text>
            </View>
            {perfil.ranking.length > 0 ? (
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
            ) : (
              <View style={styles.card}><Text style={styles.emptyText}>Todavía no tenés ranking. Jugá un torneo para sumar puntos.</Text></View>
            )}
          </View>

          {/* Efectividad */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Target size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Efectividad</Text>
            </View>
            <View style={styles.efGrid}>
              <View style={styles.efBox}><Text style={[styles.efValue, { color: colors.green500 }]}>{perfil.partidos.efectividad}%</Text><Text style={styles.efLabel}>Victorias</Text></View>
              <View style={styles.efBox}><Text style={styles.efValue}>{perfil.partidos.ganados}</Text><Text style={styles.efLabel}>Ganados</Text></View>
              <View style={styles.efBox}><Text style={styles.efValue}>{perfil.partidos.perdidos}</Text><Text style={styles.efLabel}>Perdidos</Text></View>
            </View>
          </View>

          {/* Logros */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Award size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Logros</Text>
              {perfil.logros.length > 0 && <Text style={styles.count}>{perfil.logros.length}</Text>}
            </View>
            {perfil.logros.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {perfil.logros.map((l) => (
                  <View key={l.id} style={styles.logro}>
                    <View style={[styles.logroIcon, { backgroundColor: `${NIVEL_COLOR[l.nivel]}22` }]}>
                      <Award size={18} color={NIVEL_COLOR[l.nivel]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logroName} numberOfLines={1}>{l.nombre}</Text>
                      <Text style={styles.logroDesc} numberOfLines={1}>{l.descripcion}</Text>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, l.progreso))}%` }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.card}><Text style={styles.emptyText}>Todavía sin logros. Se desbloquean jugando torneos.</Text></View>
            )}
          </View>

          {/* Mi agenda completa */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <CalendarClock size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Mi agenda</Text>
            </View>
            {agendas.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                {agendas.map((a) => (
                  <View key={a.inscripcionId} style={styles.card}>
                    <Text style={styles.agTorneo} numberOfLines={1}>{a.torneo.nombre}</Text>
                    {a.categoria && <Text style={styles.agCat}>{a.categoria}</Text>}

                    {a.proximoPartido ? (
                      <View style={styles.proxBox}>
                        <Text style={styles.proxKicker}>TU PRÓXIMO PARTIDO</Text>
                        <View style={styles.proxRow}>
                          <Text style={styles.proxMatch} numberOfLines={1}>
                            {a.proximoPartido.fase}{a.proximoPartido.rival ? ` · vs ${a.proximoPartido.rival}` : ''}
                          </Text>
                          <Text style={styles.proxWhen}>{cuando(a.proximoPartido)}</Text>
                        </View>
                        {(a.proximoPartido.sede || a.proximoPartido.cancha) && (
                          <View style={styles.proxMeta}>
                            <MapPin size={12} color={colors.gray400} />
                            <Text style={styles.proxMetaText}>{[a.proximoPartido.sede, a.proximoPartido.cancha].filter(Boolean).join(' · ')}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>{a.mensaje}</Text>
                    )}

                    {a.siGanas.length > 0 && (
                      <View style={styles.path}>
                        <View style={styles.pathHead}><Trophy size={12} color={colors.green500} /><Text style={[styles.pathTitle, { color: colors.green500 }]}>Si ganás</Text></View>
                        {a.siGanas.map((n, i) => <NodoLinea key={i} n={n} />)}
                      </View>
                    )}
                    {a.siPerdes && (
                      <View style={styles.path}>
                        <View style={styles.pathHead}><TrendingDown size={12} color={colors.amber500} /><Text style={[styles.pathTitle, { color: colors.amber500 }]}>Si perdés</Text></View>
                        <NodoLinea n={a.siPerdes} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Cuando te inscribas y se sortee el cuadro, vas a ver acá tu camino partido a partido.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.navigate('/torneos')} activeOpacity={0.85}>
                  <Trophy size={16} color={colors.white} />
                  <Text style={styles.emptyBtnText}>Ver torneos abiertos</Text>
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
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  title: { color: colors.white, fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: colors.gray400, fontSize: 14, marginTop: 2 },
  loading: { paddingTop: 60, alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md - 4, paddingHorizontal: spacing.lg },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.dark100,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  statValue: { color: colors.white, fontSize: 26, fontWeight: '800' },
  statLabel: { color: colors.gray400, fontSize: 12, marginTop: 2 },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  count: { color: colors.gray500, fontSize: 13, marginLeft: 'auto' },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
  },
  emptyText: { color: colors.gray400, fontSize: 13, lineHeight: 19 },
  // Ranking
  rankPos: { color: colors.white, fontSize: 28, fontWeight: '800' },
  rankScope: { color: colors.gray400, fontSize: 14, fontWeight: '600' },
  rankRows: { marginTop: spacing.md, gap: spacing.sm },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rankK: { color: colors.gray400, fontSize: 14 },
  rankV: { color: colors.white, fontSize: 14, fontWeight: '600' },
  // Efectividad
  efGrid: { flexDirection: 'row', gap: spacing.md - 4 },
  efBox: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, alignItems: 'center',
  },
  efValue: { color: colors.white, fontSize: 22, fontWeight: '800' },
  efLabel: { color: colors.gray400, fontSize: 11, marginTop: 4 },
  // Logros
  logro: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md - 2,
  },
  logroIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logroName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  logroDesc: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  progressTrack: { height: 4, backgroundColor: colors.dark100, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  // Agenda
  agTorneo: { color: colors.white, fontSize: 15, fontWeight: '700' },
  agCat: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  proxBox: {
    backgroundColor: 'rgba(223,37,49,0.10)', borderWidth: 1, borderColor: 'rgba(223,37,49,0.25)',
    borderRadius: radius.md, padding: spacing.md - 2, marginTop: spacing.md,
  },
  proxKicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  proxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  proxMatch: { color: colors.white, fontSize: 14, fontWeight: '700', flex: 1 },
  proxWhen: { color: colors.white, fontSize: 14, fontWeight: '700' },
  proxMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  proxMetaText: { color: colors.gray400, fontSize: 12 },
  path: { marginTop: spacing.md },
  pathHead: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  pathTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  nodo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  nodoFase: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  nodoRival: { color: colors.gray500, fontSize: 12, flex: 1, textAlign: 'right' },
  nodoWhen: { color: colors.white, fontSize: 12 },
  nodoWhenSoft: { color: colors.gray500, fontStyle: 'italic' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: spacing.md - 2, borderRadius: radius.lg, marginTop: spacing.md,
  },
  emptyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
