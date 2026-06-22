import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Route, ChevronRight, Trophy } from 'lucide-react-native';
import { circuitoService } from '../src/services/circuitoService';
import { Skeleton } from '../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../src/lib/theme';

export default function CircuitosScreen() {
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: ['circuitos'], queryFn: circuitoService.getCircuitos });
  const circuitos = q.data ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Circuitos</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.primary} />
        }
      >
        <Text style={styles.intro}>
          Series de torneos que suman puntos a una misma tabla. Tocá uno para ver su ranking.
        </Text>

        {q.isLoading ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={styles.card}>
              <Skeleton style={{ width: 48, height: 48, borderRadius: radius.md }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={{ height: 16, width: '60%' }} />
                <Skeleton style={{ height: 12, width: '40%' }} />
              </View>
            </View>
          ))
        ) : circuitos.length === 0 ? (
          <View style={styles.empty}>
            <Route size={40} color={colors.gray500} />
            <Text style={styles.emptyText}>Todavía no hay circuitos publicados.</Text>
          </View>
        ) : (
          circuitos.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/circuito/${c.slug}`)}
            >
              {c.logoUrl ? (
                <Image source={{ uri: c.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoFallback]}>
                  <Trophy size={22} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>{c.nombre}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {c.ciudad} · Temporada {c.temporada}
                  {c._count?.torneos ? ` · ${c._count.torneos} torneo(s)` : ''}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.gray500} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: { padding: 4 },
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  intro: { color: colors.gray400, fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  logo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.dark100 },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  cardName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  cardMeta: { color: colors.gray400, fontSize: 12, marginTop: 3 },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: 60 },
  emptyText: { color: colors.gray400, fontSize: 14, textAlign: 'center' },
});
