"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function FindFriendsPage() {
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setHandle(raw);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (handle.length < 3) {
      setError("Handles are at least 3 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/lookup-handle?handle=${encodeURIComponent(handle)}`);
      const body = await res.json();

      if (res.ok) {
        router.push(`/u/${body.handle}`);
        return;
      }

      switch (body.code) {
        case "USER_NOT_FOUND":
          setError(`No user found with handle '@${handle}'. Check spelling and try again.`);
          break;
        case "CANNOT_ADD_SELF":
          setError("You can\u2019t look up yourself.");
          break;
        case "INVALID_HANDLE":
          setError("Enter a valid handle (3\u201320 characters, letters, numbers, underscores).");
          break;
        default:
          setError("Something went wrong. Try again.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="page-container">
      <div className="find-friends-container">
        <div className="form-card">
          <h1>Find Friends</h1>
          <p className="login-subtitle">
            Look up a friend by their ORPHEA handle
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="friend-handle">Handle</label>
              <div className="handle-input-wrapper">
                <span className="handle-prefix">@</span>
                <input
                  ref={inputRef}
                  id="friend-handle"
                  type="text"
                  value={handle}
                  onChange={handleInputChange}
                  placeholder="emilyyeh"
                  autoComplete="off"
                  autoCapitalize="off"
                  disabled={loading}
                />
              </div>
              {error && <p className="handle-error">{error}</p>}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-submit"
                disabled={handle.length < 3 || loading}
              >
                {loading ? "Searching\u2026" : "View Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
