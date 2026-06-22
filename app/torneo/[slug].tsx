import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  MapPin,
  CalendarDays,
  Wallet,
  Users,
  Trophy,
  Clock,
  Award,
  AlertCircle,
} from 'lucide-react-native';
import { torneoService, JugadorInscrito, PartidoBracket, ParejaBracket } from '../../src/services/torneoService';
import { colors, spacing, radius } from '../../src/lib/theme';
import { formatCurrency } from '../../src/utils/currency';
import { formatDatePYShort, formatDiasRestantes } from '../../src/utils/date';

// Etiquetas legibles de fase (display; el back manda el código crudo)
const FASE_LABEL: Record<string, string> = {
  ZONA: 'Zona', REPECHAJE: 'Repechaje', TREINTAYDOSAVOS: '32avos', DIECISEISAVOS: '16avos',
  OCTAVOS: 'Octavos', CUARTOS: 'Cuartos', SEMIS: 'Semifinal', FINAL: 'Final',
};

const nombrePareja = (p?: ParejaBracket | null, origen?: string | null): string => {
  if (!p || (!p.jugador1 && !p.jugador2)) return origen || 'A definir';
  const j1 = p.jugador1 ? `${p.jugador1.nombre} ${p.jugador1.apellido[0] ?? ''}.` : '';
  const j2 = p.jugador2 ? `${p.jugador2.nombre} ${p.jugador2.apellido[0] ?? ''}.` : '';
  return [j1, j2].filter(Boolean).join(' / ') || origen || 'A definir';
};

function mismaPareja(a?: ParejaBracket | null, b?: ParejaBracket | null): boolean {
  if (!a || !b || !a.jugador1 || !b.jugador1) return false;
  return a.jugador1.nombre === b.jugador1.nombre && a.jugador1.apellido === b.jugador1.apellido;
}

function BracketMatch({ p }: { p: PartidoBracket }) {
  const gana1 = p.ganador && mismaPareja(p.ganador, p.inscripcion1);
  const gana2 = p.ganador && mismaPareja(p.ganador, p.inscripcion2);
  const sets = p.resultado ? [p.resultado.set1, p.resultado.set2, p.resultado.set3].filter(Boolean) as [number, number][] : [];
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchRow}>
        <Text style={[styles.matchPareja, gana1 && styles.matchGanador]} numberOfLines={1}>
          {nombrePareja(p.inscripcion1, p.origen1)}
        </Text>
        <View style={styles.matchSets}>
          {sets.map((s, i) => <Text key={i} style={[styles.matchSet, gana1 && styles.matchGanador]}>{s[0]}</Text>)}
        </View>
      </View>
      <View style={styles.matchDivider} />
      <View style={styles.matchRow}>
        <Text style={[styles.matchPareja, gana2 && styles.matchGanador]} numberOfLines={1}>
          {p.esBye ? 'BYE' : nombrePareja(p.inscripcion2, p.origen2)}
        </Text>
        <View style={styles.matchSets}>
          {sets.map((s, i) => <Text key={i} style={[styles.matchSet, gana2 && styles.matchGanador]}>{s[1]}</Text>)}
        </View>
      </View>
      {(p.fecha || p.cancha) && (
        <Text style={styles.matchMeta}>
          {[p.fecha ? formatDatePYShort(p.fecha) : null, p.hora, p.cancha].filter(Boolean).join(' · ')}
        </Text>
      )}
    </View>
  );
}

