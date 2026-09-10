import { StubPage } from "@/components/pages/StubPage";
import { TRACKS } from "@/lib/taxonomy/constants";

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const named = TRACKS.find((item) => item.slug === track);
  return (
    <StubPage
      title={named?.name ?? "Career track"}
      job="Track detail is assembled from CMS pageTemplate slots. Catalogue membership is seeded; this page is a route stub."
    />
  );
}

export function generateStaticParams() {
  return TRACKS.map((track) => ({ track: track.slug }));
}
