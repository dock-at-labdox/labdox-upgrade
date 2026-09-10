import { StubPage } from "@/components/pages/StubPage";

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StubPage title="Article" job={`Editorial route for ${slug}. No generated claims in the body.`} />;
}
