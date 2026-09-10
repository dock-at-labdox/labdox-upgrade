/** Deterministic keyword/synonym classifier — always runs first (DEC-026). Full map is Sprint 2. */
export type Classification = {
  intentTag: string | null;
  domainSlug: string | null;
  audience: string | null;
  confidence: number;
};

export function classifyStatement(text: string): Classification {
  void text;
  return { intentTag: null, domainSlug: null, audience: null, confidence: 0 };
}
