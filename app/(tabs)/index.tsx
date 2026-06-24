import { useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Trophy, CalendarClock, ChevronRight, Bell, Flame, Target,
  TrendingUp, CheckCircle2, Sparkles, CreditCard, Activity,
} from 'lucide-react-native';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { jugadorService, InicioItem, NodoAgenda, Agenda } from '../../src/services/jugadorService';
import { notificacionService } from '../../src/services/notificacionService';
import { perfilService } from '../../src/services/perfilService';
import { colors, spacing, radius } from '../../src/lib/theme';

const INICIO_CONFIG: Record<string, { Icon: any; color: string; bg: string }> = {
  INSCRIPCION: { Icon: CheckCircle2, color: colors.green500, bg: 'rgba(16,185,129,0.16)' },
  PARTIDO: { Icon: CalendarClock, color: colors.blue500, bg: 'rgba(59,130,246,0.16)' },
  RANKING: { Icon: TrendingUp, color: colors.primary, bg: 'rgba(223,37,49,0.16)' },
  TORNEO: { Icon: Sparkles, color: colors.primary, bg: 'rgba(223,37,49,0.16)' },
  PAGO: { Icon: CreditCard, color: colors.amber500, bg: 'rgba(245,158,11,0.16)' },
};
const INICIO_DEFAULT = { Icon: Bell, color: colors.gray400, bg: colors.dark100 };

const fmtFecha = (f: string | null) => (f ? f.split('-').reverse().slice(0, 2).join('/') : '');
const cuando = (n: NodoAgenda) => (n.programado ? `${fmtFecha(n.fecha)} ${n.hora ?? ''}`.trim() : 'Por confirmar');

