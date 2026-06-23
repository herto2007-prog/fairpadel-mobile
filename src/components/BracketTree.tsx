import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { PartidoBracket, ParejaBracket, JugadorBracket } from '../services/torneoService';
import { formatDatePYShort } from '../utils/date';
import { colors, spacing, radius } from '../lib/theme';

const FASE_LABEL: Record<string, string> = {
  ZONA: 'Zona', REPECHAJE: 'Repechaje', TREINTAYDOSAVOS: '32avos', DIECISEISAVOS: '16avos',
  OCTAVOS: 'Octavos', CUARTOS: 'Cuartos', SEMIS: 'Semifinal', FINAL: 'Final',
};
// Orden real de progresión (el campo 'orden' del back no ordena entre fases).
const FASE_ORDER = ['ZONA', 'REPECHAJE', 'TREINTAYDOSAVOS', 'DIECISEISAVOS', 'OCTAVOS', 'CUARTOS', 'SEMIS', 'FINAL'];
const faseRank = (f: string) => {
  const i = FASE_ORDER.indexOf(f);
  return i === -1 ? 99 : i;
};

function mismaPareja(a?: ParejaBracket | null, b?: ParejaBracket | null): boolean {
  if (!a || !b || !a.jugador1 || !b.jugador1) return false;
  return a.jugador1.nombre === b.jugador1.nombre && a.jugador1.apellido === b.jugador1.apellido;
}

const apellidosPareja = (par?: ParejaBracket | null, origen?: string | null): string => {
  if (!par || (!par.jugador1 && !par.jugador2)) return origen || 'A definir';
  const a1 = par.jugador1?.apellido || par.jugador1?.nombre || '';
  const a2 = par.jugador2?.apellido || par.jugador2?.nombre || '';
  return [a1, a2].filter(Boolean).join(' / ') || origen || 'A definir';
};

const setsDe = (p: PartidoBracket): [number, number][] =>
  p.resultado ? ([p.resultado.set1, p.resultado.set2, p.resultado.set3].filter(Boolean) as [number, number][]) : [];

// Medidas
const BR_W = 210;
const BR_H = 96;
const BR_VGAP = 18;
const BR_COLGAP = 30;
const BR_HEAD = 26;
const BR_UNIT = BR_H + BR_VGAP;

function BrAvatar({ j }: { j?: JugadorBracket | null }) {
  if (j?.fotoUrl) return <Image source={{ uri: j.fotoUrl }} style={styles.brAv} />;
  const ini = j ? `${j.nombre?.[0] ?? ''}${j.apellido?.[0] ?? ''}`.toUpperCase() : '';
  return (
    <View style={[styles.brAv, styles.brAvFallback]}>
      <Text style={styles.brAvIni}>{ini || '?'}</Text>
    </View>
  );
}

function BrTeam({ par, origen, gana, score, bye }: { par?: ParejaBracket | null; origen?: string | null; gana: boolean; score: string; bye?: boolean }) {
  const tienePareja = !bye && !!(par && (par.jugador1 || par.jugador2));
  return (
    <View style={styles.brTeamRow}>
      {tienePareja && (
        <View style={styles.brAvs}>
          <BrAvatar j={par!.jugador1} />
          {par!.jugador2 && <BrAvatar j={par!.jugador2} />}
        </View>
      )}
      <Text style={[styles.brTeam, gana && styles.brWin]} numberOfLines={1}>
        {bye ? 'BYE' : apellidosPareja(par, origen)}
      </Text>
      <Text style={[styles.brScore, gana && styles.brWin]}>{score}</Text>
    </View>
  );
}

function BracketMatch({ p }: { p: PartidoBracket }) {
  const gana1 = !!(p.ganador && mismaPareja(p.ganador, p.inscripcion1));
  const gana2 = !!(p.ganador && mismaPareja(p.ganador, p.inscripcion2));
  const sets = setsDe(p);
  const s1 = sets.map((s) => s[0]).join('  ');
  const s2 = sets.map((s) => s[1]).join('  ');
  const meta = [p.fecha ? formatDatePYShort(p.fecha) : null, p.sede, p.cancha, p.hora ? `${p.hora}h` : null]
    .filter(Boolean).join(' · ');
  return (
    <View style={styles.brMatch}>
      <BrTeam par={p.inscripcion1} origen={p.origen1} gana={gana1} score={s1} />
      <View style={styles.brTeamDiv} />
      <BrTeam par={p.inscripcion2} origen={p.origen2} gana={gana2} score={s2} bye={p.esBye} />
      {meta ? <Text style={styles.brMeta} numberOfLines={1}>{meta}</Text> : null}
    </View>
  );
}

