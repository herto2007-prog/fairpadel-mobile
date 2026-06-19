import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/features/auth/context/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing, radius } from '../../src/lib/theme';

export default function HomeTab() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const menuItems = [
    { emoji: '🏆', label: 'Mis Torneos', color: colors.primary },
    { emoji: '📅', label: 'Mis Reservas', color: colors.blue500 },
    { emoji: '👥', label: 'Comunidad', color: colors.green500 },
    { emoji: '📈', label: 'Rankings', color: colors.amber500 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bienvenido,</Text>
        <Text style={styles.name}>{user?.nombre} {user?.apellido}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.menuCard} activeOpacity={0.8}>
              <View style={[styles.menuIconBox, { backgroundColor: `${item.color}30` }]}>
                <Text style={[styles.menuEmoji, { color: item.color }]}>{item.emoji}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos torneos</Text>
        <View style={styles.card}>
          <Text style={styles.emptyText}>No hay torneos próximos</Text>
          <TouchableOpacity style={{ marginTop: spacing.md - 4 }}>
            <Text style={styles.linkText}>Ver todos los torneos →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.logoutSection}>
        <Button title="Cerrar sesión" onPress={handleLogout} variant="outline" />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 16,
    paddingBottom: spacing.lg,
  },
  greeting: {
    color: colors.gray400,
    fontSize: 14,
  },
  name: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md - 4,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    width: '47%',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 4,
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuLabel: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.gray400,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  logoutSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
