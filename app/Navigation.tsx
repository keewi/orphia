"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Explore", href: "/" },
  { label: "My Collection", href: "/my-musicals" },
  { label: "My Playbill", href: "/my-theatre-life" },
];

export default function Navigation() {
  const pathname = usePathname();

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
    </nav>
  );
}
