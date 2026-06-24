import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Users } from 'lucide-react-native';
import { torneoService, JugadorInscrito, CategoriaInscritos } from '../../src/services/torneoService';
import { colors, spacing, radius } from '../../src/lib/theme';

const GRUPOS_ORDEN = ['CABALLEROS', 'DAMAS', 'MIXTO', 'OTROS'];
const GRUPO_COLOR: Record<string, string> = { CABALLEROS: colors.blue500, DAMAS: '#f472b6', MIXTO: '#a78bfa', OTROS: colors.gray400 };

function parseCat(nombre: string) {
  const n = (nombre || '').toLowerCase();
  let genero = 'OTROS';
  if (/dama|femenin/.test(n)) genero = 'DAMAS';
  else if (/caballer|masculin|varon/.test(n)) genero = 'CABALLEROS';
  else if (/mixto/.test(n)) genero = 'MIXTO';
  const m = (nombre || '').match(/(\d+)/);
  const rank = m ? parseInt(m[1], 10) : 99;
  return { genero, rank };
}

function Avatar({ j }: { j?: JugadorInscrito | null }) {
  const ini = j ? `${j.nombre?.[0] ?? ''}${j.apellido?.[0] ?? ''}`.toUpperCase() : '?';
  return j?.fotoUrl ? (
    <Image source={{ uri: j.fotoUrl }} style={styles.av} />
  ) : (
    <View style={[styles.av, styles.avFallback]}><Text style={styles.avIni}>{ini}</Text></View>
  );
}

function ParejaRow({ p }: { p: { id: string; jugador1: JugadorInscrito; jugador2?: JugadorInscrito | null } }) {
  const go = (j?: JugadorInscrito | null) => j?.id && router.push(`/jugador/${j.id}`);
  const n1 = p.jugador1 ? `${p.jugador1.nombre} ${p.jugador1.apellido}` : '';
  const n2 = p.jugador2 ? `${p.jugador2.nombre} ${p.jugador2.apellido}` : '';
  return (
    <View style={styles.parejaRow}>
      <View style={styles.avs}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => go(p.jugador1)}>
          <Avatar j={p.jugador1} />
        </TouchableOpacity>
        {p.jugador2 ? (
          <TouchableOpacity style={styles.avOverlap} activeOpacity={0.7} onPress={() => go(p.jugador2)}>
            <Avatar j={p.jugador2} />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.parejaNombre} numberOfLines={2}>
        <Text style={styles.jugadorLink} onPress={() => go(p.jugador1)}>{n1}</Text>
        {n2 ? <Text style={styles.sep}>  /  </Text> : null}
        {n2 ? <Text style={styles.jugadorLink} onPress={() => go(p.jugador2)}>{n2}</Text> : null}
      </Text>
    </View>
  );
}

export default function InscriptosScreen() {
  const insets = useSafeAreaInsets();
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());

  const q = useQuery({
    queryKey: ['torneo-inscritos', id],
    queryFn: () => torneoService.getInscritos(id),
    enabled: !!id,
  });

  const toggle = (catId: string) =>
    setAbiertas((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });

  // Agrupar por género y ordenar por jerarquía
  const cats = q.data?.categorias ?? [];
  const porGenero = new Map<string, CategoriaInscritos[]>();
  for (const c of cats) {
    const g = parseCat(c.categoriaNombre).genero;
    if (!porGenero.has(g)) porGenero.set(g, []);
    porGenero.get(g)!.push(c);
  }
  const grupos = GRUPOS_ORDEN.filter((g) => porGenero.has(g)).map((g) => ({
    genero: g,
    cats: porGenero.get(g)!.slice().sort((a, b) => parseCat(a.categoriaNombre).rank - parseCat(b.categoriaNombre).rank),
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Inscriptos</Text>
          {nombre ? <Text style={styles.sub} numberOfLines={1}>{nombre}</Text> : null}
        </View>
      </View>

      {q.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : cats.length === 0 ? (
        <View style={styles.empty}>
          <Users size={40} color={colors.gray500} />
          <Text style={styles.emptyText}>Todavía no hay parejas inscriptas.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
          {grupos.map((g) => (
            <View key={g.genero} style={{ marginBottom: spacing.md }}>
              <Text style={[styles.grupoTitle, { color: GRUPO_COLOR[g.genero] }]}>{g.genero}</Text>
              {g.cats.map((c) => {
                const abierta = abiertas.has(c.categoriaId);
                return (
                  <View key={c.categoriaId} style={styles.catCard}>
                    <TouchableOpacity style={styles.catHead} activeOpacity={0.7} onPress={() => toggle(c.categoriaId)}>
                      <Text style={styles.catNombre}>{c.categoriaNombre}</Text>
                      <Text style={styles.catCount}>{c.parejas.length}</Text>
                      {abierta ? <ChevronUp size={18} color={colors.gray500} /> : <ChevronDown size={18} color={colors.gray500} />}
                    </TouchableOpacity>
                    {abierta && (
                      <View style={styles.catBody}>
                        {c.parejas.length === 0 ? (
                          <Text style={styles.vacio}>Sin parejas en esta categoría.</Text>
                        ) : (
                          c.parejas.map((p) => <ParejaRow key={p.id} p={p} />)
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { padding: 4 },
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  sub: { color: colors.gray400, fontSize: 13, marginTop: 1 },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: 60 },
  emptyText: { color: colors.gray400, fontSize: 14 },
  grupoTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm, marginLeft: 2 },
  catCard: {
    backgroundColor: '#161b26', borderWidth: 1, borderColor: colors.border, borderRadius: 16,
    marginBottom: spacing.md - 2, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  catHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  catNombre: { flex: 1, color: colors.white, fontSize: 15, fontWeight: '600' },
  catCount: { backgroundColor: 'rgba(223,37,49,0.16)', color: '#ff8a8a', fontSize: 12, fontWeight: '600', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  catBody: { borderTopWidth: 1, borderTopColor: colors.border },
  parejaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2, paddingHorizontal: spacing.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  avs: { flexDirection: 'row', alignItems: 'center' },
  avOverlap: { marginLeft: -12 },
  av: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dark100, borderWidth: 2, borderColor: '#161b26' },
  avFallback: { alignItems: 'center', justifyContent: 'center' },
  avIni: { color: colors.gray400, fontSize: 12, fontWeight: '700' },
  parejaNombre: { flex: 1, fontSize: 14, lineHeight: 19 },
  jugadorLink: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  sep: { color: colors.gray500, fontSize: 14 },
  vacio: { color: colors.gray500, fontSize: 12, padding: spacing.md },
});
