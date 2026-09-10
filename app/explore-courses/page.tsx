import { getMicrocopy } from "@/lib/content";
import { StubPage } from "@/components/pages/StubPage";

export default async function ExploreCoursesPage() {
  const copy = await getMicrocopy();
  return (
    <StubPage title="I know what I want" job={copy.blue.prompt}>
      <p>
        Blue is stated intent plus a deterministic match — never Gemini, never a Student / Entrepreneur /
        Professional wall (DEC-041).
      </p>
      <label className="mt-6 block font-mono text-sm text-electric" htmlFor="blue-intent">
        {copy.blue.prompt}
      </label>
      <input
        id="blue-intent"
        name="intent"
        disabled
        placeholder={copy.blue.placeholder[0]}
        className="mt-2 w-full rounded-full border border-electric bg-electric-soft px-5 py-4 text-ink placeholder:text-ink-dim"
      />
      <ul className="mt-4 flex flex-wrap gap-2">
        {copy.blue.placeholder.map((chip) => (
          <li key={chip}>
            <span className="inline-flex min-h-11 items-center rounded-full border border-hairline px-4 font-mono text-sm text-electric">
              {chip}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">Matching and the optional clarifier ship in Sprint 2. {copy.switch.toRed}</p>
    </StubPage>
  );
}
