import { StubPage } from "@/components/pages/StubPage";

export default async function QuizResultPage({ params }: { params: Promise<{ archetype: string }> }) {
  const { archetype } = await params;
  return (
    <StubPage
      title="Path snapshot"
      job={`Shareable archetype page for “${archetype}”. Personal data does not live here.`}
    />
  );
}
