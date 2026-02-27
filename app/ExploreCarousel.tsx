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

/* ── Tinder-style swipe constants ── */
const MAX_ROTATION_DEG = 20;
const DIRECTION_LOCK_PX = 10;
const VELOCITY_SAMPLES = 5;
const VELOCITY_COMMIT_PX_S = 800;
const EXIT_DURATION_MIN_MS = 250;
const EXIT_DURATION_MAX_MS = 450;
const DRAG_DAMPING = 0.75; // card moves at 75% of finger speed for a weighted feel

interface TouchSample {
  x: number;
  y: number;
  t: number; // performance.now()
}

function computeVelocity(samples: TouchSample[]): { vx: number; vy: number } {
  if (samples.length < 2) return { vx: 0, vy: 0 };
  const first = samples[0];
  const last = samples[samples.length - 1];
  const dt = Math.max(1, last.t - first.t);
  return {
    vx: ((last.x - first.x) / dt) * 1000,
    vy: ((last.y - first.y) / dt) * 1000,
  };
}

/**
 * Tinder-style swipe gesture hook.
 *
 * Improvements over the previous implementation:
 * - Exit animation starts from the current drag position (no snap-back glitch)
 * - 40%-of-screen-width commit threshold (was ~100 px)
 * - Velocity-aware flick detection (800 px/s bypasses distance threshold)
 * - Velocity-dependent exit duration (faster flick = quicker exit)
 * - 20° max rotation proportional to screen width (Tinder-style)
 * - Instantaneous velocity via sliding window of last 5 touch samples
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
    let gestureState: "pending" | "swiping" | "scrolling" = "pending";
    let touchSamples: TouchSample[] = [];

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
      gestureState = "pending";
      touchSamples = [{ x: touch.clientX, y: touch.clientY, t: performance.now() }];

      card!.classList.remove("explore-card--bounce-back");
      // Clear any leftover inline styles from a previous exit animation
      card!.style.removeProperty("animation");
      card!.style.removeProperty("transform");
      card!.style.removeProperty("opacity");
      card!.style.removeProperty("transition");
      card!.style.removeProperty("pointer-events");
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

      // Record touch sample for velocity tracking (keep last N)
      touchSamples.push({ x: touch.clientX, y: touch.clientY, t: performance.now() });
      if (touchSamples.length > VELOCITY_SAMPLES) touchSamples.shift();

      // Direction lock: decide on first significant movement
      if (gestureState === "pending") {
        const totalMove = Math.sqrt(absDX ** 2 + absDY ** 2);
        if (totalMove < DIRECTION_LOCK_PX) return;

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

        const screenW = window.innerWidth;
        // Apply damping — card moves at 75% of finger speed for a heavier feel
        const dampedX = deltaX * DRAG_DAMPING;
        const dampedY = Math.min(0, deltaY * DRAG_DAMPING); // clamp downward
        // Rotation proportional to screen width (Tinder-style)
        const rotation = (dampedX / screenW) * MAX_ROTATION_DEG;
        const clampedRotation = Math.max(-MAX_ROTATION_DEG, Math.min(MAX_ROTATION_DEG, rotation));

        card!.style.setProperty("--swipe-x", `${dampedX}px`);
        card!.style.setProperty("--swipe-y", `${dampedY}px`);
        card!.style.setProperty("--swipe-rotate", `${clampedRotation}deg`);

        // Indicator opacities proportional to finger progress toward commit threshold
        const hCommit = screenW * 0.4;
        const vCommit = window.innerHeight * 0.3;

        let rightOp = 0, leftOp = 0, upOp = 0;

        if (deltaY < 0 && absDY > absDX * 0.8) {
          upOp = Math.min(1, absDY / vCommit);
        } else if (deltaX > 0) {
          rightOp = Math.min(1, deltaX / hCommit);
        } else if (deltaX < 0) {
          leftOp = Math.min(1, absDX / hCommit);
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

      // Compute instantaneous velocity from touch sample buffer
      touchSamples.push({ x: touch.clientX, y: touch.clientY, t: performance.now() });
      const { vx, vy } = computeVelocity(touchSamples);

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const hCommit = screenW * 0.4;
      const vCommit = screenH * 0.3;

      // Commit decision: distance OR velocity OR combined
      let direction: SwipeDirection = null;

      if (deltaY < 0 && absDY > absDX * 0.8) {
        const velocityCommit = vy < -VELOCITY_COMMIT_PX_S;
        const distanceCommit = absDY > vCommit;
        const combinedCommit = absDY + Math.abs(vy) * 0.15 > vCommit;
        if (distanceCommit || velocityCommit || combinedCommit) direction = "up";
      } else if (deltaX > 0) {
        const velocityCommit = vx > VELOCITY_COMMIT_PX_S;
        const distanceCommit = absDX > hCommit;
        const combinedCommit = absDX + Math.abs(vx) * 0.15 > hCommit;
        if (distanceCommit || velocityCommit || combinedCommit) direction = "right";
      } else if (deltaX < 0) {
        const velocityCommit = vx < -VELOCITY_COMMIT_PX_S;
        const distanceCommit = absDX > hCommit;
        const combinedCommit = absDX + Math.abs(vx) * 0.15 > hCommit;
        if (distanceCommit || velocityCommit || combinedCommit) direction = "left";
      }

      gestureState = "pending";

      if (direction) {
        // Check if "seen" swipe is blocked (no rating)
        if (direction === "right" && selectedRatingRef.current === null) {
          clearCssVars();
          onSwipeRightBlocked();
          card!.classList.add("explore-card--bounce-back");
          return;
        }

        // ── Exit animation from current drag position (Tinder-style) ──

        // 1. Capture current drag position from CSS vars
        const curX = parseFloat(card!.style.getPropertyValue("--swipe-x")) || 0;
        const curY = parseFloat(card!.style.getPropertyValue("--swipe-y")) || 0;
        const curRot = parseFloat(card!.style.getPropertyValue("--swipe-rotate")) || 0;

        // 2. Kill the fadeInUp animation. Its fill-mode:both keeps
        //    transform:translateY(0) at animation-level priority, which
        //    overrides inline styles and snaps the card to center.
        //    This MUST be set before removing the swiping class (which
        //    had animation:none !important keeping it suppressed).
        card!.style.animation = "none";

        // 3. Remove swiping class and CSS vars
        clearCssVars();

        // 4. Pin card at current drag position via inline styles (prevents snap-back)
        card!.style.transform = `translate(${curX}px, ${curY}px) rotate(${curRot}deg)`;
        card!.style.opacity = "1";
        card!.style.pointerEvents = "none";

        // 5. Force browser to commit the pinned position before applying the transition.
        //    Without this reflow, the browser can batch pin + transition into one frame
        //    and the card flies from its natural position instead of the drag position.
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        card!.offsetHeight;

        // 5. Compute velocity-dependent exit duration
        const speed = Math.sqrt(vx ** 2 + vy ** 2);
        const exitDuration = Math.max(
          EXIT_DURATION_MIN_MS,
          Math.min(EXIT_DURATION_MAX_MS, 450 - speed * 0.15),
        );

        // 6. Compute exit target (fly off screen from current position)
        let exitTransform: string;
        if (direction === "right") {
          exitTransform = `translate(${screenW * 1.5}px, ${curY}px) rotate(${curRot + 8}deg)`;
        } else if (direction === "left") {
          exitTransform = `translate(${-screenW * 1.5}px, ${curY}px) rotate(${curRot - 8}deg)`;
        } else {
          exitTransform = `translate(${curX}px, ${-screenH * 1.5}px) rotate(${curRot}deg)`;
        }

        // 7. Apply transition and exit target — reflow above ensures this starts from
        //    the pinned drag position, not the card's natural center position
        card!.style.transition = `transform ${exitDuration}ms ease-out, opacity ${exitDuration * 0.8}ms ease-out`;
        card!.style.transform = exitTransform;
        card!.style.opacity = "0";

        // 8. Set direction state immediately (for parent className guard)
        setSwipedDirection(direction);

        // 9. Fire action immediately — the server call overlaps with the exit
        //    animation so the next card appears right after the exit completes.
        //    The swipeInFlight ref tells runAction to use a minimal advance delay.
        if (direction === "right") onSwipeRight();
        else if (direction === "left") onSwipeLeft();
        else if (direction === "up") onSwipeUp();
      } else {
        // Below threshold — snap back with spring bounce
        clearCssVars();
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

/* ── Swipe confetti ── */

