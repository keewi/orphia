import { useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { signInWithGoogle } from "../api/auth";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  async function handleSignIn() {
    setError(null);
    setIsLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === "success") {
        const idToken = result.params.id_token;
        const data = await signInWithGoogle(idToken);
        await signIn(data.token, data.user);
      } else if (result.type === "cancel") {
        // User cancelled — do nothing
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } catch (e: any) {
      setError(e.message || "Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return { handleSignIn, isLoading, error, isReady: !!request };
}
