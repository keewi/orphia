import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getToken, setToken, clearToken } from "../api/client";
import { getMyProfile } from "../api/profile";

interface User {
  id: string;
  email: string;
  handle: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsHandle: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setHandle: (handle: string) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const profileData = await getMyProfile();
      if (profileData.profile) {
        setUser({
          id: profileData.profile.id,
          email: "",
          handle: profileData.profile.handle,
        });
      } else {
        // Token valid but no profile — user needs to pick handle
        setUser({ id: "", email: "", handle: null });
      }
    } catch {
      // Token expired or invalid
      await clearToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(token: string, userData: User) {
    await setToken(token);
    setUser(userData);
  }

  async function signOut() {
    await clearToken();
    setUser(null);
  }

  function setHandleOnUser(handle: string) {
    setUser((prev) => (prev ? { ...prev, handle } : prev));
  }

  const isAuthenticated = !!user;
  const needsHandle = isAuthenticated && !user.handle;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        needsHandle,
        signIn,
        signOut,
        setHandle: setHandleOnUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
