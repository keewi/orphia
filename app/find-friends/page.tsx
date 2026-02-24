"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FindFriendsPage() {
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setHandle(raw);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (handle.length < 3) {
      setError("Handles are at least 3 characters");
      return;
    }

    router.push(`/u/${handle}`);
  }

  return (
    <div className="page-container">
      <div className="find-friends-container">
        <div className="form-card">
          <h1>Find Friends</h1>
          <p className="login-subtitle">
            Look up a friend by their Orphia handle
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="friend-handle">Handle</label>
              <div className="handle-input-wrapper">
                <span className="handle-prefix">@</span>
                <input
                  id="friend-handle"
                  type="text"
                  value={handle}
                  onChange={handleInputChange}
                  placeholder="emilyyeh"
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>
              {error && <p className="handle-error">{error}</p>}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-submit"
                disabled={handle.length < 3}
              >
                View Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
