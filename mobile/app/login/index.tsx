import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors, fonts, fontSize, spacing } from "@/lib/theme";
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth";

export default function LoginScreen() {
  const { handleSignIn, isLoading, error } = useGoogleAuth();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>ORPHEA</Text>
        <Text style={styles.tagline}>Your VIP theatre companion</Text>
      </View>

      <View style={styles.authSection}>
        <Pressable
          style={({ pressed }) => [
            styles.googleButton,
            pressed && styles.googleButtonPressed,
          ]}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.disclaimer}>
          By continuing, you agree to ORPHEA&apos;s Terms of Service and
          Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  hero: {
    alignItems: "center",
    marginBottom: 64,
  },
  logo: {
    fontFamily: fonts.displayHeavy,
    fontSize: 48,
    color: colors.gold,
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  authSection: {
    gap: spacing.lg,
    alignItems: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    gap: spacing.md,
  },
  googleButtonPressed: {
    opacity: 0.85,
  },
  googleIcon: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.xl,
    color: "#4285F4",
  },
  googleButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.base,
    color: "#1F1F1F",
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
});
