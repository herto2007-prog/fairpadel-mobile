import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../src/lib/theme';

export default function ReservasTab() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reservas</Text>
        <Text style={styles.subtitle}>Reservá tu cancha</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.emoji}>📅</Text>
          <Text style={styles.cardTitle}>Próximamente</Text>
          <Text style={styles.cardText}>
            Acá vas a poder ver disponibilidad y reservar canchas.
          </Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 16,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.gray400,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  cardText: {
    color: colors.gray400,
    fontSize: 14,
    marginTop: spacing.sm + 4,
    textAlign: 'center',
  },
});
