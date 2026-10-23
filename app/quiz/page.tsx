import { QuizFlow } from "@/components/quiz/QuizFlow";

export const metadata = {
  robots: { index: false, follow: false },
};

type QuizPageProps = {
  searchParams: Promise<{ step?: string }>;
};

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;
  const parsedStep = Number(params.step ?? "1");
  const step =
    Number.isInteger(parsedStep) && parsedStep >= 1 && parsedStep <= 5
      ? parsedStep
      : 1;

  return <QuizFlow initialStep={step} />;
}
