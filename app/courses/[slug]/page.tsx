import { StubPage } from "@/components/pages/StubPage";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StubPage title="Course" job={`Detail route for ${slug}. Explore chips and match reasons come later.`} />;
}
