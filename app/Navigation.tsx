"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Explore", href: "/" },
  { label: "My Playbills", href: "/my-theatre-life" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    router.push("/login");
    router.refresh();
  }

  // Don't show navigation on the login page
  if (pathname === "/login") {
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
            <button type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
