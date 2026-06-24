import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Search, Check, X, Trophy, CheckCircle2,
  AlertCircle, AlertTriangle, UserPlus, Info, TrendingUp, Clock,
} from 'lucide-react-native';
import { torneoService, TorneoDetalle } from '../../src/services/torneoService';
import { inscripcionService, JugadorBusqueda, CategoriaPermitida, CategoriaCatalogo } from '../../src/services/inscripcionService';
import { authService } from '../../src/services/authService';
import { colors, spacing, radius } from '../../src/lib/theme';
import { formatCurrency } from '../../src/utils/currency';

const CODIGOS_PAIS = ['+595', '+54', '+55', '+598', '+56'];

// Avatar que muestra la foto del jugador si existe; si no, sus iniciales.
function Avatar({ uri, ini }: { uri?: string | null; ini: string }) {
  if (uri) return <Image source={{ uri }} style={avStyles.av} />;
  return <View style={[avStyles.av, avStyles.fallback]}><Text style={avStyles.text}>{ini}</Text></View>;
}

const avStyles = StyleSheet.create({
  av: { width: 40, height: 40, borderRadius: 20 },
  fallback: { backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontWeight: '800', fontSize: 14 },
});

const ELEVADO = '#161b26';

function StepCol({ n, label, step }: { n: number; label: string; step: number }) {
  const done = step > n;
  const active = step >= n;
  return (
    <View style={styles.stepCol}>
      <View style={[styles.stepCircle, active && styles.stepCircleOn]}>
        {done ? <Check size={15} color={colors.white} /> : <Text style={[styles.stepNum, active && styles.stepNumOn]}>{n}</Text>}
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelOn]}>{label}</Text>
    </View>
  );
}

