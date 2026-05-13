import { useEffect } from "react";
import { Slot, SplashScreen, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { AuthProvider, useAuth } from "@/lib/context/AuthContext";

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inLoginGroup = segments[0] === "login";
    const inHandleGroup = segments[0] === "choose-handle";

    if (!isAuthenticated && !inLoginGroup) {
      // Not signed in → go to login
      router.replace("/login");
    } else if (isAuthenticated && user?.handle === null && !inHandleGroup) {
      // Signed in but no handle → go to choose-handle
      router.replace("/choose-handle");
    } else if (isAuthenticated && user?.handle && (inLoginGroup || inHandleGroup)) {
      // Fully set up → go to main app
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, user, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}
