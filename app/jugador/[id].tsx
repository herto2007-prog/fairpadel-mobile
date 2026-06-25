import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Linking, Alert, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Svg, { Polyline, Circle } from 'react-native-svg';
import {
  ChevronLeft, Shield, MapPin, Calendar, Trophy, Activity, Star, Flame, Target, Award,
  TrendingUp, UserPlus, UserCheck, AlertCircle, AtSign, Link2, Handshake, Swords,
  Medal, LayoutGrid, X, Trash2,
} from 'lucide-react-native';
import { perfilService, NivelLogro } from '../../src/services/perfilService';
import { socialService } from '../../src/services/socialService';
import { postService, PostJugador } from '../../src/services/postService';
import { jugadorService } from '../../src/services/jugadorService';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { colors, spacing, radius } from '../../src/lib/theme';

const NIVEL_COLOR: Record<NivelLogro, string> = { oro: '#facc15', plata: '#d1d5db', bronce: '#d97706', especial: '#a78bfa' };
const GOLD = '#fbbf24';

const POS_LABEL: Record<string, string> = {
  CAMPEON: 'Campeón', FINALISTA: 'Finalista', SEMIFINAL: 'Semifinal', SEMIFINALISTA: 'Semifinal',
  CUARTOS: 'Cuartos', OCTAVOS: 'Octavos', DIECISEISAVOS: '16avos', TREINTAYDOSAVOS: '32avos', PRIMERA_RONDA: '1ª ronda',
};
const posLabel = (p: string) => POS_LABEL[p] || p;

