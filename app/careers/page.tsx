import { StubPage } from "@/components/pages/StubPage";

export default function CareersPage() {
  return (
    <StubPage title="Careers" job="No open roles are published until OQ-010 is answered. Register interest — this is not “coming soon”.">
      <form className="max-w-md space-y-4" action="#" method="post">
        <div>
          <label htmlFor="career-name" className="block text-sm text-ink">
            Name
          </label>
          <input
            id="career-name"
            name="name"
            className="mt-1 w-full rounded-lg border border-hairline bg-void px-3 py-3"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="career-email" className="block text-sm text-ink">
            Email
          </label>
          <input
            id="career-email"
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-hairline bg-void px-3 py-3"
            autoComplete="email"
          />
        </div>
        <div className="flex items-start gap-3">
          <input id="career-consent" name="consent" type="checkbox" className="mt-1 h-6 w-6" />
          <label htmlFor="career-consent" className="text-sm">
            I agree that Labdox may store these details to respond to my interest, as described in the Privacy Policy
            (privacy-v1-draft).
          </label>
        </div>
        <button
          type="submit"
          disabled
          className="min-h-11 rounded-full border border-phosphor px-5 text-phosphor"
        >
          Submit (wiring in Sprint 6)
        </button>
      </form>
    </StubPage>
  );
}
