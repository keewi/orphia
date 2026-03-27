"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { label: "Explore", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "My Playbills", href: "/my-theatre-life" },
  { label: "Activity", href: "/activity" },
  { label: "Following", href: "/following" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  const userEmail = session?.user?.email ?? null;

  // Fetch user handle on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/me`)
      .then((res) => res.json())
      .then((data) => setUserHandle(data.handle ?? null))
      .catch(() => {});
  }, [session?.user?.id]);

  // Close account menu on click outside
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

  // Close mobile menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileRef.current &&
        !mobileRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Close all menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    document.cookie = "x-has-handle=; path=/; max-age=0";
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  // Don't show navigation on the login or choose-handle pages
  if (pathname === "/login" || pathname === "/choose-handle") {
    return null;
  }

  return (
    <div className="header-nav" ref={mobileRef}>
      {/* ── Desktop: pill nav + account icon ── */}
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

      {/* ── Mobile: hamburger toggle ── */}
      <button
        type="button"
        className={`mobile-menu-toggle${mobileMenuOpen ? " mobile-menu-toggle-active" : ""}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Menu"
        aria-expanded={mobileMenuOpen}
      >
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
        <span className="mobile-menu-bar" />
      </button>

      {/* ── Mobile: dropdown menu ── */}
      {mobileMenuOpen && (
        <nav className="mobile-menu">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-menu-link${pathname === href ? " mobile-menu-link-active" : ""}`}
            >
              {label}
            </Link>
          ))}

          <hr className="mobile-menu-divider" />

          {userEmail && (
            <p className="mobile-menu-email">{userEmail}</p>
          )}
          {userHandle && (
            <Link href="/find-friends" className="mobile-menu-link">
              Find Friends
            </Link>
          )}
          <button
            type="button"
            className="mobile-menu-link mobile-menu-signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </nav>
      )}
    </div>
  );
}
