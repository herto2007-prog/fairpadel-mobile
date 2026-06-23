import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { torneoService } from '../../src/services/torneoService';
import BracketTree from '../../src/components/BracketTree';
import { colors, spacing, radius } from '../../src/lib/theme';

export default function LlaveScreen() {
  const insets = useSafeAreaInsets();
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();

  const catsQ = useQuery({
    queryKey: ['torneo-cats-bracket', id],
    queryFn: () => torneoService.getCategoriasBracket(id),
    enabled: !!id,
  });
  const [catSel, setCatSel] = useState<string | null>(null);
  useEffect(() => {
    if (!catSel && catsQ.data && catsQ.data.length > 0) setCatSel(catsQ.data[0].id);
  }, [catsQ.data, catSel]);

  const bracketQ = useQuery({
    queryKey: ['torneo-bracket', id, catSel],
    queryFn: () => torneoService.getBracket(id, catSel!),
    enabled: !!id && !!catSel,
  });

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
                <TouchableOpacity key={c.id} style={[styles.chip, on && styles.chipOn]} onPress={() => setCatSel(c.id)} activeOpacity={0.8}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {bracketQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (bracketQ.data?.length ?? 0) === 0 ? (
            <Text style={styles.emptyText2}>El cuadro todavía no tiene partidos.</Text>
          ) : (
            <View style={{ paddingLeft: spacing.lg }}>
              <BracketTree partidos={bracketQ.data!} />
            </View>
          )}
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
  chip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.white },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.gray400, fontSize: 14, textAlign: 'center' },
  emptyText2: { color: colors.gray400, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: spacing.md },
});
