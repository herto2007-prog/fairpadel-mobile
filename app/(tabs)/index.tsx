import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Trophy,
  Sparkles,
  UserPlus,
  Activity,
  CalendarClock,
  ChevronRight,
  Bell,
  Plus,
  X,
  Flame,
} from 'lucide-react-native';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { jugadorService, FeedItem, NodoAgenda, Agenda } from '../../src/services/jugadorService';
import { notificacionService } from '../../src/services/notificacionService';
import { perfilService } from '../../src/services/perfilService';
import { PalaHeart } from '../../src/components/icons/PalaHeart';
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

function FeedRow({
  item,
  onToggle,
  onVerQuienes,
}: {
  item: FeedItem;
  onToggle: () => void;
  onVerQuienes: () => void;
}) {
  const count = item.reaccionesCount ?? 0;

  const reaccionBar = item.reaccionable ? (
    <View style={styles.reaccionBar}>
      <TouchableOpacity style={styles.likeBtn} onPress={onToggle} activeOpacity={0.7} hitSlop={6}>
        <PalaHeart size={20} filled={!!item.yaReaccione} />
        <Text style={[styles.likeText, item.yaReaccione && styles.likeTextOn]}>Me gusta</Text>
      </TouchableOpacity>
      {count > 0 &&
        (item.esDueno ? (
          <TouchableOpacity onPress={onVerQuienes} hitSlop={6}>
            <Text style={styles.count}>{count}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.count}>{count}</Text>
        ))}
    </View>
  ) : null;

  // Publicación del jugador (post con foto)
  if (item.tipo === 'publicacion') {
    const ini = `${item.autorNombre?.[0] ?? ''}`.toUpperCase();
    return (
      <View style={styles.feedCard}>
        <TouchableOpacity
          style={styles.postAuthor}
          activeOpacity={0.8}
          onPress={() => item.autorId && router.push(`/jugador/${item.autorId}`)}
        >
          {item.autorFotoUrl ? (
            <Image source={{ uri: item.autorFotoUrl }} style={styles.postAvatar} />
          ) : (
            <View style={[styles.postAvatar, styles.postAvatarFallback]}><Text style={styles.postIni}>{ini}</Text></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.postAuthorName} numberOfLines={1}>{item.autorNombre || item.titulo}</Text>
            <Text style={styles.feedTime}>{hace(item.fecha)}</Text>
          </View>
        </TouchableOpacity>
        {item.detalle ? <Text style={styles.postCaption}>{item.detalle}</Text> : null}
        {item.fotoUrl ? <Image source={{ uri: item.fotoUrl }} style={styles.postFoto} resizeMode="cover" /> : null}
        {reaccionBar}
      </View>
    );
  }

  const c = FEED_CONFIG[item.tipo] || { Icon: Activity, color: colors.gray400, bg: colors.dark100 };
  const { Icon } = c;
  // El feed trae el link en formato web (/t/<slug>); la app usa /torneo/<slug>.
  const slug = item.link?.startsWith('/t/') ? item.link.slice(3) : null;
  const navegable = !!slug;
  const irAlTorneo = () => { if (slug) router.push(`/torneo/${slug}`); };
  return (
    <View style={styles.feedCard}>
      <TouchableOpacity
        style={styles.feedTop}
        onPress={irAlTorneo}
        disabled={!navegable}
        activeOpacity={navegable ? 0.7 : 1}
      >
        <View style={[styles.feedIcon, { backgroundColor: c.bg }]}>
          <Icon size={18} color={c.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.feedTitle} numberOfLines={2}>{item.titulo}</Text>
          {item.detalle ? <Text style={styles.feedDetail} numberOfLines={1}>{item.detalle}</Text> : null}
        </View>
        <Text style={styles.feedTime}>{hace(item.fecha)}</Text>
        {navegable && <ChevronRight size={18} color={colors.gray500} />}
      </TouchableOpacity>
      {reaccionBar}
    </View>
  );
}

