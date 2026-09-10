import { StubPage } from "@/components/pages/StubPage";

export const metadata = { robots: { index: false, follow: false } };

export default async function PathPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <StubPage
      title="Your path"
      job={`Personal recommendation instance (${token.slice(0, 8)}…). noindex. Seven result slots land in Sprint 3.`}
    />
  );
}
