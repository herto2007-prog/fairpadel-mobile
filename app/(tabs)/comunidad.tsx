import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Shield, UserPlus, UserCheck, Users, AlertCircle } from 'lucide-react-native';
import { socialService, JugadorComunidad } from '../../src/services/socialService';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../../src/lib/theme';

function JugadorRow({
  j,
  siguiendo,
  onToggle,
  ocupado,
}: {
  j: JugadorComunidad;
  siguiendo: boolean;
  onToggle: () => void;
  ocupado: boolean;
}) {
  const iniciales = `${j.nombre?.[0] ?? ''}${j.apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => router.push(`/jugador/${j.id}`)}>
      {j.fotoUrl ? (
        <Image source={{ uri: j.fotoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{iniciales}</Text></View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{j.nombre} {j.apellido}</Text>
        <View style={styles.meta}>
          {j.categoria && (
            <View style={styles.catPill}><Shield size={11} color="#85B7EB" /><Text style={styles.catPillText}>{j.categoria.nombre}</Text></View>
          )}
          {j.ciudad && (
            <View style={styles.metaItem}><MapPin size={12} color={colors.gray500} /><Text style={styles.metaText}>{j.ciudad}</Text></View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.followBtn, siguiendo && styles.followingBtn]}
        onPress={onToggle}
        disabled={ocupado}
        activeOpacity={0.8}
        hitSlop={6}
      >
        {siguiendo ? <UserCheck size={15} color={colors.white} /> : <UserPlus size={15} color={colors.white} />}
        <Text style={styles.followText}>{siguiendo ? 'Siguiendo' : 'Seguir'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View style={{ flex: 1 }}>
        <Skeleton style={{ height: 15, width: '60%' }} />
        <Skeleton style={{ height: 12, width: '40%', marginTop: 8 }} />
      </View>
      <Skeleton style={{ height: 32, width: 90, borderRadius: 999 }} />
    </View>
  );
}

export default function ComunidadTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [siguiendoSet, setSiguiendoSet] = useState<Set<string>>(new Set());
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const jugadoresQ = useQuery({ queryKey: ['comunidad'], queryFn: socialService.getComunidad });
  const sigQ = useQuery({
    queryKey: ['siguiendo-ids', user?.id],
    queryFn: () => socialService.getSiguiendoIds(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (sigQ.data) setSiguiendoSet(new Set(sigQ.data));
  }, [sigQ.data]);

  const jugadores = useMemo(() => {
    const todos = (jugadoresQ.data ?? []).filter((j) => j.id !== user?.id);
    const term = q.trim().toLowerCase();
    if (!term) return todos;
    return todos.filter((j) => `${j.nombre} ${j.apellido}`.toLowerCase().includes(term));
  }, [jugadoresQ.data, q, user?.id]);

  const toggleSeguir = async (j: JugadorComunidad) => {
    if (ocupadoId) return;
    const yaSigo = siguiendoSet.has(j.id);
    const next = new Set(siguiendoSet);
    if (yaSigo) next.delete(j.id);
    else next.add(j.id);
    setSiguiendoSet(next); // optimista
    setOcupadoId(j.id);
    try {
      if (yaSigo) await socialService.dejarDeSeguir(j.id);
      else await socialService.seguir(j.id);
    } catch {
      // revertir
      const revert = new Set(next);
      if (yaSigo) revert.add(j.id);
      else revert.delete(j.id);
      setSiguiendoSet(revert);
    } finally {
      setOcupadoId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Comunidad</Text>
        <Text style={styles.subtitle}>Encontrá jugadores y seguilos</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color={colors.gray500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre"
          placeholderTextColor={colors.gray500}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {jugadoresQ.isLoading ? (
        <View style={styles.list}>{[0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)}</View>
      ) : jugadoresQ.isError ? (
        <View style={styles.centered}>
          <AlertCircle size={40} color={colors.gray500} />
          <Text style={styles.emptyTitle}>No pudimos cargar la comunidad</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => jugadoresQ.refetch()} activeOpacity={0.85}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={jugadores}
          keyExtractor={(j) => j.id}
          renderItem={({ item }) => (
            <JugadorRow
              j={item}
              siguiendo={siguiendoSet.has(item.id)}
              onToggle={() => toggleSeguir(item)}
              ocupado={ocupadoId === item.id}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={jugadoresQ.isRefetching} onRefresh={() => jugadoresQ.refetch()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Users size={40} color={colors.gray500} />
              <Text style={styles.emptyTitle}>{q ? 'Sin resultados' : 'No hay jugadores'}</Text>
              <Text style={styles.emptyText}>{q ? 'Probá con otro nombre.' : 'Volvé más tarde.'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { color: colors.white, fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: colors.gray400, fontSize: 14, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, height: 46,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 15, paddingVertical: 0 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(55,138,221,0.14)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  catPillText: { color: '#85B7EB', fontSize: 11, fontWeight: '600' },
  avatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 17, fontWeight: '800' },
  name: { color: colors.white, fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md - 2, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.gray400, fontSize: 12 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primary, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  followingBtn: { backgroundColor: colors.dark200, borderWidth: 1, borderColor: colors.border },
  followText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  emptyText: { color: colors.gray400, fontSize: 14, marginTop: 4, textAlign: 'center' },
  retryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg },
  retryText: { color: colors.white, fontWeight: '700' },
});
