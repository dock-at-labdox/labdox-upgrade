import { LegalArticle } from "@/components/legal/LegalArticle";

export default function AccessibilityPage() {
  return (
    <LegalArticle title="Accessibility" version="WCAG 2.2 AA">
      <p>
        Labdox aims to meet WCAG 2.2 AA. The pill fork uses real links. Colour is never the only cue. Motion is gated
        by <code className="font-mono text-phosphor-text">prefers-reduced-motion</code>.
      </p>
      <p>
        Keyboard: visible 2px focus rings, skip-to-content, and no journey traps. If you find a barrier, use the
        contact page — the accessibility contact address is a placeholder until the owner supplies it.
      </p>
    </LegalArticle>
  );
}
