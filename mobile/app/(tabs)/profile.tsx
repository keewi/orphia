import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, typography } from "@/lib/theme";
import { useAuth } from "@/lib/context/AuthContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.handle}>@{user?.handle}</Text>
      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
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
  handle: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.md,
    color: colors.gold,
    marginBottom: 32,
  },
  signOutBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    fontFamily: typography.families.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
