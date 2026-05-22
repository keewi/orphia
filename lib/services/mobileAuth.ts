/**
 * Auth helper for mobile API routes.
 *
 * Mobile clients send a Bearer token (NextAuth JWT) in the Authorization header.
 * This helper decodes the JWT and returns the user ID, or null if invalid.
 */

import { decode } from "next-auth/jwt";

const AUTH_SECRET = process.env.AUTH_SECRET!;

export interface MobileUser {
  id: string;
  email: string;
}

/**
 * Extract and validate the Bearer token from a request.
 * Returns the authenticated user or null.
 */
export async function getMobileUser(
  request: Request
): Promise<MobileUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  try {
    const decoded = await decode({ token, secret: AUTH_SECRET, salt: "authjs.session-token" });
    if (!decoded?.userId) return null;

    return {
      id: decoded.userId as string,
      email: (decoded.email as string) ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Like getMobileUser but throws a 401-style error if not authenticated.
 */
export async function requireMobileUser(
  request: Request
): Promise<MobileUser> {
  const user = await getMobileUser(request);
  if (!user) {
    throw new MobileAuthError("Unauthorized");
  }
  return user;
}

export class MobileAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MobileAuthError";
  }
}
