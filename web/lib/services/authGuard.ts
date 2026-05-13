/**
 * Shared auth guard for Server Components.
 *
 * Returns the authenticated user or redirects to /login.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAuth(): Promise<{ id: string; email: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return { id: session.user.id, email: session.user.email ?? "" };
}
