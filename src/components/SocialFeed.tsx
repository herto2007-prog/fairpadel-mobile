import { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { Trophy, Sparkles, UserPlus, Activity, ChevronRight, X, Trash2 } from 'lucide-react-native';
import { jugadorService, FeedItem } from '../services/jugadorService';
import { postService } from '../services/postService';
import { PalaHeart } from './icons/PalaHeart';
import { colors, spacing, radius } from '../lib/theme';

const FEED_CONFIG: Record<string, { Icon: any; color: string; bg: string }> = {
  resultado: { Icon: Trophy, color: colors.amber500, bg: 'rgba(245,158,11,0.16)' },
  torneo_nuevo: { Icon: Sparkles, color: colors.primary, bg: 'rgba(223,37,49,0.16)' },
  inscripcion_seguido: { Icon: UserPlus, color: colors.blue500, bg: 'rgba(59,130,246,0.16)' },
};

function hace(fechaISO: string): string {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} d`;
  return `hace ${Math.floor(dias / 7)} sem`;
}

function FeedRow({ item, onToggle, onVerQuienes, onDelete }: { item: FeedItem; onToggle: () => void; onVerQuienes: () => void; onDelete: (item: FeedItem) => void }) {
  const count = item.reaccionesCount ?? 0;

  const reaccionBar = item.reaccionable ? (
    <View style={styles.reaccionBar}>
      <TouchableOpacity style={styles.likeBtn} onPress={onToggle} activeOpacity={0.7} hitSlop={6}>
        <PalaHeart size={20} filled={!!item.yaReaccione} />
        <Text style={[styles.likeText, item.yaReaccione && styles.likeTextOn]}>Me gusta</Text>
      </TouchableOpacity>
      {count > 0 &&
        (item.esDueno ? (
          <TouchableOpacity onPress={onVerQuienes} hitSlop={6}><Text style={styles.count}>{count}</Text></TouchableOpacity>
        ) : (
          <Text style={styles.count}>{count}</Text>
        ))}
    </View>
  ) : null;

  if (item.tipo === 'publicacion') {
    const ini = `${item.autorNombre?.[0] ?? ''}`.toUpperCase();
    return (
      <View style={styles.feedCard}>
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.postAuthor} activeOpacity={0.8} onPress={() => item.autorId && router.push(`/jugador/${item.autorId}`)}>
            {item.autorFotoUrl ? (
              <Image source={{ uri: item.autorFotoUrl }} style={styles.postAvatar} />
            ) : (
              <View style={[styles.postAvatar, styles.postAvatarFallback]}><Text style={styles.postIni}>{ini}</Text></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.postAuthorName} numberOfLines={1}>{item.autorNombre || item.titulo}</Text>
              <Text style={styles.feedTime}>{hace(item.fecha)}</Text>
            </View>
          </TouchableOpacity>
          {item.esDueno ? (
            <TouchableOpacity onPress={() => onDelete(item)} hitSlop={8} style={styles.postDel} activeOpacity={0.7}>
              <Trash2 size={18} color={colors.gray500} />
            </TouchableOpacity>
          ) : null}
        </View>
        {item.detalle ? <Text style={styles.postCaption}>{item.detalle}</Text> : null}
        {item.fotoUrl ? <Image source={{ uri: item.fotoUrl }} style={styles.postFoto} resizeMode="cover" /> : null}
        {reaccionBar}
      </View>
    );
  }

  const c = FEED_CONFIG[item.tipo] || { Icon: Activity, color: colors.gray400, bg: colors.dark100 };
  const { Icon } = c;
  const slug = item.link?.startsWith('/t/') ? item.link.slice(3) : null;
  const navegable = !!slug;
  const irAlTorneo = () => { if (slug) router.push(`/torneo/${slug}`); };
  return (
    <View style={styles.feedCard}>
      <TouchableOpacity style={styles.feedTop} onPress={irAlTorneo} disabled={!navegable} activeOpacity={navegable ? 0.7 : 1}>
        <View style={[styles.feedIcon, { backgroundColor: c.bg }]}><Icon size={18} color={c.color} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.feedTitle} numberOfLines={2}>{item.titulo}</Text>
          {item.detalle ? <Text style={styles.feedDetail} numberOfLines={1}>{item.detalle}</Text> : null}
        </View>
        <Text style={styles.feedTime}>{hace(item.fecha)}</Text>
        {navegable && <ChevronRight size={18} color={colors.gray500} />}
      </TouchableOpacity>
      {reaccionBar}
    </View>
  );
}

function ReaccionadoresModal({ item, onClose }: { item: FeedItem | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reaccionadores', item?.id],
    queryFn: () => jugadorService.getReaccionadores(item!.id),
    enabled: !!item,
  });
  const lista = data ?? [];
  return (
    <Modal visible={!!item} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>A quiénes les gustó</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}><X size={22} color={colors.gray400} /></TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={{ paddingVertical: spacing.xl }}><ActivityIndicator color={colors.primary} /></View>
          ) : lista.length === 0 ? (
            <Text style={styles.modalEmpty}>Todavía nadie reaccionó.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {lista.map((u) => {
                const ini = `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();
                return (
                  <TouchableOpacity key={u.id} style={styles.personRow} activeOpacity={0.8} onPress={() => { onClose(); router.push(`/jugador/${u.id}`); }}>
                    {u.fotoUrl ? (
                      <Image source={{ uri: u.fotoUrl }} style={styles.personAvatar} />
                    ) : (
                      <View style={[styles.personAvatar, styles.personFallback]}><Text style={styles.personIni}>{ini}</Text></View>
                    )}
                    <Text style={styles.personName}>{u.nombre} {u.apellido}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function SocialFeed({ queryKey, fetchFn }: { queryKey: QueryKey; fetchFn: () => Promise<FeedItem[]> }) {
  const qc = useQueryClient();
  const [modalItem, setModalItem] = useState<FeedItem | null>(null);
  const feedQ = useQuery({ queryKey, queryFn: fetchFn });

  const setFeedItem = (id: string, patch: Partial<FeedItem>) => {
    qc.setQueryData<FeedItem[]>(queryKey, (prev) => (prev ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const eliminarPost = (item: FeedItem) => {
    Alert.alert('Borrar publicación', '¿Seguro que querés borrar esta publicación? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          const pubId = item.id.startsWith('p-') ? item.id.slice(2) : item.id;
          qc.setQueryData<FeedItem[]>(queryKey, (prev) => (prev ?? []).filter((it) => it.id !== item.id));
          try { await postService.eliminar(pubId); } catch { feedQ.refetch(); }
        },
      },
    ]);
  };

  const toggleReaccion = async (item: FeedItem) => {
    const queLike = !item.yaReaccione;
    const base = item.reaccionesCount ?? 0;
    setFeedItem(item.id, { yaReaccione: queLike, reaccionesCount: Math.max(0, base + (queLike ? 1 : -1)) });
    try {
      const r = queLike ? await jugadorService.reaccionar(item.id) : await jugadorService.quitarReaccion(item.id);
      setFeedItem(item.id, { yaReaccione: r.yaReaccione, reaccionesCount: r.count });
    } catch {
      setFeedItem(item.id, { yaReaccione: item.yaReaccione, reaccionesCount: base });
    }
  };

  const items = feedQ.data ?? [];

  return (
    <>
      {feedQ.isLoading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={feedQ.isRefetching} onRefresh={() => feedQ.refetch()} tintColor={colors.primary} />}
        >
          {items.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {items.map((it) => (
                <FeedRow key={it.id} item={it} onToggle={() => toggleReaccion(it)} onVerQuienes={() => setModalItem(it)} onDelete={eliminarPost} />
              ))}
            </View>
          ) : (
            <View style={styles.feedEmpty}>
              <Text style={styles.feedEmptyText}>Seguí a más jugadores y publicá para que la comunidad cobre vida.</Text>
            </View>
          )}
        </ScrollView>
      )}
      <ReaccionadoresModal item={modalItem} onClose={() => setModalItem(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { paddingTop: 60, alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  feedCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md - 2 },
  feedTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4 },
  feedIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  reaccionBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md - 2, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  likeTextOn: { color: colors.primary },
  count: { color: colors.gray400, fontSize: 13, fontWeight: '700' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postAuthor: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postDel: { padding: 4 },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postAvatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  postIni: { color: colors.white, fontSize: 15, fontWeight: '800' },
  postAuthorName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  postCaption: { color: colors.white, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  postFoto: { width: '100%', height: 280, borderRadius: radius.md, backgroundColor: colors.dark100, marginTop: spacing.sm },
  feedTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  feedDetail: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  feedTime: { color: colors.gray500, fontSize: 11 },
  feedEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  feedEmptyText: { color: colors.gray400, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  modalEmpty: { color: colors.gray400, fontSize: 14, paddingVertical: spacing.lg, textAlign: 'center' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2, paddingVertical: spacing.sm },
  personAvatar: { width: 40, height: 40, borderRadius: 20 },
  personFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  personIni: { color: colors.white, fontSize: 15, fontWeight: '800' },
  personName: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
