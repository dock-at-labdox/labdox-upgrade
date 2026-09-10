import { LegalArticle } from "@/components/legal/LegalArticle";

export default function TermsPage() {
  return (
    <LegalArticle title="Terms of Use" version="terms-v1-draft">
      <p>
        This website provides information about Labdox courses, tracks, services and engagements, and an interactive
        discovery experience. It does not process payments or complete enrolments.
      </p>
      <h2 className="text-xl text-ink">Recommendations are guidance</h2>
      <p>
        Path and course recommendations are informational. They are not a guarantee of admission, employment,
        placement, or salary. Alumni employment names do not imply endorsement or partnership.
      </p>
      <h2 className="text-xl text-ink">Acceptable use</h2>
      <p>
        Do not spam forms, scrape personal-data endpoints, access other visitors’ data, or probe the AI features.
      </p>
      <h2 className="text-xl text-ink">Governing law</h2>
      <p>These Terms are governed by the laws of India. Courts at Pune, Maharashtra have exclusive jurisdiction.</p>
    </LegalArticle>
  );
}
