import { useCallback, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { signInWithGoogle } from "@/lib/api/auth";
import { useAuth } from "@/lib/context/AuthContext";

// Complete the auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";

export function useGoogleAuth() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  const handleSignIn = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await promptAsync();

      if (result?.type !== "success") {
        setIsLoading(false);
        if (result?.type === "error") {
          setError("Google sign-in failed. Please try again.");
        }
        return;
      }

      const idToken = result.params.id_token;
      if (!idToken) {
        setError("No ID token received from Google.");
        setIsLoading(false);
        return;
      }

      // Exchange Google token for ORPHEA token
      const authData = await signInWithGoogle(idToken);

      await signIn(authData.token, {
        id: authData.user.id,
        email: authData.user.email,
        handle: authData.user.handle,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sign-in failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [promptAsync, signIn]);

  return {
    handleSignIn,
    isLoading,
    error,
    response,
  };
}
