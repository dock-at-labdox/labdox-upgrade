import { StubPage } from "@/components/pages/StubPage";

const ORIGIN_YEAR = 1965;
const years = new Date().getFullYear() - ORIGIN_YEAR;

export default function ConglomerateJourneyPage() {
  return (
    <StubPage
      title="Group journey"
      job={`Group history, not Labdox. Founded in ${ORIGIN_YEAR} — over ${years} years.`}
    />
  );
}
