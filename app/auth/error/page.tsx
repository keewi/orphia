import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="page-container">
      <div className="login-container">
        <div className="form-card" style={{ textAlign: "center" }}>
          <h1>Confirmation Failed</h1>
          <p className="login-subtitle" style={{ margin: "0 0 1.5rem" }}>
            The confirmation link is invalid or has expired. Please try signing
            up again or request a new confirmation email.
          </p>
          <Link href="/login" className="btn btn-submit">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
