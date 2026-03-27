"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { claimHandle, checkHandleAvailability } from "@/app/actions";

export default function ChooseHandlePage() {
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate handle format (returns error message or null)
  function validate(value: string): string | null {
    if (value.length === 0) return null;
    if (value.length < 3) return "Must be at least 3 characters";
    if (value.length > 20) return "Must be 20 characters or fewer";
    if (!/^[a-z0-9_]+$/.test(value)) return "Only lowercase letters, numbers, and underscores";
    return null;
  }

  // Debounced uniqueness check
  const checkAvailability = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const formatError = validate(value);
      if (formatError || value.length === 0) {
        setError(formatError);
        setAvailable(false);
        setChecking(false);
        return;
      }

      setChecking(true);
      setError(null);
      setAvailable(false);

      debounceRef.current = setTimeout(async () => {
        const result = await checkHandleAvailability(value);
        if (result.taken) {
          setError("Handle already taken");
          setAvailable(false);
        } else {
          setError(null);
          setAvailable(true);
        }
        setChecking(false);
      }, 300);
    },
    [],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setHandle(raw);
    checkAvailability(raw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formatError = validate(handle);
    if (formatError) {
      setError(formatError);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await claimHandle(handle);
    if (!result.ok) {
      setError(result.error ?? "Failed to claim handle");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="page-container">
      <div className="login-container">
        <div className="form-card">
          <h1>Choose your handle</h1>
          <p className="login-subtitle">
            Pick a unique username for your public Orphia profile
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="handle">Handle</label>
              <div className="handle-input-wrapper">
                <span className="handle-prefix">@</span>
                <input
                  id="handle"
                  type="text"
                  value={handle}
                  onChange={handleInputChange}
                  placeholder="yourname"
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>
              {error && <p className="handle-error">{error}</p>}
              {available && !checking && (
                <p className="handle-available">@{handle} is available!</p>
              )}
              {checking && (
                <p className="handle-checking">Checking...</p>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-submit"
                disabled={loading || !available || checking}
              >
                {loading ? "Claiming..." : `Claim @${handle || "..."}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