export default function Inscribirse() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [torneo, setTorneo] = useState<TorneoDetalle | null>(null);
  const [user, setUser] = useState<any>(null);
  const [catalogo, setCatalogo] = useState<CategoriaCatalogo[]>([]);

  const [step, setStep] = useState(1);
  const [jugador2, setJugador2] = useState<JugadorBusqueda | null>(null);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<JugadorBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [formNuevo, setFormNuevo] = useState(false);
  const [esInvitacion, setEsInvitacion] = useState(false);
  const [codigoPais, setCodigoPais] = useState('+595');
  const [j2nr, setJ2nr] = useState({ nombre: '', apellido: '', documento: '', telefono: '', email: '' });

  const [permitidos, setPermitidos] = useState<Record<string, { permitido: boolean; motivo?: string }>>({});
  const [categoriaSel, setCategoriaSel] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Just-in-time
  const [datos, setDatos] = useState({ documento: '', genero: '' as '' | 'MASCULINO' | 'FEMENINO', categoria: '' });
  const [guardando, setGuardando] = useState(false);

  // Cargar torneo + perfil + catálogo
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const [t, me, cat] = await Promise.all([
          torneoService.getTorneoBySlug(slug),
          authService.getMe().then((r) => r.user).catch(() => null),
          inscripcionService.getCategoriasCatalogo().catch(() => []),
        ]);
        setTorneo(t);
        setUser(me);
        setCatalogo(cat);
      } catch {
        setError('No pudimos cargar el torneo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Categorías permitidas (regla del back), recarga al cambiar pareja
  useEffect(() => {
    if (!torneo) return;
    inscripcionService
      .getCategoriasPermitidas(torneo.id, jugador2?.id)
      .then((cats) => {
        const map: Record<string, { permitido: boolean; motivo?: string }> = {};
        for (const c of cats) map[c.id] = { permitido: c.permitido, motivo: c.motivo };
        setPermitidos(map);
      })
      .catch(() => setPermitidos({}));
  }, [torneo, jugador2]);

  const categoriasFiltradas = useMemo(() => {
    if (!torneo) return [];
    return (torneo.categorias || []).filter((c) => c.inscripcionAbierta).sort((a, b) => a.orden - b.orden);
  }, [torneo]);

  // Nivel del jugador (orden). Menor orden = categoría superior.
  const playerOrden = useMemo<number | null>(() => {
    const c = user?.categoria;
    if (!c) return null;
    const enCatalogo = catalogo.find((x) => x.id === c.id)?.orden;
    return typeof enCatalogo === 'number' ? enCatalogo : (typeof c.orden === 'number' ? c.orden : null);
  }, [user, catalogo]);

  const buscar = async () => {
    if (!query.trim()) return;
    setBuscando(true);
    setFormNuevo(false);
    try {
      const res = await inscripcionService.buscarPareja(query.trim());
      setResultados(res);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
      setBuscado(true);
    }
  };

  const guardarDatos = async () => {
    const payload: any = {};
    if (!user?.documento) payload.documento = datos.documento.trim();
    if (!user?.genero) payload.genero = datos.genero;
    if (!user?.categoria) payload.categoria = datos.categoria;
    setGuardando(true);
    setError('');
    try {
      const r = await inscripcionService.completarDatos(payload);
      if (r?.datosCompletos) {
        const me = await authService.getMe().then((x) => x.user);
        setUser(me);
      } else {
        setError('Completá todos los campos para continuar.');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudieron guardar los datos.');
    } finally {
      setGuardando(false);
    }
  };

  const crear = async () => {
    if (!torneo || !categoriaSel) return;
    setSubmitting(true);
    setError('');
    try {
      const payload: any = { tournamentId: torneo.id, categoryId: categoriaSel, modoPago: 'COMPLETO' };
      if (jugador2) payload.jugador2Id = jugador2.id;
      else payload.jugador2NoRegistrado = { ...j2nr, telefono: codigoPais + j2nr.telefono };
      const r = await inscripcionService.crear(payload);
      setEsInvitacion(!!r?.inscripcion?.requiereInvitacion);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo crear la inscripción.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Estados de pantalla ───────────────────────────────
  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (!torneo) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertCircle size={40} color={colors.gray500} />
        <Text style={styles.emptyTitle}>No pudimos cargar el torneo</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Volver</Text></TouchableOpacity>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={[styles.successIcon, esInvitacion && styles.successIconReserva]}>
          {esInvitacion ? <Clock size={46} color={colors.amber500} /> : <CheckCircle2 size={48} color={colors.green500} />}
        </View>
        <Text style={styles.successTitle}>{esInvitacion ? '¡Lugar reservado!' : '¡Inscripción confirmada!'}</Text>
        <Text style={styles.successText}>
          {esInvitacion
            ? `Le enviamos una invitación a ${j2nr.nombre || 'tu compañero/a'} por email. Tu lugar en ${torneo.nombre} queda reservado y se confirma cuando se sume y acepte.`
            : `Tu lugar en ${torneo.nombre} quedó reservado. ¡Nos vemos en la cancha!`}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Just-in-time: perfil incompleto
  const perfilIncompleto = !!user && !(user.documento && user.genero && user.categoria);
  const generoEfectivo = (user?.genero || datos.genero) as '' | 'MASCULINO' | 'FEMENINO';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}><ChevronLeft size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Inscribirme</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        {perfilIncompleto ? (
          // ─── Completá tus datos ───
          <View>
            <Text style={styles.h1}>Completá tus datos</Text>
            <Text style={styles.sub}>Una sola vez, para poder inscribirte a torneos.</Text>

            {!user.documento && (
              <>
                <Text style={styles.label}>Documento / Cédula</Text>
                <TextInput
                  style={styles.input}
                  value={datos.documento}
                  onChangeText={(v) => setDatos((p) => ({ ...p, documento: v.replace(/\D/g, '') }))}
                  placeholder="Solo números"
                  placeholderTextColor={colors.gray500}
                  keyboardType="number-pad"
                />
              </>
            )}

            {!user.genero && (
              <>
                <Text style={styles.label}>Género</Text>
                <View style={styles.row}>
                  {(['MASCULINO', 'FEMENINO'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.choice, datos.genero === g && styles.choiceOn]}
                      onPress={() => setDatos((p) => ({ ...p, genero: g, categoria: '' }))}
                    >
                      <Text style={[styles.choiceText, datos.genero === g && styles.choiceTextOn]}>
                        {g === 'MASCULINO' ? 'Masculino' : 'Femenino'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {!user.categoria && (
              <>
                <Text style={styles.label}>Tu categoría</Text>
                <View style={styles.chipsWrap}>
                  {catalogo.filter((c) => c.tipo === generoEfectivo).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, datos.categoria === c.nombre && styles.chipOn]}
                      onPress={() => setDatos((p) => ({ ...p, categoria: c.nombre }))}
                    >
                      <Text style={[styles.chipText, datos.categoria === c.nombre && styles.chipTextOn]}>{c.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {!generoEfectivo && <Text style={styles.hint}>Elegí tu género primero.</Text>}
                <Text style={styles.hint}>Si recién empezás, elegí la más baja. Ascendés ganando torneos.</Text>
              </>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={guardarDatos} disabled={guardando} activeOpacity={0.85}>
              {guardando ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Guardar y continuar</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          // ─── Wizard 3 pasos ───
          <View>
            {/* Indicador de pasos */}
            <View style={styles.stepsRow}>
              <StepCol n={1} label="Pareja" step={step} />
              <View style={[styles.stepLine, step > 1 && styles.stepLineOn]} />
              <StepCol n={2} label="Categoría" step={step} />
              <View style={[styles.stepLine, step > 2 && styles.stepLineOn]} />
              <StepCol n={3} label="Confirmar" step={step} />
            </View>

            {step === 1 && (
              <View>
                {/* Jugador 1 (vos) */}
                <View style={styles.playerCard}>
                  <Avatar uri={user?.fotoUrl} ini={`${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{user?.nombre} {user?.apellido}</Text>
                    <Text style={styles.playerMeta}>{user?.categoria?.nombre || 'Vos'}</Text>
                  </View>
                  <CheckCircle2 size={18} color={colors.green500} />
                </View>

                <Text style={styles.label}>Jugador 2 (tu pareja)</Text>

                {jugador2 ? (
                  <View style={[styles.playerCard, { borderColor: colors.green500 }]}>
                    <Avatar uri={jugador2.fotoUrl} ini={`${jugador2.nombre[0]}${jugador2.apellido[0]}`} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>{jugador2.nombre} {jugador2.apellido}</Text>
                      <Text style={styles.playerMeta}>{jugador2.categoria?.nombre || 'Sin categoría'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setJugador2(null)} hitSlop={8}><X size={18} color={colors.gray400} /></TouchableOpacity>
                  </View>
                ) : !formNuevo ? (
                  <>
                    <Text style={styles.hint}>Buscá a tu compañero/a por nombre o cédula.</Text>
                    <View style={[styles.searchRow, styles.mt8]}>
                      <View style={styles.searchBox}>
                        <Search size={16} color={colors.gray500} />
                        <TextInput
                          style={styles.searchInput}
                          value={query}
                          onChangeText={setQuery}
                          placeholder="Nombre, apellido o documento"
                          placeholderTextColor={colors.gray500}
                          onSubmitEditing={buscar}
                          returnKeyType="search"
                        />
                      </View>
                      <TouchableOpacity style={styles.searchBtn} onPress={buscar} disabled={buscando || !query.trim()}>
                        {buscando ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.searchBtnText}>Buscar</Text>}
                      </TouchableOpacity>
                    </View>

                    {resultados.map((j) => (
                      <TouchableOpacity key={j.id} style={styles.resultRow} onPress={() => { setJugador2(j); setFormNuevo(false); }}>
                        <Avatar uri={j.fotoUrl} ini={`${j.nombre[0]}${j.apellido[0]}`} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.playerName}>{j.nombre} {j.apellido}</Text>
                          <Text style={styles.playerMeta}>{j.documento} · {j.categoria?.nombre || 'Sin categoría'}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {/* Invitar SOLO aparece tras una búsqueda sin resultados (contextual) */}
                    {buscado && !buscando && resultados.length === 0 && (
                      <View style={styles.noResult}>
                        <Text style={styles.noResultTitle}>No encontramos a nadie con esos datos</Text>
                        <Text style={styles.noResultText}>¿Tu compañero/a todavía no está en FairPadel? Invitalo/a y le llega un aviso para sumarse.</Text>
                        <TouchableOpacity style={styles.inviteBtn} onPress={() => setFormNuevo(true)}>
                          <UserPlus size={16} color={colors.gray400} />
                          <Text style={styles.inviteText}>Invitar a {query.trim() || 'tu compañero/a'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Si hubo resultados pero ninguno es, ofrecer invitar de forma discreta */}
                    {resultados.length > 0 && (
                      <TouchableOpacity style={styles.subtleLink} onPress={() => setFormNuevo(true)}>
                        <Text style={styles.subtleLinkText}>¿No es ninguno? Invitá a alguien que no tiene cuenta</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View style={styles.inviteForm}>
                    <View style={styles.inviteHead}><Info size={13} color={colors.gray400} /><Text style={styles.inviteHeadText}>Invitar a tu compañero/a</Text></View>
                    <Text style={styles.inviteNote}>Le enviamos una invitación por email. Tu lugar queda <Text style={styles.inviteNoteStrong}>reservado</Text> y se confirma cuando se sume y acepte.</Text>
                    <TouchableOpacity style={styles.inviteBack} onPress={() => { setFormNuevo(false); }}>
                      <ChevronLeft size={14} color={colors.gray400} /><Text style={styles.link}>Volver a buscar</Text>
                    </TouchableOpacity>
                    <View style={styles.row}>
                      <TextInput style={[styles.input, styles.half]} value={j2nr.nombre} onChangeText={(v) => setJ2nr((p) => ({ ...p, nombre: v }))} placeholder="Nombre" placeholderTextColor={colors.gray500} />
                      <TextInput style={[styles.input, styles.half]} value={j2nr.apellido} onChangeText={(v) => setJ2nr((p) => ({ ...p, apellido: v }))} placeholder="Apellido" placeholderTextColor={colors.gray500} />
                    </View>
                    <TextInput style={[styles.input, styles.mt8]} value={j2nr.documento} onChangeText={(v) => setJ2nr((p) => ({ ...p, documento: v.replace(/\D/g, '') }))} placeholder="Documento" placeholderTextColor={colors.gray500} keyboardType="number-pad" />
                    <View style={[styles.row, styles.mt8]}>
                      <View style={styles.codeWrap}>
                        {CODIGOS_PAIS.map((c) => (
                          <TouchableOpacity key={c} style={[styles.codePill, codigoPais === c && styles.codePillOn]} onPress={() => setCodigoPais(c)}>
                            <Text style={[styles.codeText, codigoPais === c && styles.codeTextOn]}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <TextInput style={[styles.input, styles.mt8]} value={j2nr.telefono} onChangeText={(v) => setJ2nr((p) => ({ ...p, telefono: v }))} placeholder="Teléfono" placeholderTextColor={colors.gray500} keyboardType="phone-pad" />
                    <TextInput style={[styles.input, styles.mt8]} value={j2nr.email} onChangeText={(v) => setJ2nr((p) => ({ ...p, email: v }))} placeholder="Email" placeholderTextColor={colors.gray500} autoCapitalize="none" keyboardType="email-address" />
                  </View>
                )}
              </View>
            )}

            {step === 2 && (
              <View>
                {/* Banner motivador */}
                <View style={styles.banner}>
                  <TrendingUp size={16} color={colors.primary} />
                  <Text style={styles.bannerText}>
                    Podés jugar en tu categoría o animarte a una superior. ¡Subir de nivel se logra compitiendo!
                  </Text>
                </View>

                <Text style={styles.label}>Categorías del torneo</Text>
                {categoriasFiltradas.length === 0 && (
                  <View style={styles.emptyCard}><Text style={styles.playerMeta}>No hay categorías abiertas en este torneo.</Text></View>
                )}
                {categoriasFiltradas.map((cat) => {
                  const info = permitidos[cat.id];
                  const permitido = info?.permitido !== false;
                  const sel = categoriaSel === cat.id;
                  const esSuperior = playerOrden != null && cat.orden < playerOrden;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catRow, sel && styles.catRowOn, !permitido && styles.catRowOff]}
                      disabled={!permitido}
                      onPress={() => setCategoriaSel(cat.id)}
                      activeOpacity={0.85}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.catTitleRow}>
                          <Text style={styles.playerName}>{cat.nombre}</Text>
                          <Text style={styles.playerMeta}>{cat.tipo === 'FEMENINO' ? 'Damas' : 'Caballeros'}</Text>
                        </View>

                        {permitido ? (
                          <View style={[styles.statusBadge, styles.badgeGreen]}>
                            <CheckCircle2 size={13} color="#34d399" />
                            <Text style={styles.badgeGreenText}>
                              {esSuperior ? 'Podés inscribirte · ¡buen desafío, subís de nivel!' : 'Podés inscribirte'}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, styles.badgeYellow]}>
                            <AlertTriangle size={13} color={colors.amber500} />
                            <Text style={styles.badgeYellowText}>{info?.motivo || 'No disponible para tu categoría'}</Text>
                          </View>
                        )}
                      </View>
                      {sel && <CheckCircle2 size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {step === 3 && (
              <View>
                <View style={styles.summary}>
                  <View style={styles.summaryHead}>
                    {torneo.flyerUrl ? <Image source={{ uri: torneo.flyerUrl }} style={styles.summaryFlyer} /> : <View style={[styles.summaryFlyer, styles.summaryFlyerPh]}><Trophy size={20} color={colors.dark300} /></View>}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName} numberOfLines={1}>{torneo.nombre}</Text>
                      <Text style={styles.playerMeta}>{torneo.ciudad}</Text>
                    </View>
                    <Text style={styles.price}>{formatCurrency(Number(torneo.costoInscripcion))}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}><Text style={styles.playerMeta}>Jugador 1</Text><Text style={styles.summaryVal}>{user?.nombre} {user?.apellido}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.playerMeta}>Jugador 2</Text><Text style={styles.summaryVal}>{jugador2 ? `${jugador2.nombre} ${jugador2.apellido}` : `${j2nr.nombre} ${j2nr.apellido}`}</Text></View>
                  </View>
                  <View style={styles.summaryDivider} />
                  <Text style={styles.playerMeta}>Categoría</Text>
                  <Text style={styles.summaryVal}>{categoriasFiltradas.find((c) => c.id === categoriaSel)?.nombre}</Text>
                </View>

                <TouchableOpacity style={styles.consent} onPress={() => setConsent((c) => !c)} activeOpacity={0.8}>
                  <View style={[styles.checkbox, consent && styles.checkboxOn]}>{consent && <Check size={14} color={colors.white} />}</View>
                  <Text style={styles.consentText}>Confirmo que mi compañero/a me dio su consentimiento para inscribirlo/a. Ambos aceptamos las normativas de FairPadel.</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Barra de navegación inferior del wizard */}
      {!perfilIncompleto && !success && (
        <View style={[styles.navBar, { paddingBottom: insets.bottom || spacing.md }]}>
          <TouchableOpacity style={[styles.navBackBtn, step === 1 && styles.navDisabled]} onPress={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} activeOpacity={0.8}>
            <Text style={styles.navBackText}>Anterior</Text>
          </TouchableOpacity>
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.navNext, !canProceed(step, jugador2, formNuevo, j2nr, categoriaSel) && styles.navNextOff]}
              disabled={!canProceed(step, jugador2, formNuevo, j2nr, categoriaSel)}
              onPress={() => setStep((s) => s + 1)}
            >
              <Text style={styles.navNextText}>Siguiente</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navNext, (!consent || submitting) && styles.navNextOff]}
              disabled={!consent || submitting}
              onPress={crear}
            >
              {submitting ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.navNextText}>Confirmar inscripción</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function canProceed(step: number, jugador2: any, formNuevo: boolean, j2nr: any, categoriaSel: string): boolean {
  if (step === 1) {
    if (jugador2) return true;
    return formNuevo && !!j2nr.nombre && !!j2nr.apellido && !!j2nr.documento && !!j2nr.email;
  }
  if (step === 2) return !!categoriaSel;
  return true;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  h1: { color: colors.white, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.gray400, fontSize: 14, marginTop: 4, marginBottom: spacing.md },
  label: { color: colors.gray400, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2, color: colors.white, fontSize: 15,
  },
  half: { flex: 1 },
  mt8: { marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  hint: { color: colors.gray500, fontSize: 12, marginTop: 6 },
  choice: { flex: 1, paddingVertical: spacing.md - 2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  choiceOn: { borderColor: colors.primary, backgroundColor: 'rgba(223,37,49,0.12)' },
  choiceText: { color: colors.gray400, fontWeight: '600' },
  choiceTextOn: { color: colors.white },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipOn: { borderColor: colors.primary, backgroundColor: 'rgba(223,37,49,0.12)' },
  chipText: { color: colors.gray400, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.white },
  // Steps (numerado con conectores)
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, paddingHorizontal: 4 },
  stepCol: { alignItems: 'center', gap: 5, width: 72 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: ELEVADO, borderWidth: 1, borderColor: '#2f3947', alignItems: 'center', justifyContent: 'center' },
  stepCircleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNum: { color: colors.gray500, fontSize: 13, fontWeight: '700' },
  stepNumOn: { color: colors.white },
  stepLabel: { color: colors.gray500, fontSize: 11 },
  stepLabelOn: { color: colors.white, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#22303f', marginBottom: 18 },
  stepLineOn: { backgroundColor: colors.primary },
  // Player cards
  playerCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4,
    backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  avatarSm: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.dark200, alignItems: 'center', justifyContent: 'center' },
  avatarSmText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  playerName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  playerMeta: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, height: 46 },
  searchInput: { flex: 1, color: colors.white, fontSize: 14, paddingVertical: 0 },
  searchBtn: { backgroundColor: colors.dark200, borderRadius: radius.lg, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  searchBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, padding: spacing.sm + 2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginTop: spacing.md },
  inviteText: { color: colors.gray400, fontSize: 14, fontWeight: '600' },
  inviteForm: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  inviteHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  inviteHeadText: { color: colors.gray400, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  inviteNote: { color: colors.gray400, fontSize: 12, lineHeight: 17, marginTop: 8 },
  inviteNoteStrong: { color: colors.amber500, fontWeight: '700' },
  inviteBack: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.sm, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  noResult: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, alignItems: 'center' },
  noResultTitle: { color: colors.white, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  noResultText: { color: colors.gray400, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 4, marginBottom: spacing.md },
  subtleLink: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
  subtleLinkText: { color: colors.gray400, fontSize: 13, textDecorationLine: 'underline' },
  codeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  codePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  codePillOn: { borderColor: colors.primary, backgroundColor: 'rgba(223,37,49,0.12)' },
  codeText: { color: colors.gray400, fontSize: 12, fontWeight: '700' },
  codeTextOn: { color: colors.white },
  textLink: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  // Categorías
  emptyCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  catRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOpacity: 0.32, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  catRowOn: { borderColor: colors.primary, backgroundColor: 'rgba(223,37,49,0.10)' },
  catRowOff: { opacity: 0.7 },
  catTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(223,37,49,0.10)', borderWidth: 1, borderColor: 'rgba(223,37,49,0.25)',
    borderRadius: radius.lg, padding: spacing.md - 2, marginBottom: spacing.md,
  },
  bannerText: { flex: 1, color: colors.gray400, fontSize: 12, lineHeight: 17 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.14)' },
  badgeGreenText: { color: '#34d399', fontSize: 11, fontWeight: '700', flexShrink: 1 },
  badgeYellow: { backgroundColor: 'rgba(245,158,11,0.14)' },
  badgeYellowText: { color: colors.amber500, fontSize: 11, fontWeight: '600', flexShrink: 1 },
  // Summary
  summary: {
    backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4 },
  summaryFlyer: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.dark100 },
  summaryFlyerPh: { alignItems: 'center', justifyContent: 'center' },
  price: { color: colors.white, fontSize: 16, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  summaryVal: { color: colors.white, fontSize: 14, fontWeight: '600', marginTop: 2 },
  consent: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, marginTop: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.gray500, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentText: { flex: 1, color: colors.gray400, fontSize: 12, lineHeight: 18 },
  // Nav bar
  navBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#11151d',
  },
  navBackBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md - 1, borderRadius: 14, backgroundColor: ELEVADO, borderWidth: 1, borderColor: colors.border },
  navBackText: { color: colors.gray400, fontSize: 15, fontWeight: '600' },
  navDisabled: { opacity: 0.4 },
  navNext: { flex: 2, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: spacing.md - 1, alignItems: 'center' },
  navNextOff: { opacity: 0.4 },
  navNextText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  // Misc
  errorBox: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: colors.red500, borderRadius: radius.md, padding: spacing.md - 2, marginBottom: spacing.md },
  errorText: { color: '#fca5a5', fontSize: 14 },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  successIconReserva: { backgroundColor: 'rgba(245,158,11,0.15)' },
  successTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginBottom: spacing.sm },
  successText: { color: colors.gray400, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
