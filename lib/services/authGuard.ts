/**
 * Shared auth guard for Server Components.
 *
 * Returns the authenticated Supabase user or redirects to /login.
 * Replaces the duplicated getUser() + redirect() pattern across pages.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function requireAuth(): Promise<User> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}
