import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
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
  ExternalLink,
} from 'lucide-react-native';
import { torneoService } from '../../src/services/torneoService';
import { colors, spacing, radius } from '../../src/lib/theme';
import { formatCurrency } from '../../src/utils/currency';
import { formatDatePYShort, formatDiasRestantes } from '../../src/utils/date';

const WEB_URL = 'https://fairpadel.com';

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

  const abrirInscripcion = () => {
    Linking.openURL(`${WEB_URL}/t/${slug}/inscribirse`);
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
            <ExternalLink size={17} color={colors.white} />
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