function JugadorMini({ j }: { j?: JugadorInscrito | null }) {
  if (!j) {
    return (
      <View style={styles.jugMini}>
        <View style={[styles.jugAvatar, styles.jugAvatarFallback]}><Text style={styles.jugIni}>?</Text></View>
        <Text style={styles.jugNombre} numberOfLines={1}>A confirmar</Text>
      </View>
    );
  }
  const ini = `${j.nombre?.[0] ?? ''}${j.apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <TouchableOpacity style={styles.jugMini} activeOpacity={0.8} onPress={() => router.push(`/jugador/${j.id}`)}>
      {j.fotoUrl ? (
        <Image source={{ uri: j.fotoUrl }} style={styles.jugAvatar} />
      ) : (
        <View style={[styles.jugAvatar, styles.jugAvatarFallback]}><Text style={styles.jugIni}>{ini}</Text></View>
      )}
      <Text style={styles.jugNombre} numberOfLines={1}>{j.nombre} {j.apellido}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function TorneoDetalle() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();

  const { data: torneo, isLoading, isError, refetch } = useQuery({
    queryKey: ['torneo', slug],
    queryFn: () => torneoService.getTorneoBySlug(slug),
    enabled: !!slug,
  });

  const inscritosQ = useQuery({
    queryKey: ['torneo-inscritos', torneo?.id],
    queryFn: () => torneoService.getInscritos(torneo!.id),
    enabled: !!torneo?.id,
  });

  // Cuadro: categorías con bracket publicado + partidos de la categoría elegida
  const catsBracketQ = useQuery({
    queryKey: ['torneo-cats-bracket', torneo?.id],
    queryFn: () => torneoService.getCategoriasBracket(torneo!.id),
    enabled: !!torneo?.id,
  });
  const [catSel, setCatSel] = useState<string | null>(null);
  useEffect(() => {
    if (!catSel && catsBracketQ.data && catsBracketQ.data.length > 0) {
      setCatSel(catsBracketQ.data[0].id);
    }
  }, [catsBracketQ.data, catSel]);
  const bracketQ = useQuery({
    queryKey: ['torneo-bracket', torneo?.id, catSel],
    queryFn: () => torneoService.getBracket(torneo!.id, catSel!),
    enabled: !!torneo?.id && !!catSel,
  });

  // Campeones (solo finalizados)
  const esFinalizado = torneo?.estado === 'FINALIZADO';
  const campeonesQ = useQuery({
    queryKey: ['torneo-campeones', torneo?.id],
    queryFn: () => torneoService.getCampeones(torneo!.id),
    enabled: !!torneo?.id && esFinalizado,
  });

  const abrirInscripcion = () => {
    router.push(`/inscribirse/${slug}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !torneo) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertCircle size={40} color={colors.gray500} />
        <Text style={styles.emptyTitle}>No pudimos cargar el torneo</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: spacing.md }} onPress={() => router.back()}>
          <Text style={styles.linkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rango =
    torneo.fechaInicio === torneo.fechaFin
      ? formatDatePYShort(torneo.fechaInicio, true)
      : `${formatDatePYShort(torneo.fechaInicio)} – ${formatDatePYShort(torneo.fechaFin, true)}`;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Flyer hero */}
        <View style={styles.hero}>
          {torneo.flyerUrl ? (
            <Image source={{ uri: torneo.flyerUrl }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Trophy size={56} color={colors.dark300} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{torneo.nombre}</Text>
          <Text style={styles.org}>
            Organiza {torneo.organizador.nombre} {torneo.organizador.apellido}
          </Text>

          {/* Campeones (torneos finalizados) */}
          {esFinalizado && (campeonesQ.data?.length ?? 0) > 0 && (
            <View style={styles.campeonesBox}>
              <View style={styles.campeonesHead}>
                <Trophy size={18} color={colors.amber500} />
                <Text style={styles.campeonesTitle}>Campeones</Text>
              </View>
              {campeonesQ.data!.map((c) => (
                <View key={c.categoriaId} style={styles.campeonRow}>
                  <Text style={styles.campeonCat} numberOfLines={1}>{c.categoriaNombre}</Text>
                  <View style={styles.campeonParejaWrap}>
                    <JugadorMini j={c.campeon.jugador1 as JugadorInscrito} />
                    {c.campeon.jugador2 ? <JugadorMini j={c.campeon.jugador2 as JugadorInscrito} /> : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Info principal */}
          <View style={styles.infoCard}>
            <InfoRow icon={<CalendarDays size={18} color={colors.primary} />} label="Fechas" value={rango} />
            <InfoRow icon={<MapPin size={18} color={colors.blue500} />} label="Ciudad" value={torneo.ciudad} />
            <InfoRow icon={<Wallet size={18} color={colors.green500} />} label="Costo por pareja" value={formatCurrency(Number(torneo.costoInscripcion))} />
            <InfoRow icon={<Users size={18} color={colors.amber500} />} label="Inscriptos" value={`${torneo.totalInscritos}`} />
            {torneo.fechaLimiteInscr && (
              <InfoRow
                icon={<Clock size={18} color={colors.gray400} />}
                label="Cierre de inscripciones"
                value={`${formatDatePYShort(torneo.fechaLimiteInscr, true)} (${formatDiasRestantes(torneo.fechaLimiteInscr)})`}
              />
            )}
          </View>

          {/* Categorías */}
          {torneo.categorias?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categorías</Text>
              <View style={styles.chips}>
                {torneo.categorias.map((c) => (
                  <View key={c.id} style={[styles.chip, !c.inscripcionAbierta && styles.chipClosed]}>
                    <Text style={[styles.chipText, !c.inscripcionAbierta && styles.chipTextClosed]}>{c.nombre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Inscriptos */}
          {(() => {
            const cats = (inscritosQ.data?.categorias ?? []).filter((c) => c.parejas.length > 0);
            const total = inscritosQ.data?.totalInscritos ?? 0;
            if (inscritosQ.isLoading) {
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Inscriptos</Text>
                  <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
                </View>
              );
            }
            if (cats.length === 0) return null;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inscriptos ({total})</Text>
                {cats.map((c) => (
                  <View key={c.categoriaId} style={{ marginTop: spacing.md }}>
                    <Text style={styles.inscCatTitle}>{c.categoriaNombre} · {c.parejas.length} {c.parejas.length === 1 ? 'pareja' : 'parejas'}</Text>
                    <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                      {c.parejas.map((p) => (
                        <View key={p.id} style={styles.parejaCard}>
                          <JugadorMini j={p.jugador1} />
                          <Text style={styles.parejaVs}>/</Text>
                          <JugadorMini j={p.jugador2} />
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Cuadro y resultados (categorías con bracket publicado) */}
          {(catsBracketQ.data?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cuadro y resultados</Text>
              <View style={styles.chips}>
                {catsBracketQ.data!.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, catSel === c.id && styles.chipOn]}
                    onPress={() => setCatSel(c.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, catSel === c.id && styles.chipTextOn]}>{c.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {bracketQ.isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
              ) : (bracketQ.data?.length ?? 0) === 0 ? (
                <Text style={styles.cuadroVacio}>El cuadro todavía no tiene partidos.</Text>
              ) : (
                (() => {
                  const partidos = bracketQ.data!;
                  // Agrupar por fase, ordenar grupos por el menor 'orden'
                  const grupos = new Map<string, PartidoBracket[]>();
                  for (const p of partidos) {
                    if (!grupos.has(p.fase)) grupos.set(p.fase, []);
                    grupos.get(p.fase)!.push(p);
                  }
                  const fasesOrdenadas = [...grupos.entries()].sort(
                    (a, b) => Math.min(...a[1].map((x) => x.orden)) - Math.min(...b[1].map((x) => x.orden)),
                  );
                  return fasesOrdenadas.map(([fase, ps]) => (
                    <View key={fase} style={{ marginTop: spacing.md }}>
                      <Text style={styles.faseTitle}>{FASE_LABEL[fase] || fase}</Text>
                      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                        {ps.map((p) => <BracketMatch key={p.id} p={p} />)}
                      </View>
                    </View>
                  ));
                })()
              )}
            </View>
          )}

          {/* Modalidades */}
          {torneo.modalidades && torneo.modalidades.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Modalidades</Text>
              <View style={styles.chips}>
                {torneo.modalidades.map((m) => (
                  <View key={m.id} style={styles.chip}>
                    <Text style={styles.chipText}>{m.nombre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Sede */}
          {torneo.sedePrincipal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sede</Text>
              <View style={styles.infoCard}>
                <InfoRow
                  icon={<MapPin size={18} color={colors.primary} />}
                  label={torneo.sedePrincipal.nombre}
                  value={torneo.sedePrincipal.direccion || torneo.sedePrincipal.ciudad}
                />
              </View>
            </View>
          )}

          {/* Premios */}
          {torneo.premios && torneo.premios.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Premios</Text>
              <View style={styles.infoCard}>
                {torneo.premios.map((p) => (
                  <View key={p.id} style={styles.premio}>
                    <Award size={16} color={colors.amber500} />
                    <Text style={styles.premioText}>
                      <Text style={styles.premioPuesto}>{p.puesto}º </Text>
                      {p.descripcion}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Descripción */}
          {torneo.descripcion ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre el torneo</Text>
              <Text style={styles.descripcion}>{torneo.descripcion}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Barra fija de inscripción */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
        {torneo.inscripcionesAbiertas ? (
          <TouchableOpacity style={styles.cta} onPress={abrirInscripcion} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Inscribirme</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.cta, styles.ctaDisabled]}>
            <Text style={styles.ctaTextDisabled}>Inscripciones cerradas</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  hero: { height: 240, backgroundColor: colors.dark100 },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.lg },
  name: { color: colors.white, fontSize: 24, fontWeight: '800' },
  org: { color: colors.gray400, fontSize: 14, marginTop: 4 },
  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.dark100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { color: colors.gray400, fontSize: 12 },
  infoValue: { color: colors.white, fontSize: 15, fontWeight: '600', marginTop: 1 },
  section: { marginTop: spacing.lg },
  sectionTitle: { color: colors.white, fontSize: 17, fontWeight: '800', marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.dark100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipClosed: { opacity: 0.45 },
  chipText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  chipTextClosed: { color: colors.gray400 },
  // Campeones
  campeonesBox: {
    backgroundColor: 'rgba(245,158,11,0.10)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md,
  },
  campeonesHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  campeonesTitle: { color: colors.amber500, fontSize: 16, fontWeight: '800' },
  campeonRow: { marginTop: spacing.sm },
  campeonCat: { color: colors.gray400, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  campeonParejaWrap: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  // Cuadro
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTextOn: { color: colors.white },
  cuadroVacio: { color: colors.gray400, fontSize: 13, marginTop: spacing.md },
  faseTitle: { color: colors.white, fontSize: 14, fontWeight: '800' },
  matchCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.sm,
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  matchPareja: { flex: 1, color: colors.gray400, fontSize: 13 },
  matchGanador: { color: colors.white, fontWeight: '800' },
  matchSets: { flexDirection: 'row', gap: 8 },
  matchSet: { color: colors.gray400, fontSize: 13, fontWeight: '700', minWidth: 12, textAlign: 'center' },
  matchDivider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  matchMeta: { color: colors.gray500, fontSize: 11, marginTop: 6 },
  inscCatTitle: { color: colors.gray400, fontSize: 13, fontWeight: '700' },
  parejaCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.sm,
  },
  jugMini: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  jugAvatar: { width: 34, height: 34, borderRadius: 17 },
  jugAvatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  jugIni: { color: colors.white, fontSize: 13, fontWeight: '800' },
  jugNombre: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },
  parejaVs: { color: colors.gray500, fontSize: 14, fontWeight: '800', paddingHorizontal: 6 },
  premio: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  premioText: { color: colors.white, fontSize: 14, flex: 1 },
  premioPuesto: { fontWeight: '800', color: colors.amber500 },
  descripcion: { color: colors.gray400, fontSize: 14, lineHeight: 21 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: '800' },
  ctaDisabled: { backgroundColor: colors.dark200 },
  ctaTextDisabled: { color: colors.gray400, fontSize: 16, fontWeight: '700' },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
  },
  retryText: { color: colors.white, fontWeight: '700' },
  linkText: { color: colors.primary, fontWeight: '600' },
});
