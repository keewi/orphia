"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/app/actions";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      const result = await registerUser(email, password);
      if (!result.ok) {
        setError(result.error ?? "Sign up failed");
        setLoading(false);
        return;
      }
    }

    // Sign in (or auto-sign-in after registration)
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="page-container">
      <div className="login-container">
        <div className="form-card">
          <h1>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p className="login-subtitle">
            {isSignUp
              ? "Sign up to start building your playbill collection"
              : "Sign in to your ORPHEA account"}
          </p>

          <button
            type="button"
            className="btn btn-google"
            disabled={loading}
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Continue with Google
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

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
