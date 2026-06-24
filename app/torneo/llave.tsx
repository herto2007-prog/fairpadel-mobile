import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, Animated, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Route, LayoutGrid, X, Trophy, Eye, EyeOff } from 'lucide-react-native';
import { torneoService, PartidoBracket, JugadorBracket, ParejaBracket } from '../../src/services/torneoService';
import BracketTree, { involucraUsuario } from '../../src/components/BracketTree';
import { socialService } from '../../src/services/socialService';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { formatDatePYShort } from '../../src/utils/date';
import { colors, spacing, radius } from '../../src/lib/theme';

const FASE_LABEL: Record<string, string> = {
  ZONA: 'Zona', REPECHAJE: 'Repechaje', TREINTAYDOSAVOS: '32avos', DIECISEISAVOS: '16avos',
  OCTAVOS: 'Octavos', CUARTOS: 'Cuartos', SEMIS: 'Semifinal', FINAL: 'Final',
};
const FASE_ORDER = ['ZONA', 'REPECHAJE', 'TREINTAYDOSAVOS', 'DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];

const go = (id?: string | null) => { if (id) router.push(`/jugador/${id}`); };

type TogglePareja = (inscripcionId: string, jugadorIds: string[], siguiendo: boolean) => void;

function SheetTeam({ par, sets, ganador, seguidos, userId, onTogglePareja }: {
  par?: ParejaBracket | null; sets: string; ganador: boolean;
  seguidos: Set<string>; userId?: string | null; onTogglePareja: TogglePareja;
}) {
  const j1 = par?.jugador1;
  const j2 = par?.jugador2;
  const Av = ({ j }: { j?: JugadorBracket | null }) =>
    j?.fotoUrl ? <Image source={{ uri: j.fotoUrl }} style={styles.shAv} /> : (
      <View style={[styles.shAv, styles.shAvFb]}><Text style={styles.shAvIni}>{`${j?.nombre?.[0] ?? ''}${j?.apellido?.[0] ?? ''}`.toUpperCase() || '?'}</Text></View>
    );
  const jugadorIds = [j1?.id, j2?.id].filter((id): id is string => !!id);
  const esMiPareja = !!userId && jugadorIds.includes(userId);
  const puedeSeguir = !!par?.id && jugadorIds.length > 0 && !esMiPareja;
  const siguiendo = jugadorIds.some((id) => seguidos.has(id));
  return (
    <View style={[styles.shTeam, ganador && styles.shTeamWin]}>
      <View style={styles.shAvs}>
        <TouchableOpacity onPress={() => go(j1?.id)} disabled={!j1?.id}><Av j={j1} /></TouchableOpacity>
        {j2 ? <TouchableOpacity style={{ marginLeft: -8 }} onPress={() => go(j2?.id)} disabled={!j2?.id}><Av j={j2} /></TouchableOpacity> : null}
      </View>
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => go(j1?.id)} disabled={!j1?.id}>
          <Text style={[styles.shName, ganador && styles.shWin]} numberOfLines={1}>{j1 ? `${j1.nombre} ${j1.apellido}` : 'A definir'}</Text>
        </TouchableOpacity>
        {j2 ? (
          <TouchableOpacity onPress={() => go(j2?.id)} disabled={!j2?.id}>
            <Text style={[styles.shName, ganador && styles.shWin]} numberOfLines={1}>{`${j2.nombre} ${j2.apellido}`}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={[styles.shScore, ganador && styles.shWin]}>{sets || '—'}</Text>
      {puedeSeguir ? (
        <TouchableOpacity
          style={[styles.shFollow, siguiendo && styles.shFollowOn]}
          onPress={() => onTogglePareja(par!.id!, jugadorIds, siguiendo)}
          hitSlop={6}
          activeOpacity={0.8}
        >
          {siguiendo ? <EyeOff size={16} color="#85b7eb" /> : <Eye size={16} color={colors.gray400} />}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function DetalleSheet({ p, onClose, seguidos, userId, onTogglePareja }: {
  p: PartidoBracket | null; onClose: () => void;
  seguidos: Set<string>; userId?: string | null; onTogglePareja: TogglePareja;
}) {
  if (!p) return null;
  const sets = p.resultado ? [p.resultado.set1, p.resultado.set2, p.resultado.set3].filter(Boolean) as [number, number][] : [];
  const s1 = sets.map((s) => s[0]).join('   ');
  const s2 = sets.map((s) => s[1]).join('   ');
  const mismaP = (a: any, b: any) => a && b && a.jugador1 && b.jugador1 && a.jugador1.nombre === b.jugador1.nombre && a.jugador1.apellido === b.jugador1.apellido;
  const g1 = !!(p.ganador && mismaP(p.ganador, p.inscripcion1));
  const g2 = !!(p.ganador && mismaP(p.ganador, p.inscripcion2));
  const meta = [p.fecha ? formatDatePYShort(p.fecha, true) : null, p.hora ? `${p.hora} h` : null, p.sede, p.cancha].filter(Boolean).join(' · ');
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.shRoot}>
        <View style={styles.shCard}>
          <View style={styles.shHead}>
            <Text style={styles.shTitle}>{FASE_LABEL[p.fase] || p.fase}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}><X size={22} color={colors.gray400} /></TouchableOpacity>
          </View>
          <SheetTeam par={p.inscripcion1} sets={s1} ganador={g1} seguidos={seguidos} userId={userId} onTogglePareja={onTogglePareja} />
          <View style={styles.shDiv} />
          <SheetTeam par={p.inscripcion2} sets={s2} ganador={g2} seguidos={seguidos} userId={userId} onTogglePareja={onTogglePareja} />
          {meta ? (
            <View style={styles.shMeta}><Text style={styles.shMetaText}>{meta}</Text></View>
          ) : (
            <View style={styles.shMeta}><Text style={styles.shMetaText}>Horario a confirmar</Text></View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ChampionBanner({ pareja }: { pareja: ParejaBracket }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }).start();
  }, []);
  const j1 = pareja.jugador1;
  const j2 = pareja.jugador2;
  const Av = ({ j }: { j?: JugadorBracket | null }) =>
    j?.fotoUrl ? <Image source={{ uri: j.fotoUrl }} style={styles.chAv} /> : (
      <View style={[styles.chAv, styles.chAvFb]}><Text style={styles.chAvIni}>{`${j?.nombre?.[0] ?? ''}${j?.apellido?.[0] ?? ''}`.toUpperCase() || '?'}</Text></View>
    );
  const nombre = [j1 ? `${j1.nombre} ${j1.apellido}` : '', j2 ? `${j2.nombre} ${j2.apellido}` : ''].filter(Boolean).join(' / ');
  return (
    <Animated.View style={[styles.champ, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
      <View style={styles.champTrophy}><Trophy size={24} color="#facc15" /></View>
      <Text style={styles.champKicker}>CAMPEONES</Text>
      <View style={styles.champAvs}>
        <TouchableOpacity onPress={() => go(j1?.id)} disabled={!j1?.id}><Av j={j1} /></TouchableOpacity>
        {j2 ? <TouchableOpacity style={{ marginLeft: -10 }} onPress={() => go(j2?.id)} disabled={!j2?.id}><Av j={j2} /></TouchableOpacity> : null}
      </View>
      <Text style={styles.champName} numberOfLines={2}>{nombre}</Text>
    </Animated.View>
  );
}

export default function LlaveScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();
  const [catSel, setCatSel] = useState<string | null>(null);
  const [focus, setFocus] = useState<string>('todo'); // 'todo' | 'tu' | 'pareja:<key>'
  const [detalle, setDetalle] = useState<PartidoBracket | null>(null);
  const [seguidos, setSeguidos] = useState<Set<string>>(new Set());

  // Parejas seguidas EN ESTE TORNEO (concepto propio, NO la conexión social del Inicio).
  const seguidosQ = useQuery({
    queryKey: ['parejas-seguidas', id, user?.id],
    queryFn: () => socialService.getParejasSeguidasTorneo(id),
    enabled: !!user?.id && !!id,
  });
  useEffect(() => {
    if (seguidosQ.data) setSeguidos(new Set(seguidosQ.data.flatMap((p) => p.jugadorIds)));
  }, [seguidosQ.data]);

  const togglePareja = async (inscripcionId: string, jugadorIds: string[], siguiendo: boolean) => {
    const previo = seguidos;
    const next = new Set(seguidos);
    jugadorIds.forEach((jid) => (siguiendo ? next.delete(jid) : next.add(jid)));
    setSeguidos(next); // optimista
    try {
      if (siguiendo) await socialService.dejarDeSeguirPareja(inscripcionId);
      else await socialService.seguirPareja(inscripcionId);
    } catch {
      setSeguidos(new Set(previo)); // revertir
    }
  };

  const catsQ = useQuery({
    queryKey: ['torneo-cats-bracket', id],
    queryFn: () => torneoService.getCategoriasBracket(id),
    enabled: !!id,
  });
  useEffect(() => {
    if (!catSel && catsQ.data && catsQ.data.length > 0) setCatSel(catsQ.data[0].id);
  }, [catsQ.data, catSel]);

  const bracketQ = useQuery({
    queryKey: ['torneo-bracket', id, catSel],
    queryFn: () => torneoService.getBracket(id, catSel!),
    enabled: !!id && !!catSel,
  });

  const partidos = bracketQ.data ?? [];
  const tengoCamino = !!user?.id && partidos.some((p) => involucraUsuario(p, user.id));
  const campeon = partidos.find((p) => p.fase === 'FINAL' && p.ganador)?.ganador ?? null;

  // Parejas seguidas presentes en este cuadro (para los chips de enfoque)
  const parejasSeguidas: { key: string; label: string; ids: string[] }[] = [];
  const vistos = new Set<string>();
  for (const p of partidos) {
    for (const par of [p.inscripcion1, p.inscripcion2]) {
      if (!par) continue;
      const ids = [par.jugador1?.id, par.jugador2?.id].filter((x): x is string => !!x);
      if (ids.length === 0 || !ids.some((id) => seguidos.has(id))) continue;
      const key = ids.slice().sort().join('-');
      if (vistos.has(key)) continue;
      vistos.add(key);
      const label = [par.jugador1?.apellido || par.jugador1?.nombre, par.jugador2?.apellido || par.jugador2?.nombre].filter(Boolean).join('/');
      parejasSeguidas.push({ key, label, ids });
    }
  }
  let filtroIds: string[] | null = null;
  if (focus === 'tu' && user?.id) filtroIds = [user.id];
  else if (focus.startsWith('pareja:')) filtroIds = parejasSeguidas.find((x) => `pareja:${x.key}` === focus)?.ids ?? null;
  const hayChips = tengoCamino || parejasSeguidas.length > 0;
  // Mini-mapa: fases presentes en orden, marcando las decididas
  const fasesPresentes = FASE_ORDER.filter((f) => partidos.some((p) => p.fase === f));
  const faseDecidida = (f: string) => partidos.filter((p) => p.fase === f).every((p) => !!p.ganador || p.esBye);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cuadro</Text>
          {nombre ? <Text style={styles.sub} numberOfLines={1}>{nombre}</Text> : null}
        </View>
      </View>

      {catsQ.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (catsQ.data?.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Todavía no hay cuadros publicados para este torneo.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {/* Chips de categoría */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }} style={{ marginBottom: spacing.sm }}>
            {catsQ.data!.map((c) => {
              const on = catSel === c.id;
              return (
                <TouchableOpacity key={c.id} style={[styles.chip, on && styles.chipOn]} onPress={() => { setCatSel(c.id); setFocus('todo'); }} activeOpacity={0.8}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Revelado de campeón */}
          {campeon ? (
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
              <ChampionBanner pareja={campeon} />
            </View>
          ) : null}

          {/* Chips de enfoque: Todo / Tu camino / parejas seguidas */}
          {hayChips && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }} style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
              <TouchableOpacity style={[styles.foco, focus === 'todo' && styles.focoOn]} onPress={() => setFocus('todo')} activeOpacity={0.8}>
                <LayoutGrid size={14} color={focus === 'todo' ? colors.white : colors.gray400} />
                <Text style={[styles.focoText, focus === 'todo' && styles.focoTextOn]}>Todo</Text>
              </TouchableOpacity>
              {tengoCamino && (
                <TouchableOpacity style={[styles.foco, focus === 'tu' && styles.focoOn]} onPress={() => setFocus('tu')} activeOpacity={0.8}>
                  <Route size={14} color={focus === 'tu' ? colors.white : '#ff8a8a'} />
                  <Text style={[styles.focoText, focus === 'tu' ? styles.focoTextOn : { color: '#ff8a8a' }]}>Tu camino</Text>
                </TouchableOpacity>
              )}
              {parejasSeguidas.map((pr) => {
                const on = focus === `pareja:${pr.key}`;
                return (
                  <TouchableOpacity key={pr.key} style={[styles.foco, styles.focoSeg, on && styles.focoSegOn]} onPress={() => setFocus(`pareja:${pr.key}`)} activeOpacity={0.8}>
                    <Eye size={14} color={on ? colors.white : '#85b7eb'} />
                    <Text style={[styles.focoText, { color: on ? colors.white : '#85b7eb' }]} numberOfLines={1}>{pr.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Mini-mapa de rondas */}
          {fasesPresentes.length > 1 && focus === 'todo' && (
            <View style={styles.minimap}>
              {fasesPresentes.map((f, i) => (
                <View key={f} style={styles.mmItem}>
                  <View style={[styles.mmDot, faseDecidida(f) && styles.mmDotOn]} />
                  <Text style={[styles.mmText, faseDecidida(f) && styles.mmTextOn]} numberOfLines={1}>{FASE_LABEL[f] || f}</Text>
                  {i < fasesPresentes.length - 1 ? <View style={styles.mmLine} /> : null}
                </View>
              ))}
            </View>
          )}

          {bracketQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : partidos.length === 0 ? (
            <Text style={styles.emptyText2}>El cuadro todavía no tiene partidos.</Text>
          ) : (
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
              <BracketTree partidos={partidos} userId={user?.id} seguidos={seguidos} filtroIds={filtroIds} onMatchPress={setDetalle} />
            </View>
          )}
        </ScrollView>
      )}

      <DetalleSheet p={detalle} onClose={() => setDetalle(null)} seguidos={seguidos} userId={user?.id} onTogglePareja={togglePareja} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { padding: 4 },
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  sub: { color: colors.gray400, fontSize: 13, marginTop: 1 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: 999, backgroundColor: '#161b26', borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.white },
  foco: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: '#161b26', borderWidth: 1, borderColor: colors.border },
  focoOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  focoSeg: { borderColor: 'rgba(55,138,221,0.4)' },
  focoSegOn: { backgroundColor: '#378add', borderColor: '#378add' },
  focoText: { color: colors.gray400, fontSize: 13, fontWeight: '600', maxWidth: 150 },
  focoTextOn: { color: colors.white },
  minimap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  mmItem: { flexDirection: 'row', alignItems: 'center' },
  mmDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#22303f', marginRight: 5 },
  mmDotOn: { backgroundColor: colors.primary },
  mmText: { color: colors.gray500, fontSize: 11 },
  mmTextOn: { color: colors.white, fontWeight: '600' },
  mmLine: { width: 14, height: 1.5, backgroundColor: '#22303f', marginHorizontal: 6 },
  // Champion banner
  champ: {
    backgroundColor: 'rgba(250,204,21,0.08)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.35)',
    borderRadius: 20, padding: spacing.lg, alignItems: 'center',
    shadowColor: '#facc15', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  champTrophy: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(250,204,21,0.16)', alignItems: 'center', justifyContent: 'center' },
  champKicker: { color: '#facc15', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 10 },
  champAvs: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  chAv: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.dark100, borderWidth: 2, borderColor: '#facc15' },
  chAvFb: { alignItems: 'center', justifyContent: 'center' },
  chAvIni: { color: colors.white, fontSize: 15, fontWeight: '800' },
  champName: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.gray400, fontSize: 14, textAlign: 'center' },
  emptyText2: { color: colors.gray400, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  // Sheet
  shRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  shCard: { backgroundColor: '#161b26', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  shHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  shTitle: { color: colors.primary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  shTeam: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12 },
  shTeamWin: { backgroundColor: 'rgba(223,37,49,0.10)' },
  shAvs: { flexDirection: 'row', alignItems: 'center' },
  shAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dark100, borderWidth: 2, borderColor: '#161b26' },
  shAvFb: { alignItems: 'center', justifyContent: 'center' },
  shAvIni: { color: colors.gray400, fontSize: 12, fontWeight: '700' },
  shName: { color: colors.white, fontSize: 14, fontWeight: '500' },
  shScore: { color: colors.gray400, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  shWin: { color: colors.white },
  shFollow: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.dark100, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  shFollowOn: { backgroundColor: 'rgba(55,138,221,0.16)', borderColor: 'rgba(55,138,221,0.4)' },
  shDiv: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  shMeta: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  shMetaText: { color: colors.gray400, fontSize: 13 },
});
