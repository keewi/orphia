import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "@/lib/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ORPHEA</Text>
      <Text style={styles.subtitle}>Your musical theatre life, tracked.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontFamily: typography.families.heading,
    fontSize: 32,
    color: colors.gold,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});
