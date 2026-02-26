"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Musical } from "@/lib/types";
import type { MusicalStatusValue } from "@/lib/types";
import {
  exploreWantToSee,
  exploreSkip,
  exploreSeen,
  exploreUndo,
} from "./actions";
import { track } from "@/lib/analytics";

type Phase = "idle" | "busy" | "success" | "error";

interface UndoPayload {
  actionType: "want_to_see" | "skipped" | "seen";
  musicalId: string;
  previousStatus: MusicalStatusValue | null;
  reviewId?: string;
}

const SEEN_GOAL = 10;
const CHECKPOINT_AT = 5;

export default function ExploreCarousel({
  musicals,
  userId,
}: {
  musicals: Musical[];
  userId: string | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [undoPayload, setUndoPayload] = useState<UndoPayload | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [seenThisSession, setSeenThisSession] = useState(0);
  const [showCheckpoint, setShowCheckpoint] = useState(false);

  // Refs for guards and timers
  const inFlight = useRef(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkpointShown = useRef(false);
  const sessionId = useRef(crypto.randomUUID());

  // Shorthand for emitting analytics with context
  const emit = useCallback(
    <K extends keyof import("@/lib/analytics").AnalyticsEventMap>(
      event: K,
      properties: import("@/lib/analytics").AnalyticsEventMap[K],
    ) => {
      track(event, properties, { userId, sessionId: sessionId.current });
    },
    [userId],
  );

  // Analytics: onboarding viewed (fires once on mount)
  useEffect(() => {
    if (musicals.length > 0) {
      emit("explore_onboarding_viewed", {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analytics: card impression on each new card
  useEffect(() => {
    const m = musicals[currentIndex];
    if (m) {
      emit("explore_card_impression", { musicalId: m.id });
    }
  }, [currentIndex, musicals, emit]);

  // Clear undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  // Auto-clear error toast after 3 seconds
  useEffect(() => {
    if (phase !== "error") return;
    const id = setTimeout(() => {
      setPhase("idle");
      setErrorMsg(null);
    }, 3000);
    return () => clearTimeout(id);
  }, [phase]);

  const clearUndo = useCallback(() => {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    setUndoPayload(null);
  }, []);

  const runAction = useCallback(
    async (
      action: () => Promise<{
        ok: boolean;
        actionType: "want_to_see" | "skipped" | "seen";
        musicalId: string;
        previousStatus: MusicalStatusValue | null;
        reviewId?: string;
        ratingInt?: number;
      }>,
    ) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setPhase("busy");
      setErrorMsg(null);

      // Dismiss any existing undo toast — that action is now permanent
      clearUndo();

      try {
        const result = await action();

        // Brief success flash, then advance + show undo toast
        setPhase("success");
        setTimeout(() => {
          setSelectedRating(null);
          setCurrentIndex((i) => i + 1);
          setPhase("idle");
          inFlight.current = false;

          // Analytics: action events
          if (result.actionType === "seen" && result.reviewId) {
            emit("explore_action_seen", {
              musicalId: result.musicalId,
              ratingInt: result.ratingInt ?? 0,
              reviewId: result.reviewId,
            });
          } else if (result.actionType === "want_to_see") {
            emit("explore_action_want", { musicalId: result.musicalId });
          } else if (result.actionType === "skipped") {
            emit("explore_action_skip", { musicalId: result.musicalId });
          }

          // Track "seen" actions for session progress
          if (result.actionType === "seen") {
            setSeenThisSession((prev) => {
              const next = prev + 1;
              // Show checkpoint modal once at the threshold
              if (next === CHECKPOINT_AT && !checkpointShown.current) {
                checkpointShown.current = true;
                setShowCheckpoint(true);
              }
              return next;
            });
          }

          // Show undo toast
          const payload: UndoPayload = {
            actionType: result.actionType,
            musicalId: result.musicalId,
            previousStatus: result.previousStatus,
            reviewId: result.reviewId,
          };
          setUndoPayload(payload);

          // Auto-dismiss undo after 3 seconds
          undoTimer.current = setTimeout(() => {
            setUndoPayload(null);
            undoTimer.current = null;
          }, 3000);
        }, 400);
      } catch (err) {
        setPhase("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong",
        );
        inFlight.current = false;
      }
    },
    [clearUndo, emit],
  );

  const handleWantToSee = useCallback(() => {
    const musical = musicals[currentIndex];
    if (!musical) return;
    runAction(() => exploreWantToSee(musical.id));
  }, [musicals, currentIndex, runAction]);

  const handleSkip = useCallback(() => {
    const musical = musicals[currentIndex];
    if (!musical) return;
    runAction(() => exploreSkip(musical.id));
  }, [musicals, currentIndex, runAction]);

  const handleSeen = useCallback(() => {
    if (selectedRating === null) return;
    const musical = musicals[currentIndex];
    if (!musical) return;
    runAction(() => exploreSeen(musical.id, selectedRating));
  }, [selectedRating, musicals, currentIndex, runAction]);

  const handleUndo = useCallback(async () => {
    if (!undoPayload || undoing) return;
    emit("explore_undo_clicked", {
      actionType: undoPayload.actionType,
      musicalId: undoPayload.musicalId,
    });
    setUndoing(true);
    clearUndo();

    try {
      await exploreUndo(undoPayload);
      // Go back to the undone card
      setCurrentIndex((i) => Math.max(0, i - 1));
      setSelectedRating(null);
      // If we're undoing a "seen" action, decrement the session counter
      if (undoPayload.actionType === "seen") {
        setSeenThisSession((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      // Show the error to the user instead of silently failing
      setPhase("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Undo failed",
      );
    } finally {
      setUndoing(false);
    }
  }, [undoPayload, undoing, clearUndo, emit]);

  const disabled = phase === "busy" || phase === "success";
  const isComplete = currentIndex >= musicals.length;

  // Analytics: onboarding completed (fires once when all cards exhausted)
  useEffect(() => {
    if (isComplete) {
      emit("explore_onboarding_completed", {});
    }
  }, [isComplete, emit]);

  // Empty state — user has acted on every musical
  if (isComplete) {
    return (
      <div className="explore-done">
        <span className="emoji">🎉</span>
        <p className="explore-done-text">
          You&rsquo;ve explored every show in our catalog!
        </p>
        <Link
          href="/my-theatre-life"
          className="btn btn-accent"
          onClick={() => emit("explore_cta_view_playbill_clicked", {})}
        >
          View My Playbills
        </Link>
        <Link
          href="/browse"
          className="explore-done-browse"
          onClick={() => emit("explore_cta_browse_clicked", {})}
        >
          or browse all shows
        </Link>
      </div>
    );
  }

  const musical = musicals[currentIndex];

  return (
    <div className="explore-carousel">
      {/* Progress indicator */}
      <p className="explore-progress">
        {currentIndex + 1} of {musicals.length}
      </p>

      {/* Session seen counter */}
      <div className="explore-session-progress">
        <div className="explore-session-bar">
          <div
            className="explore-session-bar-fill"
            style={{ width: `${Math.min(100, (seenThisSession / SEEN_GOAL) * 100)}%` }}
          />
        </div>
        <span className="explore-session-label">
          {seenThisSession} / {SEEN_GOAL} seen this session
        </span>
      </div>

      {/* Card */}
      <div
        key={musical.id}
        className={[
          "explore-card",
          musical.image_url ? "explore-card--has-image" : "",
          phase === "success" ? "explore-card--success" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Poster */}
        <div className="explore-card-poster">
          {musical.image_url ? (
            <Image
              src={musical.image_url}
              alt={`${musical.title} poster`}
              fill
              sizes="(max-width: 600px) 100vw, 480px"
              style={{ objectFit: "cover" }}
              priority
            />
          ) : (
            <span className="explore-card-poster-emoji">🎭</span>
          )}
        </div>

        {/* Info */}
        <div className="explore-card-info">
          <h3 className="explore-card-title">{musical.title}</h3>
          <p className="explore-card-year">{musical.year}</p>
          <p className="explore-card-desc">{musical.description}</p>
        </div>

        {/* Star selector */}
        <div className="explore-star-row">
          <span className="explore-star-label">Your rating</span>
          <div className="explore-stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`explore-star${selectedRating !== null && star <= selectedRating ? " explore-star--filled" : ""}`}
                onClick={() => setSelectedRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                disabled={disabled}
              >
                {selectedRating !== null && star <= selectedRating
                  ? "\u2605"
                  : "\u2606"}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="explore-actions">
          <button
            type="button"
            className="btn explore-btn-seen"
            onClick={handleSeen}
            disabled={disabled || selectedRating === null}
          >
            Seen
          </button>
          <button
            type="button"
            className="btn explore-btn-want"
            onClick={handleWantToSee}
            disabled={disabled}
          >
            Want to See
          </button>
          <button
            type="button"
            className="btn explore-btn-skip"
            onClick={handleSkip}
            disabled={disabled}
          >
            Not Sure / Skip
          </button>
        </div>
      </div>

      {/* Undo toast */}
      {undoPayload && (
        <div className="explore-undo-toast" role="status">
          <span>Saved.</span>
          <button
            type="button"
            className="explore-undo-btn"
            onClick={handleUndo}
            disabled={undoing}
          >
            {undoing ? "Undoing\u2026" : "Undo"}
          </button>
        </div>
      )}

      {/* Error toast */}
      {phase === "error" && errorMsg && (
        <div className="explore-toast" role="alert">
          {errorMsg}
          <button
            type="button"
            className="explore-toast-dismiss"
            onClick={() => {
              setPhase("idle");
              setErrorMsg(null);
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Checkpoint callout */}
      {showCheckpoint && (
        <div className="explore-checkpoint-overlay">
          <div className="explore-checkpoint" role="dialog" aria-label="Checkpoint">
            <span className="explore-checkpoint-emoji">🎭</span>
            <p className="explore-checkpoint-heading">
              Your Playbill is taking shape!
            </p>
            <p className="explore-checkpoint-sub">
              You&rsquo;ve rated {CHECKPOINT_AT} shows &mdash; want to see how it looks?
            </p>
            <Link
              href="/my-theatre-life"
              className="btn btn-accent explore-checkpoint-primary"
              onClick={() => emit("explore_cta_view_playbill_clicked", {})}
            >
              View My Playbill
            </Link>
            <button
              type="button"
              className="explore-checkpoint-secondary"
              onClick={() => setShowCheckpoint(false)}
            >
              Keep going
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
