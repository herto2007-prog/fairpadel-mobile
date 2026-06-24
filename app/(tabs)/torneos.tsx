import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  CalendarDays,
  Trophy,
  ChevronRight,
  Users,
  AlertCircle,
} from 'lucide-react-native';
import { torneoService, TorneoListItem, TorneoEstadoFiltro } from '../../src/services/torneoService';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../../src/lib/theme';
import { formatCurrency } from '../../src/utils/currency';
import { formatDatePYShort } from '../../src/utils/date';

const FILTROS: { key: TorneoEstadoFiltro; label: string }[] = [
  { key: 'proximos', label: 'Próximos' },
  { key: 'en-curso', label: 'En curso' },
  { key: 'finalizados', label: 'Finalizados' },
];

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function rangoFechas(inicio: string, fin: string): string {
  if (inicio === fin) return formatDatePYShort(inicio);
  return `${formatDatePYShort(inicio)} – ${formatDatePYShort(fin)}`;
}

function TorneoCard({ torneo, estado }: { torneo: TorneoListItem; estado: TorneoEstadoFiltro }) {
  const abiertas = torneo.categorias?.some((c) => c.inscripcionAbierta);
  const navegable = !!torneo.slug;
  const badge =
    estado === 'en-curso'
      ? { label: 'En curso', bg: '#ef9f27', color: '#412402' }
      : estado === 'finalizados'
      ? { label: 'Finalizado', bg: '#3a4654', color: '#dfe3ea' }
      : abiertas
      ? { label: 'Inscripciones abiertas', bg: '#1d9e75', color: '#04130d' }
      : { label: 'Próximamente', bg: '#22303f', color: '#9aa3b2' };
  return (
    <TouchableOpacity
      style={[styles.card, !navegable && styles.cardDisabled]}
      activeOpacity={navegable ? 0.85 : 1}
      disabled={!navegable}
      onPress={() => torneo.slug && router.push(`/torneo/${torneo.slug}`)}
    >
      <View style={styles.flyer}>
        {torneo.flyerUrl ? (
          <Image source={{ uri: torneo.flyerUrl }} style={styles.flyerImg} resizeMode="cover" />
        ) : (
          <Trophy size={42} color={colors.dark300} />
        )}
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{torneo.nombre}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={13} color={colors.gray400} />
            <Text style={styles.metaText} numberOfLines={1}>{torneo.ciudad}</Text>
          </View>
          <View style={styles.metaItem}>
            <CalendarDays size={13} color={colors.gray400} />
            <Text style={styles.metaText}>{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</Text>
          </View>
        </View>

        {torneo.categorias?.length > 0 && (
          <View style={styles.chips}>
            {torneo.categorias.slice(0, 4).map((c) => (
              <View key={c.id} style={styles.chip}>
                <Text style={styles.chipText}>{c.nombre}</Text>
              </View>
            ))}
            {torneo.categorias.length > 4 && (
              <Text style={styles.chipMore}>+{torneo.categorias.length - 4}</Text>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Inscripción</Text>
            <Text style={styles.price}>{formatCurrency(Number(torneo.costoInscripcion))}</Text>
          </View>
          <View style={styles.footerRight}>
            <View style={styles.inscritosPill}>
              <Users size={12} color={colors.gray400} />
              <Text style={styles.inscritos}>{torneo.totalInscritos}</Text>
            </View>
            <ChevronRight size={22} color={colors.gray500} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TorneoCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={{ height: 140, borderRadius: 0 }} />
      <View style={styles.cardBody}>
        <Skeleton style={{ height: 16, width: '70%' }} />
        <Skeleton style={{ height: 12, width: '50%', marginTop: 10 }} />
        <View style={styles.cardFooter}>
          <Skeleton style={{ height: 16, width: 90 }} />
          <Skeleton style={{ height: 22, width: 22, borderRadius: 11 }} />
        </View>
      </View>
    </View>
  );
}

export default function TorneosTab() {
  const [estado, setEstado] = useState<TorneoEstadoFiltro>('proximos');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['torneos', estado, debouncedSearch],
    queryFn: () =>
      torneoService.getPublicTorneos({
        estado,
        q: debouncedSearch || undefined,
        limit: 50,
      }),
  });

  const torneos = data?.torneos ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Torneos</Text>
        <Text style={styles.subtitle}>Descubrí y unite a torneos</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color={colors.gray500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o ciudad"
          placeholderTextColor={colors.gray500}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      <View style={styles.segment}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.segItem, estado === f.key && styles.segItemOn]}
            onPress={() => setEstado(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segText, estado === f.key && styles.segTextOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => <TorneoCardSkeleton key={i} />)}
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <AlertCircle size={40} color={colors.gray500} />
          <Text style={styles.emptyTitle}>No pudimos cargar los torneos</Text>
          <Text style={styles.emptyText}>Revisá tu conexión e intentá de nuevo.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={torneos}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TorneoCard torneo={item} estado={estado} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Trophy size={40} color={colors.gray500} />
              <Text style={styles.emptyTitle}>No hay torneos por acá</Text>
              <Text style={styles.emptyText}>Probá con otro filtro o volvé más tarde.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 16,
    paddingBottom: spacing.md,
  },
  title: { color: colors.white, fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: colors.gray400, fontSize: 14, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: '#161b26',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 48,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 15, paddingVertical: 0 },
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  segItem: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segItemOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  segTextOn: { color: colors.white },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: '#161b26',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  cardDisabled: { opacity: 0.55 },
  flyer: {
    height: 140,
    backgroundColor: '#22303f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerImg: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: { padding: spacing.md },
  cardTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.gray400, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13, alignItems: 'center' },
  chip: {
    backgroundColor: 'rgba(223,37,49,0.13)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: '#ff8a8a', fontSize: 11, fontWeight: '600' },
  chipMore: { color: colors.gray500, fontSize: 11, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  priceLabel: { color: colors.gray500, fontSize: 11, marginBottom: 1 },
  price: { color: colors.white, fontSize: 16, fontWeight: '800' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inscritosPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.dark100, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
  },
  inscritos: { color: colors.gray400, fontSize: 12, fontWeight: '700' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  emptyText: { color: colors.gray400, fontSize: 14, marginTop: 4, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
  },
  retryText: { color: colors.white, fontWeight: '700' },
});
