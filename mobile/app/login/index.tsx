import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors, typography } from "@/lib/theme";
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth";

export default function LoginScreen() {
  const { handleSignIn, isLoading, error, isReady } = useGoogleAuth();

  return (
    <View style={styles.container}>
      <View style={styles.branding}>
        <Text style={styles.logo}>ORPHEA</Text>
        <Text style={styles.tagline}>Track your musical theatre life</Text>
      </View>

      <View style={styles.authSection}>
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.googleBtn, (!isReady || isLoading) && styles.disabled]}
          onPress={handleSignIn}
          disabled={!isReady || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 32,
  },
  branding: {
    alignItems: "center",
    marginBottom: 64,
  },
  logo: {
    fontFamily: typography.families.heading,
    fontSize: 48,
    color: colors.gold,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
  },
  authSection: {
    alignItems: "center",
  },
  error: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  googleBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  googleBtnText: {
    fontFamily: typography.families.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.background,
  },
});
