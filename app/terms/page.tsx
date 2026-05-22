export const metadata = {
  title: "Terms of Service — ORPHEA",
};

export default function TermsPage() {
  return (
    <div className="page-container">
      <article className="prose-page">
        <h1>Terms of Service</h1>
        <p><em>Last updated: April 8, 2026</em></p>

        <p>
          Welcome to ORPHEA. By creating an account or using the site, you
          agree to these terms. ORPHEA is a personal project provided as-is,
          without warranty of any kind.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>You must be at least 13 years old to use ORPHEA.</li>
          <li>
            You&apos;re responsible for keeping your sign-in credentials
            secure and for activity on your account.
          </li>
          <li>
            Choose a handle that isn&apos;t impersonating someone else and
            isn&apos;t hateful or abusive.
          </li>
        </ul>

        <h2>Your content</h2>
        <p>
          You own the reviews, ratings, and other content you post. By posting,
          you grant ORPHEA a non-exclusive license to display that content to
          other users of the site. Don&apos;t post content that is unlawful,
          infringing, harassing, or spam.
        </p>

        <h2>Games and scoring</h2>
        <p>
          Daily game results, scores, and streaks are provided for fun. We
          reserve the right to correct, remove, or reset puzzles and results
          if we find errors or abuse.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>Don&apos;t scrape, automate, or attempt to break the site.</li>
          <li>Don&apos;t attempt to access other users&apos; accounts.</li>
          <li>Don&apos;t use ORPHEA for anything illegal.</li>
        </ul>

        <h2>Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms. You
          can stop using ORPHEA at any time; see the Privacy Policy for how
          to request data deletion.
        </p>

        <h2>Disclaimer</h2>
        <p>
          ORPHEA is provided &quot;as is&quot; without warranty of any kind,
          express or implied. To the maximum extent permitted by law, the
          developer is not liable for any damages arising from use of the
          site.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms occasionally. Continued use after a change
          means you accept the new terms.
        </p>
      </article>
    </div>
  );
}
