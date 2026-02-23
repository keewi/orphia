"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // If no session returned, email confirmation is required
      if (!data.session) {
        setConfirmationSent(true);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  // Show confirmation message after successful sign-up
  if (confirmationSent) {
    return (
      <div className="page-container">
        <div className="login-container">
          <div className="form-card">
            <h1>Check Your Email</h1>
            <p className="login-subtitle" style={{ margin: "0 0 1rem" }}>
              We sent a confirmation link to <strong>{email}</strong>.
              Click the link in your email to activate your account,
              then come back here to sign in.
            </p>
            <button
              type="button"
              className="btn btn-submit"
              onClick={() => {
                setConfirmationSent(false);
                setIsSignUp(false);
                setPassword("");
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="login-container">
        <div className="form-card">
          <h1>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p className="login-subtitle">
            {isSignUp
              ? "Sign up to start tracking your theatre experiences"
              : "Sign in to your Orphia account"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                minLength={6}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-submit"
                disabled={loading}
              >
                {loading
                  ? "Loading..."
                  : isSignUp
                    ? "Sign Up"
                    : "Sign In"}
              </button>
            </div>
          </form>

          <p className="login-toggle">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              className="login-toggle-btn"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setPassword("");
              }}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
