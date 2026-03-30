"use client";
import { useState, useCallback } from "react";

export interface DailyStats {
  wins: number;
  winsWithHint: number;
  losses: number;
}

export interface GameResult {
  songId: string;
  outcome: "won" | "lost";
  hintUsed: boolean;
  timeSpent: number;
  rightLetters: number;
  wrongLetters: number;
}

export interface NTSSessionReturn {
  deviceId: string;
  todayStats: DailyStats;
  recordResult: (result: GameResult) => void;
}

// UTC date string: 'YYYY-MM-DD'
function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem("nts-device-id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("nts-device-id", id);
    return id;
  } catch {
    // localStorage unavailable (SSR, private browsing)
    return "anonymous";
  }
}

function loadTodayStats(): DailyStats {
  try {
    const raw = localStorage.getItem(`nts-v1-stats-${utcDateKey()}`);
    if (raw) return JSON.parse(raw) as DailyStats;
  } catch {}
  return { wins: 0, winsWithHint: 0, losses: 0 };
}

function saveTodayStats(stats: DailyStats): void {
  try {
    localStorage.setItem(`nts-v1-stats-${utcDateKey()}`, JSON.stringify(stats));
  } catch {}
}

function hasResultForToday(songId: string): boolean {
  try {
    return localStorage.getItem(`nts-v1-result-${songId}-${utcDateKey()}`) !== null;
  } catch {
    return false;
  }
}

function saveResult(result: GameResult): void {
  try {
    const { songId, ...rest } = result;
    localStorage.setItem(
      `nts-v1-result-${songId}-${utcDateKey()}`,
      JSON.stringify(rest)
    );
  } catch {}
}

export function useNTSSession(): NTSSessionReturn {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [todayStats, setTodayStats] = useState<DailyStats>(() => loadTodayStats());

  const recordResult = useCallback((result: GameResult) => {
    // Dedup: if this song was already recorded today, do nothing
    if (hasResultForToday(result.songId)) return;

    saveResult(result);

    const current = loadTodayStats();
    const updated: DailyStats = {
      wins: current.wins + (result.outcome === "won" ? 1 : 0),
      winsWithHint: current.winsWithHint + (result.outcome === "won" && result.hintUsed ? 1 : 0),
      losses: current.losses + (result.outcome === "lost" ? 1 : 0),
    };
    saveTodayStats(updated);
    setTodayStats(updated);
  }, []);

  return { deviceId, todayStats, recordResult };
}
