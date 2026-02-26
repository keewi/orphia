/**
 * Centralized analytics module.
 *
 * Defines every tracked event and its payload in a single type-safe map.
 * The `track()` function currently logs to console.debug — swap the
 * implementation for PostHog / Mixpanel / Segment when ready.
 */

// ── Event payload map ────────────────────────────────────

export interface AnalyticsEventMap {
  explore_onboarding_viewed: Record<string, never>;
  explore_card_impression: { musicalId: string };
  explore_action_seen: {
    musicalId: string;
    ratingInt: number;
    reviewId: string;
  };
  explore_action_want: { musicalId: string };
  explore_action_skip: { musicalId: string };
  explore_onboarding_completed: Record<string, never>;
  explore_cta_view_playbill_clicked: Record<string, never>;
  explore_cta_browse_clicked: Record<string, never>;
  explore_undo_clicked: { actionType: string; musicalId: string };
}

// ── Context attached to every event ──────────────────────

export interface AnalyticsContext {
  userId?: string | null;
  sessionId?: string;
}

// ── Public API ───────────────────────────────────────────

export function track<K extends keyof AnalyticsEventMap>(
  event: K,
  properties: AnalyticsEventMap[K],
  context: AnalyticsContext = {},
): void {
  // TODO: replace with a real analytics provider
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, { ...properties, ...context });
  }
}
