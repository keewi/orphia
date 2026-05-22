import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "@/lib/theme";

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>See what your friends are watching</Text>
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
