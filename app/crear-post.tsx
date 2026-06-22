import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, ImagePlus, X } from 'lucide-react-native';
import { postService } from '../src/services/postService';
import { colors, spacing, radius } from '../src/lib/theme';

export default function CrearPostScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [texto, setTexto] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  const elegirFoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled && res.assets?.[0]?.uri) setFotoUri(res.assets[0].uri);
  };

  const puedePublicar = (texto.trim().length > 0 || !!fotoUri) && !publicando;

  const publicar = async () => {
    if (!puedePublicar) return;
    setPublicando(true);
    try {
      let fotoUrl: string | undefined;
      let fotoPublicId: string | undefined;
      if (fotoUri) {
        const subida = await postService.subirFoto(fotoUri);
        fotoUrl = subida.url;
        fotoPublicId = subida.publicId;
      }
      await postService.crear({ texto: texto.trim() || undefined, fotoUrl, fotoPublicId });
      qc.invalidateQueries({ queryKey: ['feed'] });
      router.back();
    } catch (e: any) {
      Alert.alert('No se pudo publicar', e?.response?.data?.message || 'Intentá de nuevo.');
      setPublicando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Nueva publicación</Text>
        <TouchableOpacity
          style={[styles.publishBtn, !puedePublicar && styles.publishBtnOff]}
          onPress={publicar}
          disabled={!puedePublicar}
          activeOpacity={0.85}
        >
          {publicando ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.publishText}>Publicar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          placeholder="¿Qué está pasando en tu pádel?"
          placeholderTextColor={colors.gray500}
          value={texto}
          onChangeText={setTexto}
          multiline
          maxLength={500}
          autoFocus
        />

        {fotoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: fotoUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeFoto} onPress={() => setFotoUri(null)} hitSlop={8}>
              <X size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addFoto} onPress={elegirFoto} activeOpacity={0.8}>
            <ImagePlus size={22} color={colors.primary} />
            <Text style={styles.addFotoText}>Agregar una foto</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.white, fontSize: 18, fontWeight: 'bold' },
  publishBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minWidth: 90, alignItems: 'center' },
  publishBtnOff: { opacity: 0.4 },
  publishText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  body: { padding: spacing.lg, gap: spacing.lg },
  input: { color: colors.white, fontSize: 17, lineHeight: 24, minHeight: 100, textAlignVertical: 'top' },
  addFoto: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: radius.lg, paddingVertical: spacing.lg,
  },
  addFotoText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  previewWrap: { position: 'relative', borderRadius: radius.lg, overflow: 'hidden' },
  preview: { width: '100%', height: 260, backgroundColor: colors.dark100 },
  removeFoto: {
    position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
});
