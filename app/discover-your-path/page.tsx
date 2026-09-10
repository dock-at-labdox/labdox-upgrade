import { getMicrocopy } from "@/lib/content";
import { StubPage } from "@/components/pages/StubPage";

export default async function DiscoverPage() {
  const microcopy = await getMicrocopy();
  return (
    <StubPage title="Discover your path" job={microcopy.red.prompt}>
      <p>Red is a card-based quiz, not a chatbot (DEC-021). The five-step flow lands in Sprint 3.</p>
      <p>
        Phosphor is ambient chrome on this journey. The pill that brought you here is crimson — that identity stays
        on the fork.
      </p>
    </StubPage>
  );
}
