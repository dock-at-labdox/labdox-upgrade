import { StubPage } from "@/components/pages/StubPage";

export const metadata = { robots: { index: false, follow: false } };

export default function ClarifyPage() {
  return (
    <StubPage
      title="One more thing"
      job="Shown only when classifier confidence is below 0.75. Skip is allowed. This is a follow-up, not a category wall."
    />
  );
}
