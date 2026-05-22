import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, typography } from "@/lib/theme";
import { useAuth } from "@/lib/context/AuthContext";
import { apiFetch } from "@/lib/api/client";

export default function ChooseHandleScreen() {
  const { setHandle } = useAuth();
  const [input, setInput] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = /^[a-z0-9_]{3,20}$/.test(input);

  // Debounced availability check
  useEffect(() => {
    if (!isValid) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await apiFetch<{ available: boolean }>(
          `/api/mobile/handle/check?handle=${input}`
        );
        setIsAvailable(data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [input, isValid]);

  const handleClaim = useCallback(async () => {
    if (!isValid || !isAvailable) return;
    setIsClaiming(true);
    setError(null);
    try {
      await apiFetch("/api/mobile/handle/claim", {
        method: "POST",
        body: JSON.stringify({ handle: input }),
      });
      setHandle(input);
    } catch (e: any) {
      setError(e.message || "Failed to claim handle");
    } finally {
      setIsClaiming(false);
    }
  }, [input, isValid, isAvailable, setHandle]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your handle</Text>
      <Text style={styles.subtitle}>
        This is how other fans will find you on ORPHEA.
      </Text>

      <View style={styles.inputRow}>
        <Text style={styles.at}>@</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={(t) => setInput(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          placeholder="yourhandle"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
      </View>

      {input.length > 0 && !isValid && (
        <Text style={styles.hint}>3-20 characters, lowercase letters, numbers, underscore</Text>
      )}
      {isChecking && <ActivityIndicator color={colors.gold} style={styles.status} />}
      {isValid && !isChecking && isAvailable === true && (
        <Text style={[styles.status, styles.available]}>Available!</Text>
      )}
      {isValid && !isChecking && isAvailable === false && (
        <Text style={[styles.status, styles.taken]}>Already taken</Text>
      )}
      {error && <Text style={[styles.status, styles.taken]}>{error}</Text>}

      <Pressable
        style={[styles.claimBtn, (!isAvailable || isClaiming) && styles.disabled]}
        onPress={handleClaim}
        disabled={!isAvailable || isClaiming}
      >
        {isClaiming ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.claimBtnText}>Claim Handle</Text>
        )}
      </Pressable>
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
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  at: {
    fontFamily: typography.families.bodyMedium,
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontFamily: typography.families.body,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  hint: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 8,
  },
  status: {
    marginBottom: 8,
  },
  available: {
    fontFamily: typography.families.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.success,
  },
  taken: {
    fontFamily: typography.families.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
  claimBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  disabled: {
    opacity: 0.5,
  },
  claimBtnText: {
    fontFamily: typography.families.bodySemiBold,
    fontSize: typography.sizes.md,
    color: colors.background,
  },
});
