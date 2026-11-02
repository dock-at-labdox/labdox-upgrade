"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getOutcomeQuestion,
  getPassionQuestion,
  GOAL_OPTIONS,
  OUTCOME_OPTIONS,
  PASSION_OPTIONS,
  PERSONA_OPTIONS,
  QUIZ_STEPS,
  TIME_OPTIONS,
} from "@/components/quiz/question-bank";

type Answers = {
  goal?: string;
  persona?: string;
  passion?: string;
  outcome?: string;
  time?: string;
};

type QuizFlowProps = {
  initialStep: number;
};

const BLUE_ROUTE = "/explore-courses";

const PASSION_ICONS: Record<string, string> = {
  building: "\u{1F6E0}\u{FE0F}",
  analyzing: "\u{1F50E}",
  creating: "\u{1F3A8}",
  helping: "\u{1F91D}",
  persuading: "\u{1F4AC}",
  organizing: "\u{1F4CB}",
};

const QUESTIONS = [
  { key: "goal", title: "What would you like to achieve?", options: GOAL_OPTIONS },
  { key: "persona", title: "Which best describes you?", options: PERSONA_OPTIONS },
  { key: "passion", title: "", options: PASSION_OPTIONS },
  { key: "outcome", title: "", options: OUTCOME_OPTIONS },
  { key: "time", title: "What learning pace works for you?", options: TIME_OPTIONS },
] as const;

export function QuizFlow({ initialStep }: QuizFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [answers, setAnswers] = useState<Answers>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  const question = QUESTIONS[step - 1];
  const selected = answers[question.key as keyof Answers];

  const title =
    step === 3
      ? getPassionQuestion(answers.persona)
      : step === 4
        ? getOutcomeQuestion(answers.goal, answers.persona)
        : question.title;

  function navigate(nextStep: number) {
    setStep(nextStep);
    startTransition(() => {
      router.push(`/quiz?step=${nextStep}`);
    });
  }

  function choose(value: string) {
    setAnswers((previous) => ({ ...previous, [question.key]: value }));
  }

  function skip() {
    setAnswers((previous) => {
      const next = { ...previous };
      delete next[question.key as keyof Answers];
      return next;
    });

    if (step < QUIZ_STEPS) {
      navigate(step + 1);
    } else {
      router.push(BLUE_ROUTE);
    }
  }

  function continueQuiz() {
    if (step < QUIZ_STEPS) {
      navigate(step + 1);
    } else {
      router.push(BLUE_ROUTE);
    }
  }

  if (isPending) {
    return (
      <section aria-live="polite" aria-busy="true" className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-ink-dim">Loading your next question...</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl border border-hairline bg-surface" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="font-mono text-sm text-ink-dim">YOUR PATH - STEP {step} OF {QUIZ_STEPS}</p>
        <button
          type="button"
          onClick={skip}
          className="rounded px-3 py-2 text-sm text-ink-dim underline underline-offset-4 hover:text-ink"
        >
          Skip
        </button>
      </div>

      <div
        className="mb-10 h-2 overflow-hidden rounded-full bg-hairline"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={1}
        aria-valuemax={QUIZ_STEPS}
        aria-valuenow={step}
      >
        <div
          className="h-full rounded-full bg-crimson transition-all"
          style={{ width: `${(step / QUIZ_STEPS) * 100}%` }}
        />
      </div>

      <section aria-labelledby="quiz-question">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-crimson">
          QUESTION {step}
        </p>
        <h1 id="quiz-question" className="text-3xl font-semibold text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-ink-dim">Choose an option, or skip if you are not sure yet.</p>

        <fieldset className="mt-8">
          <legend className="sr-only">{title}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {question.options.map((option) => {
              const isSelected = selected === option.slug;

              return (
                <button
                  key={option.slug}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => choose(option.slug)}
                  className={`min-h-24 rounded-xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson ${
                    isSelected
                      ? "border-crimson bg-crimson/10 text-ink"
                      : "border-hairline bg-surface text-ink hover:border-crimson/60"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    {step === 3 && (
                      <span aria-hidden="true" className="mr-3 text-2xl">
                        {PASSION_ICONS[option.slug] ?? "\u2022"}
                      </span>
                    )}
                    <span>{option.label}</span>
                    <span aria-hidden="true" className="font-semibold">
                      {isSelected ? "\u2713" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => router.push("/discover-your-path")}
            className="rounded-lg border border-hairline px-5 py-3 text-ink hover:border-crimson"
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(step - 1)}
            className="rounded-lg border border-hairline px-5 py-3 text-ink hover:border-crimson"
          >
            Back
          </button>
        )}

        <button
          type="button"
          onClick={continueQuiz}
          className="rounded-lg bg-crimson px-6 py-3 font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
        >
          {step === QUIZ_STEPS ? "Finish questions" : "Continue"}
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Step {step} of {QUIZ_STEPS}
      </p>
    </main>
  );
}


