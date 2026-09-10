import { getMicrocopy } from "@/lib/content";
import { BelowFold } from "@/components/home/BelowFold";
import { PillFork } from "@/components/home/PillFork";

export default async function HomePage() {
  const microcopy = await getMicrocopy();
  return (
    <>
      <PillFork microcopy={microcopy} />
      <BelowFold />
    </>
  );
}
