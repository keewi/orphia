"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Explore", href: "/" },
  { label: "My Collection", href: "/my-musicals" },
  { label: "My Playbill", href: "/my-theatre-life" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Don't show navigation on the login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="site-nav">
      {navItems.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={`nav-link${pathname === href ? " nav-link-active" : ""}`}
        >
          {label}
        </Link>
      ))}
      <button type="button" className="btn-signout" onClick={handleSignOut}>
        Sign Out
      </button>
    </nav>
  );
}