function hace(fechaISO: string): string {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} d`;
  return `hace ${Math.floor(dias / 7)} sem`;
}

// Avisos de la plataforma traen enlaces tipo web; mapeamos a rutas de la app.
function esLinkNavegable(link: string | null): boolean {
  if (!link) return false;
  return /^\/(t\/|inscripciones|mijuego|torneos|jugador\/)/.test(link);
}
function irALink(link: string) {
  if (link.startsWith('/t/')) router.push(`/torneo/${link.slice(3)}`);
  else if (link.startsWith('/inscripciones')) router.push('/inscripciones');
  else if (link.startsWith('/mijuego')) router.navigate('/mijuego');
  else if (link.startsWith('/torneos')) router.navigate('/torneos');
  else if (link.startsWith('/jugador/')) router.push(link as any);
}

function StatBig({ icon, tint, value, label }: { icon: React.ReactNode; tint: string; value: string | number; label: string }) {
  return (
    <View style={styles.statBig}>
      <View style={[styles.statBigChip, { backgroundColor: `${tint}29` }]}>{icon}</View>
      <Text style={styles.statBigValue}>{value}</Text>
      <Text style={styles.statBigLabel}>{label}</Text>
    </View>
  );
}

function HeroProximoPartido({ agenda }: { agenda: Agenda }) {
  const p = agenda.proximoPartido!;
  const sedeCancha = [p.sede, p.cancha].filter(Boolean).join(' · ');
  return (
    <View style={styles.proxCard}>
      <View style={styles.proxAccent} />
      <Text style={styles.proxKicker}>TU PRÓXIMO PARTIDO</Text>
      <Text style={styles.proxMatch}>
        {p.fase}
        {p.rival ? ` · vs ${p.rival}` : ''}
      </Text>
      <View style={styles.proxMeta}>
        <CalendarClock size={15} color={colors.gray400} />
        <Text style={styles.proxMetaText}>{cuando(p)}</Text>
      </View>
      <Text style={styles.proxTorneo} numberOfLines={1}>{agenda.torneo.nombre}</Text>
      {sedeCancha ? (
        <View style={styles.proxMeta}>
          <MapPin size={15} color={colors.gray400} />
          <Text style={styles.proxMetaText}>{sedeCancha}</Text>
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

function ActividadRow({ item }: { item: InicioItem }) {
  const c = INICIO_CONFIG[item.tipo] ?? INICIO_DEFAULT;
  const { Icon } = c;
  const navegable = esLinkNavegable(item.link);
  return (
    <TouchableOpacity
      style={styles.actCard}
      activeOpacity={navegable ? 0.7 : 1}
      disabled={!navegable}
      onPress={() => item.link && irALink(item.link)}
    >
      <View style={[styles.actIcon, { backgroundColor: c.bg }]}><Icon size={18} color={c.color} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actTitle} numberOfLines={2}>{item.titulo}</Text>
        {item.detalle ? <Text style={styles.actDetail} numberOfLines={1}>{item.detalle}</Text> : null}
      </View>
      <Text style={styles.actTime}>{hace(item.fecha)}</Text>
      {navegable && <ChevronRight size={18} color={colors.gray500} />}
    </TouchableOpacity>
  );
}

export default function HomeTab() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const agendaQ = useQuery({ queryKey: ['mi-agenda'], queryFn: jugadorService.getMiAgenda });
  const inicioQ = useQuery({ queryKey: ['inicio'], queryFn: jugadorService.getInicio });
  const notifQ = useQuery({ queryKey: ['notif-count'], queryFn: notificacionService.getNoLeidasCount });
  const perfilQ = useQuery({ queryKey: ['mi-perfil'], queryFn: perfilService.getMiPerfil });

  // Al volver al Inicio (ej. tras ver notificaciones), refrescar badge + actividad.
  useFocusEffect(useCallback(() => { notifQ.refetch(); inicioQ.refetch(); }, []));
  const noLeidas = notifQ.data ?? 0;

  const refetchAll = () => { agendaQ.refetch(); inicioQ.refetch(); };

  const agendaConPartido = (agendaQ.data ?? []).find((a) => a.proximoPartido);
  const items = inicioQ.data ?? [];
  const cargando = agendaQ.isLoading || inicioQ.isLoading;

  const bienvenida = user?.genero === 'FEMENINO' ? 'Bienvenida' : 'Bienvenido';
  const cat = perfilQ.data?.categoria?.nombre;
  const pos = perfilQ.data?.ranking?.[0]?.posicion;
  const terceraLinea = [cat, pos ? `Ranking #${pos}` : null].filter(Boolean).join(' · ') || 'A jugar al pádel';

  const verSeguidores = (tab: 'seguidores' | 'siguiendo') => {
    if (user?.id) router.push(`/seguidores?userId=${user.id}&tab=${tab}` as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={agendaQ.isRefetching || inicioQ.isRefetching} onRefresh={refetchAll} tintColor={colors.primary} />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroMotif} />
        <TouchableOpacity style={styles.heroBell} onPress={() => router.push('/notificaciones')} activeOpacity={0.8}>
          <Bell size={19} color={colors.white} />
          {noLeidas > 0 && <View style={styles.heroBellDot} />}
        </TouchableOpacity>
        <View style={styles.heroRow}>
          <TouchableOpacity onPress={() => router.navigate('/perfil')} activeOpacity={0.85}>
            {perfilQ.data?.fotoUrl ? (
              <Image source={{ uri: perfilQ.data.fotoUrl }} style={styles.heroAvatar} />
            ) : (
              <View style={[styles.heroAvatar, styles.heroAvatarFallback]}>
                <Text style={styles.heroAvatarText}>{`${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroGreeting}>{bienvenida},</Text>
            <Text style={styles.heroName} numberOfLines={1}>{user?.nombre} {user?.apellido}!</Text>
            <Text style={styles.heroThird} numberOfLines={1}>{terceraLinea}</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <TouchableOpacity style={styles.heroStat} activeOpacity={0.7} onPress={() => verSeguidores('seguidores')}>
            <Text style={styles.heroStatValue}>{perfilQ.data?.seguidores ?? 0}</Text>
            <Text style={styles.heroStatLabel}>Seguidores</Text>
          </TouchableOpacity>
          <View style={styles.heroStatDiv} />
          <TouchableOpacity style={styles.heroStat} activeOpacity={0.7} onPress={() => verSeguidores('siguiendo')}>
            <Text style={styles.heroStatValue}>{perfilQ.data?.siguiendo ?? 0}</Text>
            <Text style={styles.heroStatLabel}>Siguiendo</Text>
          </TouchableOpacity>
          <View style={styles.heroStatDiv} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{perfilQ.data?.stats.torneosJugados ?? 0}</Text>
            <Text style={styles.heroStatLabel}>Torneos</Text>
          </View>
        </View>
      </View>

      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatBig tint={colors.amber500} icon={<Target size={21} color={colors.amber500} />} value={`${Math.round(perfilQ.data?.partidos.efectividad ?? 0)}%`} label="Efectividad" />
            <StatBig tint={colors.blue500} icon={<Activity size={21} color={colors.blue500} />} value={perfilQ.data?.partidos.ganados ?? 0} label="Ganados" />
            <StatBig tint={colors.primary} icon={<Flame size={21} color={colors.primary} />} value={perfilQ.data?.partidos.rachaActual ?? 0} label="Racha" />
          </View>

          {agendaConPartido ? <HeroProximoPartido agenda={agendaConPartido} /> : <HeroVacio />}

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Activity size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Tu actividad</Text>
            </View>

            {items.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {items.map((it) => <ActividadRow key={it.id} item={it} />)}
              </View>
            ) : (
              <View style={styles.feedEmpty}>
                <Text style={styles.feedEmptyText}>Cuando tengas novedades —inscripciones, partidos, resultados o puntos— aparecen acá.</Text>
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
  loading: { paddingTop: 60, alignItems: 'center' },
  hero: {
    marginHorizontal: spacing.lg, marginBottom: spacing.xl,
    backgroundColor: colors.primary, borderRadius: 24,
    paddingVertical: 22, paddingHorizontal: 20, overflow: 'hidden',
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  heroMotif: { position: 'absolute', right: -36, top: -36, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroBell: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroBellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingRight: 44 },
  heroAvatar: { width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: 'rgba(255,255,255,0.65)' },
  heroAvatarFallback: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  heroTextWrap: { flex: 1, minWidth: 0 },
  heroGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 15 },
  heroName: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 1 },
  heroThird: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 5 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: colors.white, fontSize: 18, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  heroStatDiv: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.22)' },
  statsRow: { flexDirection: 'row', gap: spacing.md - 2, paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  statBig: {
    flex: 1, backgroundColor: '#161b26', borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingVertical: spacing.md, paddingHorizontal: 12,
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  statBigChip: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statBigValue: { color: colors.white, fontSize: 24, fontWeight: '800' },
  statBigLabel: { color: colors.gray400, fontSize: 12, marginTop: 2 },
  proxCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.xl,
    backgroundColor: '#161b26', borderWidth: 1, borderColor: '#2a2030', borderRadius: 22,
    padding: spacing.lg, overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  proxAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.primary },
  proxKicker: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  proxMatch: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 8 },
  proxMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  proxMetaText: { color: colors.gray400, fontSize: 13 },
  proxTorneo: { color: colors.gray400, fontSize: 13, marginTop: 10 },
  heroEmpty: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  heroEmptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  heroEmptyText: { color: colors.gray400, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  heroEmptyBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md - 2, borderRadius: radius.lg, marginTop: spacing.lg },
  heroEmptyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  actCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md - 2 },
  actIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  actDetail: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  actTime: { color: colors.gray500, fontSize: 11 },
  feedEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  feedEmptyText: { color: colors.gray400, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  feedEmptyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  feedEmptyLinkText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