type ConfettiType = "skipped" | "want_to_see" | "seen";

const CONFETTI_PALETTE: Record<ConfettiType, string[]> = {
  skipped: [
    "rgba(158,154,144,0.3)",
    "rgba(255,255,255,0.12)",
    "rgba(158,154,144,0.18)",
  ],
  want_to_see: ["#F4C542", "#FFD86B", "#FFE7A8", "rgba(244,197,66,0.6)"],
  seen: ["#F4C542", "#FFD86B", "#7A0F1D", "#FFE7A8", "rgba(244,197,66,0.85)"],
};

function generateConfetti(type: ConfettiType) {
  const count = type === "skipped" ? 5 : type === "want_to_see" ? 10 : 16;
  const palette = CONFETTI_PALETTE[type];
  const particles = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist =
      type === "skipped"
        ? 20 + Math.random() * 40
        : type === "want_to_see"
          ? 30 + Math.random() * 70
          : 40 + Math.random() * 110;

    // Directional bias matching the swipe gesture
    let bx = 0,
      by = 0;
    if (type === "skipped") {
      bx = -20 - Math.random() * 15;
      by = 8 + Math.random() * 12;
    }
    if (type === "want_to_see") {
      by = -40 - Math.random() * 30;
    }

    particles.push({
      x: Math.cos(angle) * dist + bx,
      y: Math.sin(angle) * dist + by,
      r: type === "skipped" ? 0 : Math.random() * 540 - 270,
      delay:
        Math.random() *
        (type === "seen" ? 40 : type === "want_to_see" ? 30 : 20),
      size:
        type === "skipped"
          ? 2.5 + Math.random() * 2
          : type === "want_to_see"
            ? 3 + Math.random() * 3.5
            : 4 + Math.random() * 5,
      color: palette[Math.floor(Math.random() * palette.length)],
      dur:
        type === "skipped"
          ? 250 + Math.random() * 100
          : type === "want_to_see"
            ? 300 + Math.random() * 150
            : 350 + Math.random() * 150,
      sx: 50 + (Math.random() - 0.5) * 20,
      sy:
        type === "want_to_see"
          ? 38 + Math.random() * 14
          : 44 + (Math.random() - 0.5) * 14,
      round: type === "skipped" || Math.random() > 0.45,
    });
  }

  return particles;
}

