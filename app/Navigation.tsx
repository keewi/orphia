"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Explore", href: "/" },
  { label: "My Playbills", href: "/my-theatre-life" },
  { label: "Activity", href: "/activity" },
  { label: "Following", href: "/following" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user email and handle on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setUserEmail(user?.email ?? null);
      if (user) {
        supabase
          .from("profiles")
          .select("handle")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            setUserHandle(profile?.handle ?? null);
          });
      }
    });
  }, []);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear cached handle cookie so next sign-in re-checks
    document.cookie = "x-has-handle=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  }

  // Don't show navigation on the login or choose-handle pages
  if (pathname === "/login" || pathname === "/choose-handle") {
    return null;
  }

  return (
    <>
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
      </nav>

      {/* Account icon — top-right corner */}
      <div className="account-menu" ref={menuRef}>
        <button
          type="button"
          className={`account-icon${menuOpen ? " account-icon-active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
        </button>

        {menuOpen && (
          <div className="account-dropdown">
            {userEmail && (
              <>
                <p className="account-email">{userEmail}</p>
                <hr className="account-divider" />
              </>
            )}
            {userHandle && (
              <>
                <Link href="/find-friends" className="account-dropdown-link">
                  Find Friends
                </Link>
                <hr className="account-divider" />
              </>
            )}
            <button type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
