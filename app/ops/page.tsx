import { StubPage } from "@/components/pages/StubPage";

export const metadata = { robots: { index: false, follow: false } };

export default function OpsPage() {
  return (
    <StubPage
      title="Journey Ops"
      job="Internal lead queue and session timeline — not a CRM. Staff auth lands in Sprint 6."
    />
  );
}