function SwipeConfetti({ type }: { type: ConfettiType }) {
  const [particles] = useState(() => generateConfetti(type));

  return (
    <div className="explore-confetti" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className={`explore-confetti-p explore-confetti-p--${type}`}
          style={
            {
              "--cx": `${p.x}px`,
              "--cy": `${p.y}px`,
              "--cr": `${p.r}deg`,
              "--cd": `${p.dur}ms`,
              "--cdl": `${p.delay}ms`,
              left: `${p.sx}%`,
              top: `${p.sy}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              borderRadius: p.round ? "50%" : "2px",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
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
  const [confetti, setConfetti] = useState<{
    type: ConfettiType;
    key: number;
  } | null>(null);

  // Refs for guards and timers
  const inFlight = useRef(false);
  const swipeInFlight = useRef(false); // true when current action was triggered by swipe
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

      const isSwipe = swipeInFlight.current;
      swipeInFlight.current = false;

      // Shared post-action handler
      function onSuccess(result: {
        actionType: "want_to_see" | "skipped" | "seen";
        musicalId: string;
        previousStatus: MusicalStatusValue | null;
        reviewId?: string;
        ratingInt?: number;
      }) {
        // Analytics
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

        // Track "seen" for session progress
        if (result.actionType === "seen") {
          setSeenThisSession((prev) => {
            const next = prev + 1;
            if (next === CHECKPOINT_AT && !checkpointShown.current) {
              checkpointShown.current = true;
              setShowCheckpoint(true);
            }
            return next;
          });
        }

        // Undo payload + status badge
        setUndoPayload({
          actionType: result.actionType,
          musicalId: result.musicalId,
          previousStatus: result.previousStatus,
          reviewId: result.reviewId,
        });
        setLastAction({ actionType: result.actionType, title: musicalTitle });
      }

      if (isSwipe) {
        // ── Optimistic: advance card immediately, server syncs in background ──
        setSelectedRating(null);
        setCurrentIndex((i) => i + 1);
        setPhase("idle");
        inFlight.current = false;

        action()
          .then(onSuccess)
          .catch((err) => {
            setPhase("error");
            setErrorMsg(
              err instanceof Error ? err.message : "Something went wrong",
            );
          });
        return;
      }

      // ── Button clicks: wait for server, show success glow, then advance ──
      try {
        const result = await action();

        setPhase("success");
        setTimeout(() => {
          setSelectedRating(null);
          setCurrentIndex((i) => i + 1);
          setPhase("idle");
          inFlight.current = false;
          onSuccess(result);
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
    swipeInFlight.current = true;
    setConfetti({ type: "seen", key: Date.now() });
    handleSeen();
  }, [musicals, currentIndex, emit, handleSeen]);

  const swipeLeft = useCallback(() => {
    const m = musicals[currentIndex];
    if (m) emit("explore_swipe_triggered", { musicalId: m.id, direction: "left" });
    swipeInFlight.current = true;
    setConfetti({ type: "skipped", key: Date.now() });
    handleSkip();
  }, [musicals, currentIndex, emit, handleSkip]);

  const swipeUp = useCallback(() => {
    const m = musicals[currentIndex];
    if (m) emit("explore_swipe_triggered", { musicalId: m.id, direction: "up" });
    swipeInFlight.current = true;
    setConfetti({ type: "want_to_see", key: Date.now() });
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

  // Auto-clear confetti after animations finish
  useEffect(() => {
    if (!confetti) return;
    const timer = setTimeout(() => setConfetti(null), 600);
    return () => clearTimeout(timer);
  }, [confetti]);

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

      {/* Swipe confetti */}
      {confetti && <SwipeConfetti key={confetti.key} type={confetti.type} />}

      {/* Card */}
      <div
        ref={cardRef}
        key={musical.id}
        className={[
          "explore-card",
          musical.image_url ? "explore-card--has-image" : "",
          phase === "success" && !swipedDirection ? "explore-card--success" : "",
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
