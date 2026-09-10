import { LegalArticle } from "@/components/legal/LegalArticle";

export default function PrivacyPage() {
  return (
    <LegalArticle title="Privacy Policy" version="privacy-v1-draft">
      <p>
        You can browse this website without giving us personal information. Journey answers stay anonymous unless you
        choose otherwise. Name and contact details are stored only when you submit a form after ticking a consent box.
      </p>
      <h2 className="text-xl text-ink">What we collect</h2>
      <p>
        Anonymous journey data (pill choice, quiz answers, pages viewed) to generate a recommendation. Typed goals only
        if you switch on “Save my answer”. Contact details only on a consented form. Analytics events only after you
        accept analytics cookies — never your typed text.
      </p>
      <h2 className="text-xl text-ink">AI-generated recommendations</h2>
      <p>
        Recommendations may use a rules engine and, when enabled, Google Gemini. Inputs are sent solely to generate
        your recommendation. They are guidance, not professional career advice, and are limited to the published
        catalogue.
      </p>
      <h2 className="text-xl text-ink">Cookies</h2>
      <p>
        Essential: one session cookie. Analytics: opt-in. No advertising or cross-site tracking cookies.
      </p>
      <h2 className="text-xl text-ink">Retention</h2>
      <p>
        Anonymous sessions: 90 days. Unconverted leads: 12 months. Feedback: 12 months. Server logs: 30 days.
      </p>
      <h2 className="text-xl text-ink">Your rights</h2>
      <p>
        Under the DPDP Act 2023 you may access, correct, erase, withdraw consent, nominate someone to exercise your
        rights, and complain. Contact details for the grievance officer are placeholders until the owner fills them.
      </p>
    </LegalArticle>
  );
}
