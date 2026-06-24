import { useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Shield, MapPin } from 'lucide-react-native';
import { socialService, UsuarioLista } from '../src/services/socialService';
import { useAuth } from '../src/features/auth/context/AuthContext';
import { colors, spacing, radius } from '../src/lib/theme';

type Tab = 'siguiendo' | 'seguidores';

function Avatar({ u }: { u: UsuarioLista }) {
  const ini = `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();
  return u.fotoUrl ? (
    <Image source={{ uri: u.fotoUrl }} style={styles.avatar} />
  ) : (
    <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarIni}>{ini}</Text></View>
  );
}

export default function SeguidoresScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ userId?: string; tab?: string }>();
  const userId = params.userId || user?.id || '';
  const esPropio = !!user?.id && userId === user.id;
  const [tab, setTab] = useState<Tab>(params.tab === 'seguidores' ? 'seguidores' : 'siguiendo');
  const qc = useQueryClient();
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const sigQ = useQuery({
    queryKey: ['lista-siguiendo', userId],
    queryFn: () => socialService.getSiguiendo(userId),
    enabled: !!userId,
  });
  const segQ = useQuery({
    queryKey: ['lista-seguidores', userId],
    queryFn: () => socialService.getSeguidores(userId),
    enabled: !!userId,
  });

  const activeQ = tab === 'siguiendo' ? sigQ : segQ;
  const lista = activeQ.data ?? [];

  const quitarDeLista = (key: string[], id: string) => {
    qc.setQueryData<UsuarioLista[]>(key, (prev) => (prev ?? []).filter((u) => u.id !== id));
  };

  const dejarDeSeguir = (u: UsuarioLista) => {
    Alert.alert('Dejar de seguir', `¿Dejar de seguir a ${u.nombre} ${u.apellido}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Dejar de seguir',
        style: 'destructive',
        onPress: async () => {
          setOcupadoId(u.id);
          quitarDeLista(['lista-siguiendo', userId], u.id);
          try { await socialService.dejarDeSeguir(u.id); }
          catch { sigQ.refetch(); }
          finally { setOcupadoId(null); }
        },
      },
    ]);
  };

  const eliminarSeguidor = (u: UsuarioLista) => {
    Alert.alert('Eliminar seguidor', `¿Eliminar a ${u.nombre} ${u.apellido} de tus seguidores?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setOcupadoId(u.id);
          quitarDeLista(['lista-seguidores', userId], u.id);
          try { await socialService.eliminarSeguidor(u.id); }
          catch { segQ.refetch(); }
          finally { setOcupadoId(null); }
        },
      },
    ]);
  };

  const renderRow = ({ item }: { item: UsuarioLista }) => (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} activeOpacity={0.8} onPress={() => router.push(`/jugador/${item.id}`)}>
        <Avatar u={item} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{item.nombre} {item.apellido}</Text>
          <View style={styles.meta}>
            {item.categoriaActual && (
              <View style={styles.catPill}><Shield size={11} color="#85B7EB" /><Text style={styles.catPillText}>{item.categoriaActual.nombre}</Text></View>
            )}
            {item.ciudad && (
              <View style={styles.metaItem}><MapPin size={12} color={colors.gray500} /><Text style={styles.metaText}>{item.ciudad}</Text></View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      {esPropio && (
        tab === 'siguiendo' ? (
          <TouchableOpacity style={styles.btnGhost} onPress={() => dejarDeSeguir(item)} disabled={ocupadoId === item.id} activeOpacity={0.8}>
            <Text style={styles.btnGhostText}>Siguiendo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnDanger} onPress={() => eliminarSeguidor(item)} disabled={ocupadoId === item.id} activeOpacity={0.8}>
            <Text style={styles.btnDangerText}>Eliminar</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{esPropio ? 'Tu red' : 'Jugador'}</Text>
      </View>

      <View style={styles.segmented}>
        <TouchableOpacity style={[styles.segBtn, tab === 'siguiendo' && styles.segBtnOn]} activeOpacity={0.8} onPress={() => setTab('siguiendo')}>
          <Text style={[styles.segText, tab === 'siguiendo' && styles.segTextOn]}>Siguiendo {sigQ.data?.length ?? ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segBtn, tab === 'seguidores' && styles.segBtnOn]} activeOpacity={0.8} onPress={() => setTab('seguidores')}>
          <Text style={[styles.segText, tab === 'seguidores' && styles.segTextOn]}>Seguidores {segQ.data?.length ?? ''}</Text>
        </TouchableOpacity>
      </View>

      {activeQ.isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(u) => u.id}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Users size={40} color={colors.gray500} />
              <Text style={styles.emptyText}>
                {tab === 'siguiendo' ? 'Todavía no seguís a nadie.' : 'Todavía no tenés seguidores.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { padding: 4 },
  title: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  segmented: {
    flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 4,
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm + 1 },
  segBtnOn: { backgroundColor: colors.primary },
  segText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  segTextOn: { color: colors.white, fontWeight: '700' },
  loading: { paddingTop: 60, alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minWidth: 0 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  avatarIni: { color: colors.white, fontSize: 17, fontWeight: '800' },
  name: { color: colors.white, fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md - 2, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.gray400, fontSize: 12 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(55,138,221,0.14)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  catPillText: { color: '#85B7EB', fontSize: 11, fontWeight: '600' },
  btnGhost: { borderWidth: 1, borderColor: colors.dark300, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  btnGhostText: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  btnDanger: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  btnDangerText: { color: colors.red500, fontSize: 12, fontWeight: '600' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.gray400, fontSize: 14, marginTop: spacing.md, textAlign: 'center' },
});