const fmtMes = (iso: string) => {
  const m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${m[d.getMonth()]} ${d.getFullYear()}`;
};

const igUrl = (h: string) => (/^https?:/.test(h.trim()) ? h.trim() : `https://instagram.com/${h.trim().replace(/^@/, '')}`);
const fbUrl = (h: string) => (/^https?:/.test(h.trim()) ? h.trim() : `https://facebook.com/${h.trim().replace(/^@/, '')}`);

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniAvatar({ uri, ini, size = 40, ring }: { uri?: string | null; ini: string; size?: number; ring?: string }) {
  const base = { width: size, height: size, borderRadius: size / 2, ...(ring ? { borderWidth: 2, borderColor: ring } : null) };
  return uri ? (
    <Image source={{ uri }} style={base} />
  ) : (
    <View style={[base, styles.miniFb]}><Text style={[styles.miniIni, { fontSize: size * 0.36 }]}>{ini}</Text></View>
  );
}

// Sparkline de puntos acumulados (evolución del ranking)
function Sparkline({ valores }: { valores: number[] }) {
  const W = 260, H = 54, P = 6;
  if (valores.length < 2) return null;
  const min = Math.min(...valores), max = Math.max(...valores);
  const span = max - min || 1;
  const stepX = (W - P * 2) / (valores.length - 1);
  const pts = valores.map((v, i) => {
    const x = P + i * stepX;
    const y = H - P - ((v - min) / span) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(',');
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Polyline points={pts.join(' ')} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last[0]} cy={last[1]} r={4} fill={colors.primary} />
    </Svg>
  );
}

function PostModal({ post, onClose, onDeleted }: { post: PostJugador | null; onClose: () => void; onDeleted: (id: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (post) { setLiked(post.yaReaccione); setCount(post.reaccionesCount); } }, [post]);
  if (!post) return null;
  const borrar = () => {
    Alert.alert('Borrar publicación', '¿Seguro que querés borrar esta publicación? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          const pid = post.id;
          onDeleted(pid);
          onClose();
          try { await postService.eliminar(pid); } catch { /* el refetch del padre corrige */ }
        },
      },
    ]);
  };
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const nuevo = !liked;
    setLiked(nuevo); setCount((c) => Math.max(0, c + (nuevo ? 1 : -1)));
    try {
      const r = nuevo ? await jugadorService.reaccionar(post.feedItemId) : await jugadorService.quitarReaccion(post.feedItemId);
      setLiked(r.yaReaccione); setCount(r.count);
    } catch { setLiked(!nuevo); setCount(post.reaccionesCount); }
    finally { setBusy(false); }
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.pmRoot}>
        <TouchableOpacity style={styles.pmClose} onPress={onClose} hitSlop={8}><X size={26} color={colors.white} /></TouchableOpacity>
        {post.fotoUrl ? <Image source={{ uri: post.fotoUrl }} style={styles.pmImg} resizeMode="contain" /> : null}
        <View style={styles.pmFooter}>
          {post.contenido ? <Text style={styles.pmCaption}>{post.contenido}</Text> : null}
          <View style={styles.pmBar}>
            <TouchableOpacity style={styles.pmLike} onPress={toggle} activeOpacity={0.7}>
              <Star size={20} color={liked ? colors.primary : colors.gray400} fill={liked ? colors.primary : 'transparent'} />
              <Text style={[styles.pmLikeText, liked && { color: colors.primary }]}>Me gusta</Text>
            </TouchableOpacity>
            {count > 0 ? <Text style={styles.pmCount}>{count}</Text> : null}
            {post.esDueno ? (
              <TouchableOpacity style={styles.pmDel} onPress={borrar} activeOpacity={0.7}>
                <Trash2 size={18} color="#ff8a8a" /><Text style={styles.pmDelText}>Borrar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function JugadorPerfil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const esMiPerfil = user?.id === id;

  const perfilQ = useQuery({ queryKey: ['perfil-jugador', id], queryFn: () => perfilService.getPerfilJugador(id), enabled: !!id });
  const relacionQ = useQuery({ queryKey: ['relacion', id], queryFn: () => socialService.getRelacion(id), enabled: !!id && !esMiPerfil });
  const comunesQ = useQuery({ queryKey: ['comunes', id], queryFn: () => socialService.getSeguidoresEnComun(id), enabled: !!id && !esMiPerfil });
  const crQ = useQuery({ queryKey: ['comp-rival', id], queryFn: () => perfilService.getCompanerosRivales(id), enabled: !!id });
  const postsQ = useQuery({ queryKey: ['posts-jugador', id], queryFn: () => postService.getDeUsuario(id), enabled: !!id });

  const perfil = perfilQ.data;
  const [siguiendo, setSiguiendo] = useState(false);
  const [accion, setAccion] = useState(false);
  const [postSel, setPostSel] = useState<PostJugador | null>(null);

  useEffect(() => { if (relacionQ.data) setSiguiendo(relacionQ.data.siguiendo); }, [relacionQ.data]);

  const toggleSeguir = async () => {
    if (accion) return;
    const nuevo = !siguiendo;
    setSiguiendo(nuevo);
    setAccion(true);
    try {
      if (nuevo) await socialService.seguir(id);
      else await socialService.dejarDeSeguir(id);
      qc.invalidateQueries({ queryKey: ['perfil-jugador', id] });
    } catch { setSiguiendo(!nuevo); }
    finally { setAccion(false); }
  };

  const iniciales = perfil ? `${perfil.nombre?.[0] ?? ''}${perfil.apellido?.[0] ?? ''}`.toUpperCase() : '';
  const verLista = (tab: 'seguidores' | 'siguiendo') => router.push(`/seguidores?userId=${id}&tab=${tab}` as any);

  // Palmarés + sparkline (de historialPuntos, ya viene en el perfil)
  const historial = (perfil?.historialPuntos ?? []).slice();
  const histAsc = historial.slice().sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  let acum = 0;
  const serie = histAsc.map((h) => (acum += h.puntos));
  const fotosPosts = (postsQ.data ?? []).filter((p) => p.fotoUrl);
  const comunes = comunesQ.data;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}><ChevronLeft size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Perfil'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={perfilQ.isRefetching} onRefresh={() => perfilQ.refetch()} tintColor={colors.primary} />}
      >
        {perfilQ.isLoading ? (
          <View style={styles.head}>
            <Skeleton style={{ width: 96, height: 96, borderRadius: 48 }} />
            <Skeleton style={{ height: 22, width: 180, marginTop: spacing.md }} />
            <Skeleton style={{ height: 14, width: 110, marginTop: spacing.sm }} />
            <Skeleton style={{ height: 44, width: '70%', borderRadius: radius.lg, marginTop: spacing.lg }} />
          </View>
        ) : perfilQ.isError || !perfil ? (
          <View style={styles.centered}>
            <AlertCircle size={40} color={colors.gray500} />
            <Text style={styles.emptyTitle}>No pudimos cargar el perfil</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => perfilQ.refetch()} activeOpacity={0.85}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.head}>
              {perfil.fotoUrl ? (
                <Image source={{ uri: perfil.fotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{iniciales}</Text></View>
              )}
              <View style={styles.nameRow}>
                <Text style={styles.name}>{perfil.nombre} {perfil.apellido}</Text>
                {relacionQ.data?.teSigue ? <View style={styles.teSigue}><Text style={styles.teSigueText}>Te sigue</Text></View> : null}
              </View>
              {perfil.username ? <Text style={styles.username}>@{perfil.username}</Text> : null}

              <View style={styles.metaRow}>
                {perfil.categoria && <View style={styles.metaItem}><Shield size={14} color={colors.blue500} /><Text style={styles.metaText}>{perfil.categoria.nombre}</Text></View>}
                <View style={styles.metaItem}><MapPin size={14} color={colors.gray400} /><Text style={styles.metaText}>{perfil.ciudad || 'Sin ciudad'}</Text></View>
                {perfil.edad ? <View style={styles.metaItem}><Calendar size={14} color={colors.gray400} /><Text style={styles.metaText}>{perfil.edad} años</Text></View> : null}
              </View>

              {perfil.bio ? <Text style={styles.bio}>{perfil.bio}</Text> : null}

              {(perfil.instagram || perfil.facebook) ? (
                <View style={styles.redes}>
                  {perfil.instagram ? (
                    <TouchableOpacity style={styles.redChip} onPress={() => Linking.openURL(igUrl(perfil.instagram!))} activeOpacity={0.8}>
                      <AtSign size={15} color="#e1306c" /><Text style={styles.redText}>Instagram</Text>
                    </TouchableOpacity>
                  ) : null}
                  {perfil.facebook ? (
                    <TouchableOpacity style={styles.redChip} onPress={() => Linking.openURL(fbUrl(perfil.facebook!))} activeOpacity={0.8}>
                      <Link2 size={15} color="#3b82f6" /><Text style={styles.redText}>Facebook</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.counters}>
                <TouchableOpacity style={styles.counter} activeOpacity={0.7} onPress={() => verLista('seguidores')}>
                  <Text style={styles.counterValue}>{perfil.seguidores}</Text><Text style={styles.counterLabel}>Seguidores</Text>
                </TouchableOpacity>
                <View style={styles.counterDivider} />
                <TouchableOpacity style={styles.counter} activeOpacity={0.7} onPress={() => verLista('siguiendo')}>
                  <Text style={styles.counterValue}>{perfil.siguiendo}</Text><Text style={styles.counterLabel}>Siguiendo</Text>
                </TouchableOpacity>
                <View style={styles.counterDivider} />
                <View style={styles.counter}><Text style={styles.counterValue}>{perfil.stats.torneosJugados}</Text><Text style={styles.counterLabel}>Torneos</Text></View>
              </View>

              {!esMiPerfil && (
                <TouchableOpacity style={[styles.followBtn, siguiendo && styles.followingBtn]} onPress={toggleSeguir} disabled={accion || relacionQ.isLoading} activeOpacity={0.85}>
                  {accion ? <ActivityIndicator size="small" color={colors.white} />
                    : siguiendo ? <><UserCheck size={16} color={colors.white} /><Text style={styles.followText}>Siguiendo</Text></>
                    : <><UserPlus size={16} color={colors.white} /><Text style={styles.followText}>Seguir</Text></>}
                </TouchableOpacity>
              )}

              {!esMiPerfil && comunes && comunes.total > 0 ? (
                <View style={styles.comunes}>
                  <View style={styles.comunesAvs}>
                    {comunes.muestra.map((u, i) => (
                      <View key={u.id} style={i > 0 ? { marginLeft: -10 } : null}>
                        <MiniAvatar uri={u.fotoUrl} ini={`${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase()} size={24} ring={colors.background} />
                      </View>
                    ))}
                  </View>
                  <Text style={styles.comunesText} numberOfLines={2}>
                    Seguido por {comunes.muestra.map((u) => u.nombre).join(', ')}
                    {comunes.total > comunes.muestra.length ? ` y ${comunes.total - comunes.muestra.length} más` : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Stat cards */}
            <View style={styles.statsGrid}>
              <StatCard icon={<Trophy size={18} color={colors.amber500} />} value={perfil.stats.torneosGanados} label="Torneos ganados" />
              <StatCard icon={<Activity size={18} color={colors.blue500} />} value={perfil.partidos.jugados} label="Partidos jugados" />
              <StatCard icon={<Star size={18} color="#a78bfa" />} value={perfil.ranking[0]?.puntosTotales ?? 0} label="Puntos" />
              <StatCard icon={<Flame size={18} color={colors.primary} />} value={perfil.partidos.rachaActual} label="Racha actual" />
            </View>

            {/* Ranking + evolución */}
            {perfil.ranking.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}><TrendingUp size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Ranking</Text></View>
                <View style={styles.card}>
                  <Text style={styles.rankPos}>#{perfil.ranking[0].posicion}<Text style={styles.rankScope}>  {perfil.ranking[0].alcanceNombre || perfil.ranking[0].alcance}</Text></Text>
                  <View style={styles.rankRows}>
                    <View style={styles.rankRow}><Text style={styles.rankK}>Puntos</Text><Text style={styles.rankV}>{perfil.ranking[0].puntosTotales}</Text></View>
                    <View style={styles.rankRow}><Text style={styles.rankK}>Victorias</Text><Text style={styles.rankV}>{perfil.partidos.ganados}</Text></View>
                    <View style={styles.rankRow}><Text style={styles.rankK}>Torneos</Text><Text style={styles.rankV}>{perfil.ranking[0].torneosJugados}</Text></View>
                  </View>
                  {serie.length >= 2 ? (
                    <View style={styles.spark}>
                      <Text style={styles.sparkLabel}>Evolución de puntos</Text>
                      <Sparkline valores={serie} />
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* Efectividad */}
            <View style={styles.section}>
              <View style={styles.sectionHead}><Target size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Efectividad</Text></View>
              <View style={styles.efGrid}>
                <View style={styles.efBox}><Text style={[styles.efValue, { color: colors.green500 }]}>{perfil.partidos.efectividad}%</Text><Text style={styles.efLabel}>Victorias</Text></View>
                <View style={styles.efBox}><Text style={styles.efValue}>{perfil.partidos.ganados}</Text><Text style={styles.efLabel}>Ganados</Text></View>
                <View style={styles.efBox}><Text style={styles.efValue}>{perfil.partidos.perdidos}</Text><Text style={styles.efLabel}>Perdidos</Text></View>
              </View>
            </View>

            {/* Compañero / Rival */}
            {(crQ.data?.companero || crQ.data?.rival) ? (
              <View style={styles.section}>
                <View style={styles.sectionHead}><Swords size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Compañero y rival</Text></View>
                <View style={styles.crGrid}>
                  {crQ.data?.companero ? (
                    <TouchableOpacity style={styles.crBox} activeOpacity={0.8} onPress={() => router.push(`/jugador/${crQ.data!.companero!.jugador.id}`)}>
                      <View style={styles.crHead}><Handshake size={14} color={colors.green500} /><Text style={[styles.crTag, { color: colors.green500 }]}>Compañero ideal</Text></View>
                      <MiniAvatar uri={crQ.data.companero.jugador.fotoUrl} ini={`${crQ.data.companero.jugador.nombre?.[0] ?? ''}${crQ.data.companero.jugador.apellido?.[0] ?? ''}`.toUpperCase()} size={46} ring={colors.green500} />
                      <Text style={styles.crName} numberOfLines={1}>{crQ.data.companero.jugador.nombre} {crQ.data.companero.jugador.apellido}</Text>
                      <Text style={styles.crSub}>{crQ.data.companero.veces} {crQ.data.companero.veces === 1 ? 'torneo juntos' : 'torneos juntos'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {crQ.data?.rival ? (
                    <TouchableOpacity style={styles.crBox} activeOpacity={0.8} onPress={() => router.push(`/jugador/${crQ.data!.rival!.jugador.id}`)}>
                      <View style={styles.crHead}><Swords size={14} color={colors.primary} /><Text style={[styles.crTag, { color: '#ff8a8a' }]}>Rival más duro</Text></View>
                      <MiniAvatar uri={crQ.data.rival.jugador.fotoUrl} ini={`${crQ.data.rival.jugador.nombre?.[0] ?? ''}${crQ.data.rival.jugador.apellido?.[0] ?? ''}`.toUpperCase()} size={46} ring={colors.primary} />
                      <Text style={styles.crName} numberOfLines={1}>{crQ.data.rival.jugador.nombre} {crQ.data.rival.jugador.apellido}</Text>
                      <Text style={styles.crSub}>{crQ.data.rival.jugadas} {crQ.data.rival.jugadas === 1 ? 'enfrentamiento' : 'enfrentamientos'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Palmarés */}
            {historial.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}><Medal size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Palmarés</Text><Text style={styles.count}>{historial.length}</Text></View>
                <View style={{ gap: spacing.sm }}>
                  {historial.slice(0, 8).map((h, i) => {
                    const campeon = h.posicion === 'CAMPEON';
                    return (
                      <View key={`${h.torneo}-${i}`} style={styles.palmRow}>
                        <View style={[styles.palmIcon, { backgroundColor: campeon ? 'rgba(251,191,36,0.16)' : colors.dark100 }]}>
                          {campeon ? <Trophy size={16} color={GOLD} /> : <Medal size={16} color={colors.gray400} />}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.palmTorneo} numberOfLines={1}>{h.torneo}</Text>
                          <Text style={styles.palmSub} numberOfLines={1}>{posLabel(h.posicion)} · {h.categoria}{fmtMes(h.fecha) ? ` · ${fmtMes(h.fecha)}` : ''}</Text>
                        </View>
                        {h.puntos ? <Text style={styles.palmPts}>+{h.puntos}</Text> : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Publicaciones (grid) */}
            {fotosPosts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}><LayoutGrid size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Publicaciones</Text><Text style={styles.count}>{fotosPosts.length}</Text></View>
                <View style={styles.grid}>
                  {fotosPosts.map((p) => (
                    <TouchableOpacity key={p.id} style={styles.gridCell} activeOpacity={0.85} onPress={() => setPostSel(p)}>
                      <Image source={{ uri: p.fotoUrl! }} style={styles.gridImg} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Logros */}
            {perfil.logros.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}><Award size={18} color={colors.primary} /><Text style={styles.sectionTitle}>Logros</Text><Text style={styles.count}>{perfil.logros.length}</Text></View>
                <View style={{ gap: spacing.sm }}>
                  {perfil.logros.map((l) => (
                    <View key={l.id} style={styles.logro}>
                      <View style={[styles.logroIcon, { backgroundColor: `${NIVEL_COLOR[l.nivel]}22` }]}><Award size={18} color={NIVEL_COLOR[l.nivel]} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logroName} numberOfLines={1}>{l.nombre}</Text>
                        <Text style={styles.logroDesc} numberOfLines={1}>{l.descripcion}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <PostModal
        post={postSel}
        onClose={() => setPostSel(null)}
        onDeleted={(pid) => qc.setQueryData<PostJugador[]>(['posts-jugador', id], (prev) => (prev ?? []).filter((p) => p.id !== pid))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, color: colors.white, fontSize: 18, fontWeight: 'bold' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  retryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radius.lg },
  retryText: { color: colors.white, fontWeight: '700' },
  head: { alignItems: 'center', paddingHorizontal: spacing.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: colors.primary },
  avatarFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  name: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  teSigue: { backgroundColor: colors.dark200, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  teSigueText: { color: colors.gray400, fontSize: 11, fontWeight: '700' },
  username: { color: colors.gray500, fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.gray400, fontSize: 13 },
  bio: { color: colors.gray400, fontSize: 14, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  redes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  redChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  redText: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  counters: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.lg },
  counter: { alignItems: 'center' },
  counterValue: { color: colors.white, fontSize: 20, fontWeight: '800' },
  counterLabel: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  counterDivider: { width: 1, height: 28, backgroundColor: colors.border },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md - 2, paddingHorizontal: spacing.xl, marginTop: spacing.lg, minWidth: 160 },
  followingBtn: { backgroundColor: colors.dark200, borderWidth: 1, borderColor: colors.border },
  followText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  comunes: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: spacing.sm },
  comunesAvs: { flexDirection: 'row', alignItems: 'center' },
  comunesText: { flex: 1, color: colors.gray400, fontSize: 12, lineHeight: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md - 4, paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  statCard: { width: '47.5%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  statIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.dark100, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { color: colors.white, fontSize: 26, fontWeight: '800' },
  statLabel: { color: colors.gray400, fontSize: 12, marginTop: 2 },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  count: { color: colors.gray500, fontSize: 13, marginLeft: 'auto' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  rankPos: { color: colors.white, fontSize: 28, fontWeight: '800' },
  rankScope: { color: colors.gray400, fontSize: 14, fontWeight: '600' },
  rankRows: { marginTop: spacing.md, gap: spacing.sm },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rankK: { color: colors.gray400, fontSize: 14 },
  rankV: { color: colors.white, fontSize: 14, fontWeight: '600' },
  spark: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  sparkLabel: { color: colors.gray500, fontSize: 12, marginBottom: 6 },
  efGrid: { flexDirection: 'row', gap: spacing.md - 4 },
  efBox: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  efValue: { color: colors.white, fontSize: 22, fontWeight: '800' },
  efLabel: { color: colors.gray400, fontSize: 11, marginTop: 4 },
  crGrid: { flexDirection: 'row', gap: spacing.md - 4 },
  crBox: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 6 },
  crHead: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  crTag: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  crName: { color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  crSub: { color: colors.gray500, fontSize: 11 },
  palmRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md - 2 },
  palmIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  palmTorneo: { color: colors.white, fontSize: 14, fontWeight: '600' },
  palmSub: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  palmPts: { color: GOLD, fontSize: 13, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridCell: { width: '32.6%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.dark100 },
  gridImg: { width: '100%', height: '100%' },
  logro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md - 2 },
  logroIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logroName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  logroDesc: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  miniFb: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  miniIni: { color: colors.white, fontWeight: '800' },
  pmRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  pmClose: { position: 'absolute', top: 50, right: 20, zIndex: 2, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pmImg: { width: '100%', height: '70%' },
  pmFooter: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  pmCaption: { color: colors.white, fontSize: 14, lineHeight: 20 },
  pmBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pmLike: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pmLikeText: { color: colors.gray400, fontSize: 14, fontWeight: '600' },
  pmCount: { color: colors.gray400, fontSize: 14, fontWeight: '700' },
  pmDel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  pmDelText: { color: '#ff8a8a', fontSize: 14, fontWeight: '600' },
});
