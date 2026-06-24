import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { PartidoBracket, ParejaBracket, JugadorBracket } from '../services/torneoService';
import { formatDatePYShort } from '../utils/date';
import { colors, spacing } from '../lib/theme';

const ELEVADO = '#161b26';

const FASE_LABEL: Record<string, string> = {
  ZONA: 'Zona', REPECHAJE: 'Repechaje', TREINTAYDOSAVOS: '32avos', DIECISEISAVOS: '16avos',
  OCTAVOS: 'Octavos', CUARTOS: 'Cuartos', SEMIS: 'Semifinal', FINAL: 'Final',
};
const FASE_ORDER = ['ZONA', 'REPECHAJE', 'TREINTAYDOSAVOS', 'DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];
const faseRank = (f: string) => {
  const i = FASE_ORDER.indexOf(f);
  return i === -1 ? 99 : i;
};

function mismaPareja(a?: ParejaBracket | null, b?: ParejaBracket | null): boolean {
  if (!a || !b || !a.jugador1 || !b.jugador1) return false;
  return a.jugador1.nombre === b.jugador1.nombre && a.jugador1.apellido === b.jugador1.apellido;
}

const apellido = (j?: JugadorBracket | null) => j?.apellido || j?.nombre || '';

const setsDe = (p: PartidoBracket): [number, number][] =>
  p.resultado ? ([p.resultado.set1, p.resultado.set2, p.resultado.set3].filter(Boolean) as [number, number][]) : [];

export function involucraUsuario(p: PartidoBracket, userId?: string | null): boolean {
  if (!userId) return false;
  const enPar = (par?: ParejaBracket | null) => !!par && (par.jugador1?.id === userId || par.jugador2?.id === userId);
  return enPar(p.inscripcion1) || enPar(p.inscripcion2);
}

function parSeguido(par?: ParejaBracket | null, seguidos?: Set<string>): boolean {
  if (!par || !seguidos || seguidos.size === 0) return false;
  return (!!par.jugador1?.id && seguidos.has(par.jugador1.id)) || (!!par.jugador2?.id && seguidos.has(par.jugador2.id));
}

const goJugador = (id?: string | null) => { if (id) router.push(`/jugador/${id}`); };

const pad = (n: number) => String(n).padStart(2, '0');
function hoyYmd(): string { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function nowMins(): number { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function horaAMins(h?: string | null): number | null {
  if (!h) return null;
  const [hh, mm] = h.split(':').map(Number);
  return Number.isFinite(hh) ? (hh || 0) * 60 + (mm || 0) : null;
}
// 'vivo' | 'hoy' | null  (los finalizados se detectan por ganador)
function estadoVivo(p: PartidoBracket): 'vivo' | 'hoy' | null {
  if (p.ganador || p.esBye || !p.fecha) return null;
  if (p.fecha.slice(0, 10) !== hoyYmd()) return null;
  const hm = horaAMins(p.hora);
  if (hm == null) return 'hoy';
  const diff = nowMins() - hm;
  if (diff >= 0 && diff <= 180) return 'vivo'; // arrancó y dentro de ~3h
  if (diff < 0) return 'hoy';
  return 'hoy';
}

function Avatar({ j }: { j?: JugadorBracket | null }) {
  if (j?.fotoUrl) return <Image source={{ uri: j.fotoUrl }} style={styles.av} />;
  const ini = j ? `${j.nombre?.[0] ?? ''}${j.apellido?.[0] ?? ''}`.toUpperCase() : '';
  return <View style={[styles.av, styles.avFallback]}><Text style={styles.avIni}>{ini || '?'}</Text></View>;
}

function TeamRow({ par, origen, gana, score, bye, seguido }: { par?: ParejaBracket | null; origen?: string | null; gana: boolean; score: string; bye?: boolean; seguido?: boolean }) {
  const j1 = par?.jugador1;
  const j2 = par?.jugador2;
  const tienePareja = !bye && !!(j1 || j2);
  const nombre = bye ? 'BYE' : tienePareja ? [apellido(j1), apellido(j2)].filter(Boolean).join(' / ') : (origen || 'A definir');
  return (
    <View style={[styles.teamRow, gana && styles.teamRowWin, seguido && !gana && styles.teamRowSeg]}>
      {tienePareja ? (
        <View style={styles.avs}>
          <TouchableOpacity onPress={() => goJugador(j1?.id)} disabled={!j1?.id} hitSlop={6}><Avatar j={j1} /></TouchableOpacity>
          {j2 ? <TouchableOpacity style={styles.avOverlap} onPress={() => goJugador(j2?.id)} disabled={!j2?.id} hitSlop={6}><Avatar j={j2} /></TouchableOpacity> : null}
        </View>
      ) : null}
      <Text style={[styles.teamName, gana && styles.win]} numberOfLines={1}>{nombre}</Text>
      {seguido ? <Text style={styles.segTag}>SIGUIENDO</Text> : null}
      <Text style={[styles.score, gana && styles.win]}>{score}</Text>
    </View>
  );
}

function MatchCard({ p, userId, seguidos, onPress }: { p: PartidoBracket; userId?: string | null; seguidos?: Set<string>; onPress: (p: PartidoBracket) => void }) {
  const gana1 = !!(p.ganador && mismaPareja(p.ganador, p.inscripcion1));
  const gana2 = !!(p.ganador && mismaPareja(p.ganador, p.inscripcion2));
  const sets = setsDe(p);
  const s1 = sets.map((s) => s[0]).join('  ');
  const s2 = sets.map((s) => s[1]).join('  ');
  const esTuyo = involucraUsuario(p, userId);
  const seg1 = parSeguido(p.inscripcion1, seguidos);
  const seg2 = parSeguido(p.inscripcion2, seguidos);
  const esSeguido = !esTuyo && (seg1 || seg2);
  const vivo = estadoVivo(p);
  const meta = [p.fecha ? formatDatePYShort(p.fecha) : null, p.sede, p.cancha, p.hora ? `${p.hora}h` : null].filter(Boolean).join(' · ');
  return (
    <TouchableOpacity style={[styles.card, esTuyo && styles.cardTuyo, esSeguido && styles.cardSeguido]} activeOpacity={0.85} onPress={() => onPress(p)}>
      {esTuyo ? <View style={styles.tuBar} /> : esSeguido ? <View style={styles.segBar} /> : null}
      <View style={{ flex: 1 }}>
        <TeamRow par={p.inscripcion1} origen={p.origen1} gana={gana1} score={s1} seguido={seg1} />
        <View style={styles.div} />
        <TeamRow par={p.inscripcion2} origen={p.origen2} gana={gana2} score={s2} bye={p.esBye} seguido={seg2} />
        {vivo === 'vivo' ? (
          <View style={[styles.footer, styles.footerVivo]}>
            <View style={styles.vivoDot} />
            <Text style={styles.vivoText}>En vivo{p.cancha ? ` · ${p.cancha}` : ''}</Text>
          </View>
        ) : vivo === 'hoy' ? (
          <View style={styles.footer}>
            <Text style={styles.hoyText}>Hoy{p.hora ? ` · ${p.hora} h` : ''}{p.cancha ? ` · ${p.cancha}` : ''}</Text>
          </View>
        ) : meta ? (
          <View style={styles.footer}><Text style={styles.meta} numberOfLines={1}>{meta}</Text></View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function BracketTree({
  partidos,
  userId,
  seguidos,
  soloTuCamino,
  onMatchPress,
}: {
  partidos: PartidoBracket[];
  userId?: string | null;
  seguidos?: Set<string>;
  soloTuCamino?: boolean;
  onMatchPress: (p: PartidoBracket) => void;
}) {
  const visibles = soloTuCamino ? partidos.filter((p) => involucraUsuario(p, userId)) : partidos;

  const grupos = new Map<string, PartidoBracket[]>();
  for (const p of visibles) {
    if (!grupos.has(p.fase)) grupos.set(p.fase, []);
    grupos.get(p.fase)!.push(p);
  }
  const rounds = [...grupos.entries()]
    .map(([fase, ps]) => ({ fase, ps: ps.slice().sort((a, b) => a.orden - b.orden) }))
    .sort((a, b) => faseRank(a.fase) - faseRank(b.fase));

  if (rounds.length === 0) {
    return <Text style={styles.vacio}>No hay partidos para mostrar.</Text>;
  }

  return (
    <View style={{ gap: spacing.lg }}>
      {rounds.map((r) => (
        <View key={r.fase}>
          <Text style={styles.roundTitle}>{FASE_LABEL[r.fase] || r.fase}</Text>
          <View style={{ gap: spacing.sm }}>
            {r.ps.map((p) => <MatchCard key={p.id} p={p} userId={userId} seguidos={seguidos} onPress={onMatchPress} />)}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  roundTitle: { color: colors.gray500, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row', backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  cardTuyo: { borderColor: '#2a2030' },
  cardSeguido: { borderColor: '#1d3a52' },
  tuBar: { width: 4, backgroundColor: colors.primary },
  segBar: { width: 4, backgroundColor: '#378add' },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 11 },
  teamRowWin: { backgroundColor: 'rgba(223,37,49,0.10)' },
  teamRowSeg: { backgroundColor: 'rgba(55,138,221,0.08)' },
  segTag: { color: '#85b7eb', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  avs: { flexDirection: 'row', alignItems: 'center' },
  avOverlap: { marginLeft: -8 },
  av: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.dark100, borderWidth: 1.5, borderColor: ELEVADO },
  avFallback: { alignItems: 'center', justifyContent: 'center' },
  avIni: { color: colors.gray400, fontSize: 9, fontWeight: '700' },
  teamName: { flex: 1, color: colors.gray400, fontSize: 13 },
  score: { color: colors.gray500, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  win: { color: '#fff', fontWeight: '700' },
  div: { height: 1, backgroundColor: colors.border },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#11151d', borderTopWidth: 1, borderTopColor: colors.border },
  footerVivo: { backgroundColor: '#1a0f12', borderTopColor: '#2a2030' },
  vivoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  vivoText: { color: '#ff8a8a', fontSize: 11, fontWeight: '600' },
  hoyText: { color: colors.amber500, fontSize: 11, fontWeight: '600' },
  meta: { color: colors.gray500, fontSize: 11 },
  vacio: { color: colors.gray500, fontSize: 13, paddingHorizontal: spacing.lg },
});
