import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, ChevronRight, X, Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { torneoService, Campeon } from '../../src/services/torneoService';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { formatDatePYShort } from '../../src/utils/date';
import { colors, spacing, radius } from '../../src/lib/theme';

const GOLD = '#fbbf24';

type Jug = { id?: string; nombre: string; apellido: string; fotoUrl?: string | null };

function Avatar({ j, size = 78, overlap = false }: { j?: Jug | null; size?: number; overlap?: boolean }) {
  const ini = j ? `${j.nombre?.[0] ?? ''}${j.apellido?.[0] ?? ''}`.toUpperCase() : '?';
  const ring = size >= 70 ? 3 : 2.5;
  const base = {
    width: size, height: size, borderRadius: size / 2, borderWidth: ring, borderColor: GOLD,
    ...(overlap ? { marginLeft: -14 } : null),
  };
  return j?.fotoUrl ? (
    <Image source={{ uri: j.fotoUrl }} style={base} />
  ) : (
    <View style={[base, styles.avFallback]}><Text style={[styles.avIni, { fontSize: size >= 70 ? 22 : 14 }]}>{ini}</Text></View>
  );
}

export default function CampeonesScreen() {
  const insets = useSafeAreaInsets();
  const { id, nombre, fechaInicio, fechaFin } = useLocalSearchParams<{ id: string; nombre?: string; fechaInicio?: string; fechaFin?: string }>();
  const { user } = useAuth();
  const [sel, setSel] = useState<Campeon | null>(null);
  const cardRef = useRef<View>(null);

  const q = useQuery({
    queryKey: ['torneo-campeones', id],
    queryFn: () => torneoService.getCampeones(id),
    enabled: !!id,
  });

  const anio = (fechaInicio || fechaFin || '').slice(0, 4);
  const fechas = fechaInicio && fechaFin
    ? (fechaInicio === fechaFin ? formatDatePYShort(fechaInicio, true) : `${formatDatePYShort(fechaInicio)} – ${formatDatePYShort(fechaFin, true)}`)
    : '';

  const soyCampeon = (c: Campeon | null) => {
    if (!c || !user?.id) return false;
    return c.campeon.jugador1?.id === user.id || c.campeon.jugador2?.id === user.id;
  };

  const compartir = async () => {
    if (!sel) return;
    const j1 = sel.campeon.jugador1;
    const j2 = sel.campeon.jugador2;
    const texto = `¡Campeones ${sel.categoriaNombre} en ${nombre || 'el torneo'}! ${[j1, j2].filter(Boolean).map((j) => `${j!.nombre} ${j!.apellido}`).join(' y ')} 🏆 — vía FairPadel`;
    try {
      // view-shot es nativo (no existe en Expo Go) -> carga diferida + fallback a texto.
      const ViewShot = require('react-native-view-shot');
      const uri = await ViewShot.captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir campeones' });
        return;
      }
      throw new Error('sharing no disponible');
    } catch {
      try { await Share.share({ message: texto }); } catch { /* cancelado */ }
    }
  };

  const total = q.data?.length ?? 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Campeones</Text>
          {nombre ? <Text style={styles.sub} numberOfLines={1}>{nombre}</Text> : null}
        </View>
      </View>

      {q.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : total === 0 ? (
        <View style={styles.empty}>
          <Trophy size={40} color={colors.gray500} />
          <Text style={styles.emptyText}>Todavía no hay campeones cargados.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
          {/* Hero dorado */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Trophy size={24} color={GOLD} /></View>
            <View>
              <Text style={styles.heroNum}>{total}</Text>
              <Text style={styles.heroLabel}>{total === 1 ? 'categoría coronada' : 'categorías coronadas'}</Text>
            </View>
          </View>

          <Text style={styles.seccion}>PALMARÉS</Text>

          {q.data!.map((c) => (
            <TouchableOpacity key={c.categoriaId} style={styles.row} activeOpacity={0.8} onPress={() => setSel(c)}>
              <View style={styles.rowAvs}>
                <Avatar j={c.campeon.jugador1} size={42} />
                {c.campeon.jugador2 ? <Avatar j={c.campeon.jugador2} size={42} overlap /> : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowCat}>{c.categoriaNombre}</Text>
                <Text style={styles.rowNombres} numberOfLines={1}>
                  {[c.campeon.jugador1, c.campeon.jugador2].filter(Boolean).map((j) => `${j!.nombre} ${j!.apellido}`).join(' / ')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.gray500} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Card a pantalla completa */}
      {sel && (
        <View style={styles.overlay}>
          <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 8 }]} onPress={() => setSel(null)} activeOpacity={0.8}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>

          <View ref={cardRef} collapsable={false} style={styles.card}>
            {/* confeti */}
            <View style={[styles.confeti, { top: 40, left: 36, backgroundColor: '#f59e0b' }]} />
            <View style={[styles.confeti, { top: 70, right: 50, backgroundColor: '#df2531' }]} />
            <View style={[styles.confeti, { top: 130, left: 64, backgroundColor: '#60a5fa' }]} />
            <View style={[styles.confeti, { top: 100, right: 30, backgroundColor: '#fbbf24' }]} />
            <View style={[styles.confeti, { bottom: 150, left: 44, backgroundColor: '#34d399' }]} />
            <View style={[styles.confeti, { bottom: 110, right: 64, backgroundColor: '#f59e0b' }]} />

            <View style={styles.trofeoHalo}><Trophy size={46} color={GOLD} /></View>
            <Text style={styles.campeonesTxt}>CAMPEONES</Text>

            <View style={styles.parejaWrap}>
              <View style={styles.jugBox}>
                <Avatar j={sel.campeon.jugador1} />
                <Text style={styles.jugNombre}>{sel.campeon.jugador1 ? `${sel.campeon.jugador1.nombre}\n${sel.campeon.jugador1.apellido}` : ''}</Text>
              </View>
              {sel.campeon.jugador2 && (
                <View style={styles.jugBox}>
                  <Avatar j={sel.campeon.jugador2} />
                  <Text style={styles.jugNombre}>{`${sel.campeon.jugador2.nombre}\n${sel.campeon.jugador2.apellido}`}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <Text style={styles.catTxt}>{(sel.categoriaNombre || '').toUpperCase()}</Text>
            {nombre ? <Text style={styles.torneoTxt}>{nombre}</Text> : null}
            {fechas ? <Text style={styles.fechaTxt}>{fechas}</Text> : null}
            {anio ? <Text style={styles.fechaTxt}>{anio}</Text> : null}

            <View style={styles.fp}>
              <View style={styles.fpLogo}><Text style={styles.fpLogoTxt}>FP</Text></View>
              <Text style={styles.fpTxt}>FairPadel</Text>
            </View>
          </View>

          {soyCampeon(sel) && (
            <TouchableOpacity style={styles.shareBtn} onPress={compartir} activeOpacity={0.85}>
              <Share2 size={18} color="#3a2c00" />
              <Text style={styles.shareTxt}>Compartir</Text>
            </TouchableOpacity>
          )}
        </View>
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
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: 60 },
  emptyText: { color: colors.gray400, fontSize: 14 },
  // Hero dorado
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: 'rgba(251,191,36,0.10)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.28)',
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg,
  },
  heroIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(251,191,36,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroNum: { color: GOLD, fontSize: 24, fontWeight: '800', lineHeight: 26 },
  heroLabel: { color: '#d6b25e', fontSize: 12, marginTop: 2 },
  seccion: { color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm, marginLeft: 2 },
  // Filas-tarjeta con profundidad
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#161b26', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md - 2,
    shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  rowAvs: { flexDirection: 'row', alignItems: 'center' },
  rowCat: { color: colors.white, fontSize: 15, fontWeight: '700' },
  rowNombres: { color: colors.gray400, fontSize: 12, marginTop: 2 },
  // Overlay card
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  closeBtn: { position: 'absolute', right: spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.background, borderRadius: radius.xl, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, alignItems: 'center', overflow: 'hidden' },
  confeti: { position: 'absolute', width: 8, height: 8, borderRadius: 1 },
  trofeoHalo: { width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(251,191,36,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  campeonesTxt: { fontSize: 30, fontWeight: '800', color: GOLD, letterSpacing: 2, marginTop: 6 },
  parejaWrap: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  jugBox: { alignItems: 'center' },
  jugNombre: { color: colors.white, fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  avFallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  avIni: { color: colors.white, fontWeight: '700' },
  divider: { width: 60, height: 1, backgroundColor: 'rgba(251,191,36,0.4)', marginTop: spacing.lg, marginBottom: spacing.sm },
  catTxt: { fontSize: 17, fontWeight: '800', color: GOLD, letterSpacing: 1, marginTop: spacing.sm },
  torneoTxt: { fontSize: 15, color: colors.white, fontWeight: '500', marginTop: 10 },
  fechaTxt: { fontSize: 13, color: colors.gray400, marginTop: 3 },
  fp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, opacity: 0.75 },
  fpLogo: { width: 22, height: 22, borderRadius: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  fpLogoTxt: { color: colors.white, fontSize: 10, fontWeight: '800' },
  fpTxt: { color: colors.gray500, fontSize: 11 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: GOLD, paddingVertical: 11, paddingHorizontal: 24, borderRadius: radius.md, marginTop: spacing.lg },
  shareTxt: { color: '#3a2c00', fontSize: 14, fontWeight: '700' },
});
