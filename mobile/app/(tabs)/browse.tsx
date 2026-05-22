import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "@/lib/theme";

export default function BrowseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse</Text>
      <Text style={styles.subtitle}>Discover musicals</Text>
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
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});
