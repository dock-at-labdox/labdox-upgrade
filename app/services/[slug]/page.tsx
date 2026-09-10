import { StubPage } from "@/components/pages/StubPage";

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StubPage title="Service" job={`Detail route for ${slug}.`} />;
}
