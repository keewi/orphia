/**
 * POST /api/mobile/auth/google
 *
 * Mobile Google OAuth token exchange.
 * Receives a Google ID token from the mobile app, verifies it,
 * upserts the user, and returns a NextAuth JWT for subsequent requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AUTH_SECRET = process.env.AUTH_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
}

async function verifyGoogleToken(
  idToken: string
): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;

    const payload = (await res.json()) as GoogleTokenPayload & { aud: string };

    if (payload.aud !== GOOGLE_CLIENT_ID) return null;
    if (!payload.email_verified) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Missing idToken" },
        { status: 400 }
      );
    }

    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) {
      return NextResponse.json(
        { error: "Invalid Google token" },
        { status: 401 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    let userId: string;

    if (existing[0]) {
      userId = existing[0].id;
    } else {
      const inserted = await db
        .insert(users)
        .values({ email: googleUser.email, password_hash: null })
        .returning({ id: users.id });
      userId = inserted[0].id;
    }

    const profileRows = await db
      .select({ handle: profiles.handle })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const handle = profileRows[0]?.handle ?? null;

    const token = await encode({
      token: {
        userId,
        email: googleUser.email,
        sub: userId,
      },
      secret: AUTH_SECRET,
    });

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email: googleUser.email,
        handle,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
