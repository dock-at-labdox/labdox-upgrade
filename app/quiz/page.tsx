import { StubPage } from "@/components/pages/StubPage";

export const metadata = { robots: { index: false, follow: false } };

export default function QuizPage() {
  return (
    <StubPage
      title="Quiz"
      job="Card-based questions, one per screen. Skip after step 1. URL step state lands with the Red journey."
    />
  );
}
