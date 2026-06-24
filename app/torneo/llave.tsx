import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, Animated, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Route, LayoutGrid, X, Trophy } from 'lucide-react-native';
import { torneoService, PartidoBracket, JugadorBracket, ParejaBracket } from '../../src/services/torneoService';
import BracketTree, { involucraUsuario } from '../../src/components/BracketTree';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { formatDatePYShort } from '../../src/utils/date';
import { colors, spacing, radius } from '../../src/lib/theme';

const FASE_LABEL: Record<string, string> = {
  ZONA: 'Zona', REPECHAJE: 'Repechaje', TREINTAYDOSAVOS: '32avos', DIECISEISAVOS: '16avos',
  OCTAVOS: 'Octavos', CUARTOS: 'Cuartos', SEMIS: 'Semifinal', FINAL: 'Final',
};
const FASE_ORDER = ['ZONA', 'REPECHAJE', 'TREINTAYDOSAVOS', 'DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];

const go = (id?: string | null) => { if (id) router.push(`/jugador/${id}`); };

function SheetTeam({ j1, j2, sets, idx, ganador }: { j1?: JugadorBracket | null; j2?: JugadorBracket | null; sets: string; idx: number; ganador: boolean }) {
  const Av = ({ j }: { j?: JugadorBracket | null }) =>
    j?.fotoUrl ? <Image source={{ uri: j.fotoUrl }} style={styles.shAv} /> : (
      <View style={[styles.shAv, styles.shAvFb]}><Text style={styles.shAvIni}>{`${j?.nombre?.[0] ?? ''}${j?.apellido?.[0] ?? ''}`.toUpperCase() || '?'}</Text></View>
    );
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
    </View>
  );
}

function DetalleSheet({ p, onClose }: { p: PartidoBracket | null; onClose: () => void }) {
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
          <SheetTeam j1={p.inscripcion1?.jugador1} j2={p.inscripcion1?.jugador2} sets={s1} idx={1} ganador={g1} />
          <View style={styles.shDiv} />
          <SheetTeam j1={p.inscripcion2?.jugador1} j2={p.inscripcion2?.jugador2} sets={s2} idx={2} ganador={g2} />
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
  const [soloTuCamino, setSoloTuCamino] = useState(false);
  const [detalle, setDetalle] = useState<PartidoBracket | null>(null);

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
                <TouchableOpacity key={c.id} style={[styles.chip, on && styles.chipOn]} onPress={() => { setCatSel(c.id); setSoloTuCamino(false); }} activeOpacity={0.8}>
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

          {/* Toggle Tu camino / Cuadro completo */}
          {tengoCamino && (
            <View style={styles.toggle}>
              <TouchableOpacity style={[styles.tgItem, soloTuCamino && styles.tgItemOn]} onPress={() => setSoloTuCamino(true)} activeOpacity={0.8}>
                <Route size={15} color={soloTuCamino ? colors.white : colors.gray400} />
                <Text style={[styles.tgText, soloTuCamino && styles.tgTextOn]}>Tu camino</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tgItem, !soloTuCamino && styles.tgItemOn]} onPress={() => setSoloTuCamino(false)} activeOpacity={0.8}>
                <LayoutGrid size={15} color={!soloTuCamino ? colors.white : colors.gray400} />
                <Text style={[styles.tgText, !soloTuCamino && styles.tgTextOn]}>Cuadro completo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mini-mapa de rondas */}
          {fasesPresentes.length > 1 && !soloTuCamino && (
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
              <BracketTree partidos={partidos} userId={user?.id} soloTuCamino={soloTuCamino} onMatchPress={setDetalle} />
            </View>
          )}
        </ScrollView>
      )}

      <DetalleSheet p={detalle} onClose={() => setDetalle(null)} />
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
  toggle: { flexDirection: 'row', gap: 8, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md },
  tgItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: '#161b26', borderWidth: 1, borderColor: colors.border },
  tgItemOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tgText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  tgTextOn: { color: colors.white },
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
  shDiv: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  shMeta: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  shMetaText: { color: colors.gray400, fontSize: 13 },
});
