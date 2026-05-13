/**
 * Reusable empty-state block — emoji, message, and optional CTA children.
 *
 * Server-safe — no "use client" needed.
 */

export default function EmptyState({
  emoji = "🎭",
  message,
  children,
}: {
  emoji?: string;
  message: string;
  /** Optional CTA buttons / links rendered below the message. */
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="emoji">{emoji}</span>
      {message}
      {children && <div className="empty-state-actions">{children}</div>}
    </div>
  );
}
