import Link from "next/link";

export default function ConfirmedPage() {
  return (
    <div className="page-container">
      <div className="login-container">
        <div className="form-card" style={{ textAlign: "center" }}>
          <h1>Email Confirmed</h1>
          <p className="login-subtitle" style={{ margin: "0 0 1.5rem" }}>
            Your account has been verified. You are now signed in.
          </p>
          <Link href="/" className="btn btn-submit">
            Go to Orphia
          </Link>
        </div>
      </div>
    </div>
  );
}
