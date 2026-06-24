import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, MapPin, CalendarDays, Users, Trophy, Clock, Award, AlertCircle, GitBranch,
} from 'lucide-react-native';
import { torneoService } from '../../src/services/torneoService';
import { colors, spacing, radius } from '../../src/lib/theme';
import { formatCurrency } from '../../src/utils/currency';
import { formatDatePYShort, formatDiasRestantes } from '../../src/utils/date';

const ELEVADO = '#161b26';

function InfoRow({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Tile({ icon, label, tint, onPress }: { icon: React.ReactNode; label: string; tint: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.tileChip, { backgroundColor: `${tint}29` }]}>{icon}</View>
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
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

  const esFinalizado = torneo?.estado === 'FINALIZADO';
  const abrirInscripcion = () => router.push(`/inscribirse/${slug}`);

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

  const sedeTexto = torneo.sedePrincipal
    ? `${torneo.sedePrincipal.nombre} · ${torneo.ciudad}`
    : torneo.ciudad;

  const badge =
    esFinalizado
      ? { label: 'Finalizado', bg: '#3a4654', color: '#dfe3ea' }
      : torneo.estado === 'EN_CURSO'
      ? { label: 'En curso', bg: '#ef9f27', color: '#412402' }
      : torneo.inscripcionesAbiertas
      ? { label: 'Inscripciones abiertas', bg: '#1d9e75', color: '#04130d' }
      : { label: 'Próximamente', bg: '#22303f', color: '#9aa3b2' };

  const goInscriptos = () => router.push({ pathname: '/torneo/inscriptos', params: { id: torneo.id, nombre: torneo.nombre } });
  const goLlave = () => router.push({ pathname: '/torneo/llave', params: { id: torneo.id, nombre: torneo.nombre } });
  const goCampeones = () => router.push({ pathname: '/torneo/campeones', params: { id: torneo.id, nombre: torneo.nombre, fechaInicio: torneo.fechaInicio, fechaFin: torneo.fechaFin } });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Flyer hero */}
        <View style={styles.hero}>
          {torneo.flyerUrl ? (
            <Image source={{ uri: torneo.flyerUrl }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Trophy size={52} color={colors.dark300} />
            </View>
          )}
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={[styles.heroBadge, { top: insets.top + 8, backgroundColor: badge.bg }]}>
            <Text style={[styles.heroBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{torneo.nombre}</Text>

          {/* Info principal */}
          <View style={styles.infoCard}>
            <InfoRow icon={<CalendarDays size={18} color={colors.primary} />} label="Fechas" value={rango} />
            <InfoRow icon={<MapPin size={18} color={colors.primary} />} label="Sede" value={sedeTexto} last={!torneo.fechaLimiteInscr} />
            {torneo.fechaLimiteInscr && (
              <InfoRow
                icon={<Clock size={18} color={colors.primary} />}
                label="Cierre de inscripción"
                value={`${formatDatePYShort(torneo.fechaLimiteInscr, true)} (${formatDiasRestantes(torneo.fechaLimiteInscr)})`}
                last
              />
            )}
          </View>

          {/* Accesos */}
          <View style={styles.tilesRow}>
            <Tile icon={<Users size={20} color={colors.blue500} />} label="Inscriptos" tint={colors.blue500} onPress={goInscriptos} />
            <Tile icon={<GitBranch size={20} color={colors.amber500} />} label="Cuadro" tint={colors.amber500} onPress={goLlave} />
            {esFinalizado && (
              <Tile icon={<Award size={20} color={colors.primary} />} label="Campeones" tint={colors.primary} onPress={goCampeones} />
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

          {/* Modalidades */}
          {torneo.modalidades && torneo.modalidades.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Modalidades</Text>
              <View style={styles.chips}>
                {torneo.modalidades.map((m) => (
                  <View key={m.id} style={styles.chip}><Text style={styles.chipText}>{m.nombre}</Text></View>
                ))}
              </View>
            </View>
          )}

          {/* Premios */}
          {torneo.premios && torneo.premios.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Premios</Text>
              <View style={styles.infoCard}>
                {torneo.premios.map((p, i) => (
                  <View key={p.id} style={[styles.premio, i < (torneo.premios?.length ?? 0) - 1 && styles.infoRowBorder]}>
                    <Award size={16} color={colors.amber500} />
                    <Text style={styles.premioText}><Text style={styles.premioPuesto}>{p.puesto}º </Text>{p.descripcion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Descripción */}
          {torneo.descripcion ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.descripcion}>{torneo.descripcion}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Barra fija de inscripción */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <View>
          <Text style={styles.precioLabel}>Inscripción</Text>
          <Text style={styles.precio}>{formatCurrency(Number(torneo.costoInscripcion))}</Text>
        </View>
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
  hero: { height: 190, backgroundColor: '#22303f' },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: spacing.md, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroBadge: { position: 'absolute', right: spacing.md, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  heroBadgeText: { fontSize: 11, fontWeight: '700' },
  content: { padding: spacing.lg },
  name: { color: colors.white, fontSize: 22, fontWeight: '700' },
  infoCard: {
    backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 18,
    paddingHorizontal: spacing.md, marginTop: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(223,37,49,0.15)', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: colors.gray500, fontSize: 12 },
  infoValue: { color: colors.white, fontSize: 14, fontWeight: '500', marginTop: 1 },
  // Accesos (tiles)
  tilesRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  tile: {
    flex: 1, backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  tileChip: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { color: colors.white, fontSize: 13, fontWeight: '500' },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.gray500, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: 'rgba(223,37,49,0.13)', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  chipClosed: { backgroundColor: colors.dark100, opacity: 0.6 },
  chipText: { color: '#ff8a8a', fontSize: 12, fontWeight: '600' },
  chipTextClosed: { color: colors.gray400 },
  premio: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 11 },
  premioText: { color: colors.white, fontSize: 14, flex: 1 },
  premioPuesto: { fontWeight: '800', color: colors.amber500 },
  descripcion: { color: '#cfd4dd', fontSize: 14, lineHeight: 21 },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#11151d',
    borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md,
  },
  precioLabel: { color: colors.gray500, fontSize: 11 },
  precio: { color: colors.white, fontSize: 18, fontWeight: '700' },
  cta: { flex: 1, backgroundColor: colors.primary, borderRadius: 14, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  ctaDisabled: { backgroundColor: colors.dark200 },
  ctaTextDisabled: { color: colors.gray400, fontSize: 15, fontWeight: '700' },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  retryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg },
  retryText: { color: colors.white, fontWeight: '700' },
  linkText: { color: colors.primary, fontWeight: '600' },
});
