import { apiFetch, setToken } from "./client";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    handle: string | null;
  };
}

/**
 * Exchange a Google ID token for an ORPHEA auth token.
 */
export async function signInWithGoogle(
  idToken: string
): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/mobile/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  // Store the token for subsequent requests
  await setToken(data.token);

  return data;
}
