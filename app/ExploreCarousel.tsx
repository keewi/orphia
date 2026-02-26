"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import StarRatingInput from "@/app/components/StarRatingInput";
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

type SwipeDirection = "right" | "left" | "up" | null;

/**
 * Swipe gesture hook — attaches raw touch events to a card element.
 * Physically drags the card during a swipe, shows directional overlays,
 * and calls the appropriate handler when the swipe exceeds the threshold.
 */
function useSwipeGesture({
  cardRef,
  disabledRef,
  selectedRatingRef,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  onSwipeRightBlocked,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  disabledRef: React.MutableRefObject<boolean>;
  selectedRatingRef: React.MutableRefObject<number | null>;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  onSwipeRightBlocked: () => void;
}) {
  const [swipedDirection, setSwipedDirection] = useState<SwipeDirection>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let gestureState: "pending" | "swiping" | "scrolling" = "pending";
    let cardWidth = 0;
    let cardHeight = 0;

    function clearCssVars() {
      if (!card) return;
      card.style.removeProperty("--swipe-x");
      card.style.removeProperty("--swipe-y");
      card.style.removeProperty("--swipe-rotate");
      card.style.removeProperty("--swipe-right-opacity");
      card.style.removeProperty("--swipe-left-opacity");
      card.style.removeProperty("--swipe-up-opacity");
      card.classList.remove("explore-card--swiping");
    }

    function onTouchStart(e: TouchEvent) {
      if (disabledRef.current) return;
      const target = e.target as HTMLElement;
      if (target.closest(".explore-stars") || target.closest(".explore-actions")) return;

      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      gestureState = "pending";

      const rect = card!.getBoundingClientRect();
      cardWidth = rect.width;
      cardHeight = rect.height;

      card!.classList.remove("explore-card--bounce-back");
    }

    function onTouchMove(e: TouchEvent) {
      if (gestureState === "scrolling" || disabledRef.current) return;
      if (e.touches.length > 1) {
        gestureState = "scrolling";
        clearCssVars();
        return;
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const absDX = Math.abs(deltaX);
      const absDY = Math.abs(deltaY);

      if (gestureState === "pending") {
        const totalMove = Math.sqrt(absDX ** 2 + absDY ** 2);
        if (totalMove < 10) return;

        const isHorizontal = absDX > absDY * 1.2;
        const isUpward = deltaY < 0 && absDY > absDX * 0.8;

        if (isHorizontal || isUpward) {
          gestureState = "swiping";
          card!.classList.add("explore-card--swiping");
          e.preventDefault();
        } else {
          gestureState = "scrolling";
          return;
        }
      }

      if (gestureState === "swiping") {
        e.preventDefault();

        // Clamp upward-only for Y (don't let card drag down)
        const clampedY = Math.min(0, deltaY);
        const rotation = Math.max(-15, Math.min(15, deltaX * 0.06));

        card!.style.setProperty("--swipe-x", `${deltaX}px`);
        card!.style.setProperty("--swipe-y", `${clampedY}px`);
        card!.style.setProperty("--swipe-rotate", `${rotation}deg`);

        // Compute directional indicator opacities
        const hThreshold = Math.min(100, cardWidth * 0.3);
        const vThreshold = Math.min(80, cardHeight * 0.25);

        let rightOp = 0, leftOp = 0, upOp = 0;

        if (deltaY < 0 && absDY > absDX * 0.8) {
          upOp = Math.min(1, absDY / vThreshold);
        } else if (deltaX > 0) {
          rightOp = Math.min(1, deltaX / hThreshold);
        } else if (deltaX < 0) {
          leftOp = Math.min(1, absDX / hThreshold);
        }

        card!.style.setProperty("--swipe-right-opacity", String(rightOp));
        card!.style.setProperty("--swipe-left-opacity", String(leftOp));
        card!.style.setProperty("--swipe-up-opacity", String(upOp));
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (gestureState !== "swiping") {
        gestureState = "pending";
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const absDX = Math.abs(deltaX);
      const absDY = Math.abs(deltaY);

      const elapsed = Date.now() - startTime;
      const velocity = Math.sqrt(deltaX ** 2 + deltaY ** 2) / Math.max(1, elapsed);

      const hThreshold = Math.min(100, cardWidth * 0.3);
      const vThreshold = Math.min(80, cardHeight * 0.25);
      const boost = velocity > 0.5 ? 0.6 : 1;

      let direction: SwipeDirection = null;

      if (deltaY < 0 && absDY > absDX * 0.8 && absDY > vThreshold * boost) {
        direction = "up";
      } else if (deltaX > hThreshold * boost) {
        direction = "right";
      } else if (deltaX < -(hThreshold * boost)) {
        direction = "left";
      }

      clearCssVars();
      gestureState = "pending";

      if (direction) {
        // Check if "seen" swipe is blocked (no rating)
        if (direction === "right" && selectedRatingRef.current === null) {
          onSwipeRightBlocked();
          card!.classList.add("explore-card--bounce-back");
          return;
        }

        setSwipedDirection(direction);

        // Fire the action after the swipe-out animation starts
        requestAnimationFrame(() => {
          if (direction === "right") onSwipeRight();
          else if (direction === "left") onSwipeLeft();
          else if (direction === "up") onSwipeUp();
        });
      } else {
        // Below threshold — bounce back
        card!.classList.add("explore-card--bounce-back");
      }
    }

    card.addEventListener("touchstart", onTouchStart, { passive: true });
    card.addEventListener("touchmove", onTouchMove, { passive: false });
    card.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      card.removeEventListener("touchstart", onTouchStart);
      card.removeEventListener("touchmove", onTouchMove);
      card.removeEventListener("touchend", onTouchEnd);
    };
  }, [cardRef, disabledRef, selectedRatingRef, onSwipeRight, onSwipeLeft, onSwipeUp, onSwipeRightBlocked]);

  return { swipedDirection, clearSwipedDirection: () => setSwipedDirection(null) };
}

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

  // Track the most recent successful action for the persistent status badge
  const [lastAction, setLastAction] = useState<{
    actionType: "want_to_see" | "skipped" | "seen";
    title: string;
  } | null>(null);

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
      musicalTitle: string,
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

          // Show persistent status badge + undo option
          const payload: UndoPayload = {
            actionType: result.actionType,
            musicalId: result.musicalId,
            previousStatus: result.previousStatus,
            reviewId: result.reviewId,
          };
          setUndoPayload(payload);
          setLastAction({
            actionType: result.actionType,
            title: musicalTitle,
          });
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
    runAction(() => exploreWantToSee(musical.id), musical.title);
  }, [musicals, currentIndex, runAction]);

  const handleSkip = useCallback(() => {
    const musical = musicals[currentIndex];
    if (!musical) return;
    runAction(() => exploreSkip(musical.id), musical.title);
  }, [musicals, currentIndex, runAction]);

  const handleSeen = useCallback(() => {
    if (selectedRating === null) return;
    const musical = musicals[currentIndex];
    if (!musical) return;
    runAction(() => exploreSeen(musical.id, selectedRating), musical.title);
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
      setLastAction(null);
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

  // ── Swipe gesture ──
  const cardRef = useRef<HTMLDivElement>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const selectedRatingRef = useRef(selectedRating);
  selectedRatingRef.current = selectedRating;

  const [showRateHint, setShowRateHint] = useState(false);
  const [starRowHint, setStarRowHint] = useState(false);

  const onSwipeRightBlocked = useCallback(() => {
    const m = musicals[currentIndex];
    if (m) {
      emit("explore_swipe_triggered", {
        musicalId: m.id,
        direction: "right",
        blocked: true,
      });
    }
    setShowRateHint(true);
    setStarRowHint(true);
    setTimeout(() => setShowRateHint(false), 2500);
    setTimeout(() => setStarRowHint(false), 1500);
  }, [musicals, currentIndex, emit]);

  const swipeRight = useCallback(() => {
    const m = musicals[currentIndex];
    if (m) emit("explore_swipe_triggered", { musicalId: m.id, direction: "right" });
    handleSeen();
  }, [musicals, currentIndex, emit, handleSeen]);

  const swipeLeft = useCallback(() => {
    const m = musicals[currentIndex];
    if (m) emit("explore_swipe_triggered", { musicalId: m.id, direction: "left" });
    handleSkip();
  }, [musicals, currentIndex, emit, handleSkip]);

  const swipeUp = useCallback(() => {
    const m = musicals[currentIndex];
    if (m) emit("explore_swipe_triggered", { musicalId: m.id, direction: "up" });
    handleWantToSee();
  }, [musicals, currentIndex, emit, handleWantToSee]);

  const { swipedDirection, clearSwipedDirection } = useSwipeGesture({
    cardRef,
    disabledRef,
    selectedRatingRef,
    onSwipeRight: swipeRight,
    onSwipeLeft: swipeLeft,
    onSwipeUp: swipeUp,
    onSwipeRightBlocked,
  });

  // Reset swipe direction when card changes
  useEffect(() => {
    clearSwipedDirection();
    setShowRateHint(false);
    setStarRowHint(false);
  }, [currentIndex, clearSwipedDirection]);

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
        <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Explore</h2>
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

  const actionLabel = lastAction
    ? lastAction.actionType === "seen"
      ? "Seen"
      : lastAction.actionType === "want_to_see"
        ? "Saved"
        : "Skipped"
    : null;

  return (
    <div className="explore-carousel">
      {/* Header row: title + persistent status badge */}
      <div className="explore-header">
        <h2 className="section-title">Explore</h2>
        {lastAction && (
          <div className="explore-status-badge" key={currentIndex} role="status">
            <span className="explore-status-label">
              {actionLabel} &middot; {lastAction.title}
            </span>
            {undoPayload && (
              <button
                type="button"
                className="explore-status-undo"
                onClick={handleUndo}
                disabled={undoing}
              >
                {undoing ? "Undoing\u2026" : "Undo"}
              </button>
            )}
          </div>
        )}
      </div>

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
        ref={cardRef}
        key={musical.id}
        className={[
          "explore-card",
          musical.image_url ? "explore-card--has-image" : "",
          phase === "success" && !swipedDirection ? "explore-card--success" : "",
          swipedDirection === "right" ? "explore-card--swipe-right" : "",
          swipedDirection === "left" ? "explore-card--swipe-left" : "",
          swipedDirection === "up" ? "explore-card--swipe-up" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Swipe indicator overlays */}
        <div className="explore-swipe-indicator explore-swipe-indicator--right">
          Seen
        </div>
        <div className="explore-swipe-indicator explore-swipe-indicator--left">
          Skip
        </div>
        <div className="explore-swipe-indicator explore-swipe-indicator--up">
          Want to See
        </div>

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
        <div className={`explore-star-row${starRowHint ? " explore-star-row--hint" : ""}`}>
          <span className="explore-star-label">Your rating</span>
          <StarRatingInput
            value={selectedRating}
            onChange={setSelectedRating}
            disabled={disabled}
          />
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

      {/* Rate-first hint toast */}
      {showRateHint && (
        <div className="explore-hint-toast" role="status">
          Rate this show first to mark as seen
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