export default function BracketTree({ partidos }: { partidos: PartidoBracket[] }) {
  const grupos = new Map<string, PartidoBracket[]>();
  for (const p of partidos) {
    if (!grupos.has(p.fase)) grupos.set(p.fase, []);
    grupos.get(p.fase)!.push(p);
  }
  const rounds = [...grupos.entries()]
    .map(([fase, ps]) => ({ fase, ps: ps.slice().sort((a, b) => a.orden - b.orden) }))
    .sort((a, b) => faseRank(a.fase) - faseRank(b.fase));

  const maxN = Math.max(...rounds.map((r) => r.ps.length), 1);
  const H = maxN * BR_UNIT;
  const colW = BR_W + BR_COLGAP;
  const totalW = rounds.length * colW;
  const centerOf = (n: number, i: number) => BR_HEAD + (H * (i + 0.5)) / n;

  const lines: any[] = [];
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const cur = rounds[ri];
    const next = rounds[ri + 1];
    if (next.ps.length !== Math.ceil(cur.ps.length / 2)) continue;
    const xChildR = ri * colW + BR_W;
    const xMid = xChildR + BR_COLGAP / 2;
    next.ps.forEach((_, j) => {
      const c0 = centerOf(cur.ps.length, 2 * j);
      const hasTwin = 2 * j + 1 < cur.ps.length;
      const c1 = hasTwin ? centerOf(cur.ps.length, 2 * j + 1) : c0;
      const cp = centerOf(next.ps.length, j);
      lines.push(<View key={`l0-${ri}-${j}`} style={[styles.brHLine, { left: xChildR, top: c0, width: BR_COLGAP / 2 }]} />);
      if (hasTwin) lines.push(<View key={`l1-${ri}-${j}`} style={[styles.brHLine, { left: xChildR, top: c1, width: BR_COLGAP / 2 }]} />);
      if (hasTwin) lines.push(<View key={`v-${ri}-${j}`} style={[styles.brVLine, { left: xMid, top: Math.min(c0, c1), height: Math.abs(c1 - c0) }]} />);
      lines.push(<View key={`lp-${ri}-${j}`} style={[styles.brHLine, { left: xMid, top: cp, width: BR_COLGAP / 2 }]} />);
    });
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingVertical: spacing.sm }}>
      <View style={{ width: totalW, height: H + BR_HEAD }}>
        {lines}
        {rounds.map((r, ri) => (
          <Text key={`h-${r.fase}`} style={[styles.brColTitle, { left: ri * colW, width: BR_W }]}>
            {FASE_LABEL[r.fase] || r.fase}
          </Text>
        ))}
        {rounds.map((r, ri) =>
          r.ps.map((p, i) => (
            <View key={p.id} style={{ position: 'absolute', left: ri * colW, top: centerOf(r.ps.length, i) - BR_H / 2, width: BR_W }}>
              <BracketMatch p={p} />
            </View>
          )),
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brColTitle: {
    position: 'absolute', top: 4, textAlign: 'center',
    color: colors.gray500, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  brMatch: {
    height: BR_H, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center',
  },
  brTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 30 },
  brAvs: { flexDirection: 'row', gap: 2 },
  brAv: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.dark100 },
  brAvFallback: { alignItems: 'center', justifyContent: 'center' },
  brAvIni: { color: colors.gray400, fontSize: 8, fontWeight: '700' },
  brTeam: { flex: 1, color: colors.gray400, fontSize: 12 },
  brScore: { color: colors.gray500, fontSize: 12, fontWeight: '700' },
  brWin: { color: colors.white, fontWeight: '800' },
  brTeamDiv: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  brMeta: { color: colors.gray500, fontSize: 9.5, marginTop: 5 },
  brHLine: { position: 'absolute', height: 1.5, backgroundColor: colors.dark300 },
  brVLine: { position: 'absolute', width: 1.5, backgroundColor: colors.dark300 },
});
