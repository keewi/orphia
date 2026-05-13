import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, fontSize, spacing } from "@/lib/theme";
import { useAuth } from "@/lib/context/AuthContext";
import { apiFetch } from "@/lib/api/client";

export default function ChooseHandleScreen() {
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setHandle: setAuthHandle } = useAuth();
  const router = useRouter();

  function validate(value: string): string | null {
    if (value.length === 0) return null;
    if (value.length < 3) return "Must be at least 3 characters";
    if (value.length > 20) return "Must be 20 characters or fewer";
    if (!/^[a-z0-9_]+$/.test(value))
      return "Only lowercase letters, numbers, and underscores";
    return null;
  }

  const checkAvailability = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const formatError = validate(value);
    if (formatError || value.length === 0) {
      setError(formatError);
      setAvailable(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    setError(null);
    setAvailable(false);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ available: boolean }>(
          `/api/mobile/handle/check?handle=${encodeURIComponent(value)}`
        );
        if (data.available) {
          setAvailable(true);
          setError(null);
        } else {
          setAvailable(false);
          setError("Handle already taken");
        }
      } catch {
        setError("Could not check availability");
      } finally {
        setChecking(false);
      }
    }, 300);
  }, []);

  function handleInputChange(text: string) {
    const raw = text.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setHandle(raw);
    checkAvailability(raw);
  }

  async function handleSubmit() {
    const formatError = validate(handle);
    if (formatError) {
      setError(formatError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/api/mobile/handle/claim", {
        method: "POST",
        body: JSON.stringify({ handle }),
      });

      setAuthHandle(handle);
      router.replace("/(tabs)");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to claim handle"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your handle</Text>
      <Text style={styles.subtitle}>
        Pick a unique username for your public ORPHEA profile
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.atSymbol}>@</Text>
        <TextInput
          style={styles.input}
          value={handle}
          onChangeText={handleInputChange}
          placeholder="your_handle"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
        />
      </View>

      {checking && (
        <Text style={styles.checkingText}>Checking availability...</Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {available && !checking && (
        <Text style={styles.availableText}>Available!</Text>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          (!available || submitting) && styles.submitButtonDisabled,
          pressed && styles.submitButtonPressed,
        ]}
        onPress={handleSubmit}
        disabled={!available || submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.submitButtonText}>Claim Handle</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing["2xl"],
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize["3xl"],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing["2xl"],
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  atSymbol: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    paddingVertical: 14,
  },
  checkingText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  availableText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.success,
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.bg,
  },
});
