import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { colors, spacing, radius } from '../../src/lib/theme';

export default function PerfilTab() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {user?.fotoUrl ? (
            <Image source={{ uri: user.fotoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarEmoji}>👤</Text>
          )}
        </View>
        <Text style={styles.name}>{user?.nombre} {user?.apellido}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}30` }]}>
            <Text style={styles.iconEmoji}>🛡️</Text>
          </View>
          <View>
            <Text style={styles.label}>Documento</Text>
            <Text style={styles.value}>{user?.documento}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.blue500}30` }]}>
            <Text style={styles.iconEmoji}>✉️</Text>
          </View>
          <View>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.amber500}30` }]}>
            <Text style={styles.iconEmoji}>🏅</Text>
          </View>
          <View>
            <Text style={styles.label}>Categoría</Text>
            <Text style={styles.value}>{user?.categoria?.nombre || 'Sin categoría'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl + 16,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    backgroundColor: colors.dark200,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  name: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    color: colors.gray400,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md - 4,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md - 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 16,
  },
  label: {
    color: colors.gray400,
    fontSize: 12,
  },
  value: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
