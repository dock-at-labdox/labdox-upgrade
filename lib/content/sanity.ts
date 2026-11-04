import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? "production";

export const isSanityConfigured = Boolean(projectId);

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId: projectId!,
      dataset,
      apiVersion: "2026-11-04",
      useCdn: true,
      perspective: "published",
    })
  : null;

export const MICROCOPY_QUERY = `{
  "settings": *[
    _type == "globalSettings" &&
    _id == "globalSettings"
  ][0].microcopy,
  "prompts": *[
    _type == "intentPrompt" &&
    status == "published" &&
    journey in ["blue", "red"] &&
    kind in ["placeholder", "starter_chip"]
  ] | order(priority asc) {
    journey,
    kind,
    label,
    priority,
    mapsTo
  }
}`;

export async function fetchSanityMicrocopy() {
  if (!sanityClient) {
    return null;
  }

  return sanityClient.fetch(MICROCOPY_QUERY);
}
