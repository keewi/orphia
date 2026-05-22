import { apiFetch, setToken } from "./client";

interface AuthResponse {
  token: string;
  user: { id: string; email: string; handle: string | null };
}

export async function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/mobile/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  await setToken(data.token);
  return data;
}
