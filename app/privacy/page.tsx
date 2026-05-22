export const metadata = {
  title: "Privacy Policy — ORPHEA",
};

export default function PrivacyPage() {
  return (
    <div className="page-container">
      <article className="prose-page">
        <h1>Privacy Policy</h1>
        <p><em>Last updated: April 8, 2026</em></p>

        <p>
          ORPHEA (&quot;we&quot;, &quot;us&quot;) is a personal project that lets
          musical-theatre fans track shows they&apos;ve seen and play daily
          games. This policy explains what we collect and why.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account info.</strong> When you sign in with Google, we
            receive your email address and Google account ID. If you sign up
            with email and password, we store your email and a hashed password.
          </li>
          <li>
            <strong>Profile info.</strong> A handle you choose, and any
            playbills, ratings, watch dates, follows, and game results you
            create on ORPHEA.
          </li>
          <li>
            <strong>Technical info.</strong> Standard server logs (IP,
            timestamp, request path) for debugging and abuse prevention.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To sign you in and keep your session active.</li>
          <li>To show you your own playbills, reviews, and game history.</li>
          <li>To show your public profile to other ORPHEA users.</li>
          <li>To operate the daily games and compute scores.</li>
        </ul>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell your data.</li>
          <li>We do not run advertising or ad-tracking.</li>
          <li>
            We do not request any Google scopes beyond basic profile and email
            (<code>openid</code>, <code>email</code>, <code>profile</code>).
          </li>
        </ul>

        <h2>Data deletion</h2>
        <p>
          To delete your account and associated data, email the address on
          our contact page. We&apos;ll process the request within a reasonable
          time.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Contact the developer via the support
          email listed on our Google OAuth consent screen.
        </p>
      </article>
    </div>
  );
}
