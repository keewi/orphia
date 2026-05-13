import Link from "next/link";

/**
 * Shared interactive card wrapper.
 *
 * Provides the unified card chrome (background, border, shadow) and hover
 * effect (gold glow, gold border highlight, subtle lift) used across
 * gallery tiles and following cards.
 *
 * Server-safe — no "use client" needed.
 */
export default function LinkCard({
  href,
  className,
  children,
  style,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={href}
      className={`link-card${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </Link>
  );
}