function ReaccionadoresModal({ item, onClose }: { item: FeedItem | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reaccionadores', item?.id],
    queryFn: () => jugadorService.getReaccionadores(item!.id),
    enabled: !!item,
  });
  const lista = data ?? [];
  return (
    <Modal visible={!!item} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>A quiénes les gustó</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}><X size={22} color={colors.gray400} /></TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={{ paddingVertical: spacing.xl }}><ActivityIndicator color={colors.primary} /></View>
          ) : lista.length === 0 ? (
            <Text style={styles.modalEmpty}>Todavía nadie reaccionó.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {lista.map((u) => {
                const ini = `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.personRow}
                    activeOpacity={0.8}
                    onPress={() => { onClose(); router.push(`/jugador/${u.id}`); }}
                  >
                    {u.fotoUrl ? (
                      <Image source={{ uri: u.fotoUrl }} style={styles.personAvatar} />
                    ) : (
                      <View style={[styles.personAvatar, styles.personFallback]}><Text style={styles.personIni}>{ini}</Text></View>
                    )}
                    <Text style={styles.personName}>{u.nombre} {u.apellido}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function HomeTab() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [modalItem, setModalItem] = useState<FeedItem | null>(null);

  const agendaQ = useQuery({ queryKey: ['mi-agenda'], queryFn: jugadorService.getMiAgenda });
  const feedQ = useQuery({ queryKey: ['feed'], queryFn: jugadorService.getFeed });
  const notifQ = useQuery({ queryKey: ['notif-count'], queryFn: notificacionService.getNoLeidasCount });
  const perfilQ = useQuery({ queryKey: ['mi-perfil'], queryFn: perfilService.getMiPerfil });

  // Al volver al Inicio (ej. tras ver/marcar notificaciones), refrescar el badge.
  useFocusEffect(useCallback(() => { notifQ.refetch(); }, []));
  const noLeidas = notifQ.data ?? 0;

  const setFeedItem = (id: string, patch: Partial<FeedItem>) => {
    qc.setQueryData<FeedItem[]>(['feed'], (prev) =>
      (prev ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  };

  const toggleReaccion = async (item: FeedItem) => {
    const queLike = !item.yaReaccione;
    const base = item.reaccionesCount ?? 0;
    // optimista
    setFeedItem(item.id, { yaReaccione: queLike, reaccionesCount: Math.max(0, base + (queLike ? 1 : -1)) });
    try {
      const r = queLike
        ? await jugadorService.reaccionar(item.id)
        : await jugadorService.quitarReaccion(item.id);
      setFeedItem(item.id, { yaReaccione: r.yaReaccione, reaccionesCount: r.count });
    } catch {
      // revertir
      setFeedItem(item.id, { yaReaccione: item.yaReaccione, reaccionesCount: base });
    }
  };

  const refetchAll = () => {
    agendaQ.refetch();
    feedQ.refetch();
  };

  const agendaConPartido = (agendaQ.data ?? []).find((a) => a.proximoPartido);
  const feedItems = feedQ.data ?? [];
  const cargando = agendaQ.isLoading || feedQ.isLoading;

  const bienvenida = user?.genero === 'FEMENINO' ? 'Bienvenida' : 'Bienvenido';
  const cat = perfilQ.data?.categoria?.nombre;
  const pos = perfilQ.data?.ranking?.[0]?.posicion;
  const terceraLinea = [cat, pos ? `Ranking #${pos}` : null].filter(Boolean).join(' · ') || 'A jugar al pádel';

  return (
    <>
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
      </View>

      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatBig tint={colors.amber500} icon={<Trophy size={21} color={colors.amber500} />} value={perfilQ.data?.stats.torneosJugados ?? 0} label="Torneos" />
            <StatBig tint={colors.blue500} icon={<Activity size={21} color={colors.blue500} />} value={perfilQ.data?.partidos.ganados ?? 0} label="Ganados" />
            <StatBig tint={colors.primary} icon={<Flame size={21} color={colors.primary} />} value={perfilQ.data?.partidos.rachaActual ?? 0} label="Racha" />
          </View>

          {agendaConPartido ? <HeroProximoPartido agenda={agendaConPartido} /> : <HeroVacio />}

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Activity size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Pulso de tu pádel</Text>
            </View>

            {feedItems.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {feedItems.map((it) => (
                  <FeedRow
                    key={it.id}
                    item={it}
                    onToggle={() => toggleReaccion(it)}
                    onVerQuienes={() => setModalItem(it)}
                  />
                ))}
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
    <TouchableOpacity style={styles.fab} onPress={() => router.push('/crear-post')} activeOpacity={0.85}>
      <Plus size={26} color={colors.white} />
    </TouchableOpacity>
    <ReaccionadoresModal item={modalItem} onClose={() => setModalItem(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { paddingTop: 60, alignItems: 'center' },
  // HERO banner (estilo modelo: foto grande + saludo + campana)
  hero: {
    marginHorizontal: spacing.lg, marginBottom: spacing.xl,
    backgroundColor: colors.primary, borderRadius: 24,
    paddingVertical: 22, paddingHorizontal: 20, overflow: 'hidden',
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  heroMotif: {
    position: 'absolute', right: -36, top: -36, width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroBell: {
    position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  heroBellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingRight: 44 },
  heroAvatar: { width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: 'rgba(255,255,255,0.65)' },
  heroAvatarFallback: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  heroTextWrap: { flex: 1, minWidth: 0 },
  heroGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 15 },
  heroName: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 1 },
  heroThird: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 5 },
  // Stats grandes con profundidad
  statsRow: { flexDirection: 'row', gap: spacing.md - 2, paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  statBig: {
    flex: 1, backgroundColor: '#161b26', borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingVertical: spacing.md, paddingHorizontal: 12,
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  statBigChip: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statBigValue: { color: colors.white, fontSize: 24, fontWeight: '800' },
  statBigLabel: { color: colors.gray400, fontSize: 12, marginTop: 2 },
  // Próximo partido (tarjeta oscura con acento rojo)
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
  feedCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md - 2,
  },
  feedTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4 },
  feedIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  reaccionBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing.md - 2, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  likeTextOn: { color: colors.primary },
  count: { color: colors.gray400, fontSize: 13, fontWeight: '700' },
  // Publicación (post)
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postAvatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  postIni: { color: colors.white, fontSize: 15, fontWeight: '800' },
  postAuthorName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  postCaption: { color: colors.white, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  postFoto: { width: '100%', height: 280, borderRadius: radius.md, backgroundColor: colors.dark100, marginTop: spacing.sm },
  // FAB crear publicación
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.xl,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  // Modal reaccionadores
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  modalEmpty: { color: colors.gray400, fontSize: 14, paddingVertical: spacing.lg, textAlign: 'center' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2, paddingVertical: spacing.sm },
  personAvatar: { width: 40, height: 40, borderRadius: 20 },
  personFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  personIni: { color: colors.white, fontSize: 15, fontWeight: '800' },
  personName: { color: colors.white, fontSize: 15, fontWeight: '600' },
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
