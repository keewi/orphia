import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { getToken, setToken, clearToken, apiFetch } from "@/lib/api/client";

interface User {
  id: string;
  email: string;
  handle: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setHandle: (handle: string) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount and validate it
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          // Validate token by fetching the user's profile
          const data = await apiFetch<{
            profile: { id: string; handle: string } | null;
          }>("/api/mobile/profile");

          if (data.profile) {
            setUser({
              id: data.profile.id,
              email: "", // not returned from profile endpoint
              handle: data.profile.handle,
            });
          } else {
            // Token valid but no profile — user needs to choose handle
            // We still have a valid session; try /api/me for user id
            setUser({
              id: "",
              email: "",
              handle: null,
            });
          }
        }
      } catch {
        // Token invalid or expired
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (token: string, userData: User) => {
    await setToken(token);
    setUser(userData);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const setHandle = useCallback((handle: string) => {
    setUser((prev) => (prev ? { ...prev, handle } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        setHandle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
