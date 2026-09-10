import { StubPage } from "@/components/pages/StubPage";

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StubPage title="Tool" job={`Calculator engine route for ${slug}.`} />;
}
