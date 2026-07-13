import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { EvidenceFooter, EvidenceHeader } from "../evidence-chrome";

export const metadata: Metadata = {
  title: "How JustEnough works — JustEnough",
  description:
    "How JustEnough turns similar benchmark cases into an evidence-backed model and reasoning-effort recommendation.",
};

const workflow = [
  {
    number: "01",
    label: "Interpret",
    title: "Understand the task",
    method: "LLM or local parser",
    output: "intent · tools · surfaces · constraints",
  },
  {
    number: "02",
    label: "Retrieve",
    title: "Find analogues",
    method: "Facets + lexical + optional vectors",
    output: "comparable benchmark cases",
  },
  {
    number: "03",
    label: "Measure",
    title: "Read outcomes",
    method: "Published trials only",
    output: "passes / attempts by exact config",
  },
  {
    number: "04",
    label: "Decide",
    title: "Apply the gate",
    method: "Fixed statistical policy",
    output: "coverage + conservative reliability",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EvidenceHeader current="method" />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
          <p className="eyebrow">How it works</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            From a task description to an evidence-backed route.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The model interprets. Benchmarks supply outcomes. A fixed gate recommends—or
            admits there is not enough evidence.
          </p>
        </section>

        <section className="border-y border-border bg-surface">
          <figure
            aria-labelledby="workflow-title"
            className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
          >
            <figcaption className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">The workflow</p>
                <h2
                  className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl"
                  id="workflow-title"
                >
                  One task in. One honest decision out.
                </h2>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                judgment → evidence → policy
              </p>
            </figcaption>

            <div className="grid items-stretch gap-0 lg:grid-cols-[1fr_1.75rem_1fr_1.75rem_1fr_1.75rem_1fr_1.75rem_1.15fr]">
              {workflow.map((step, index) => (
                <Fragment key={step.number}>
                  <article className="flex min-h-44 flex-col border border-border bg-background p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-semibold text-enough-strong">
                        {step.number}
                      </span>
                      <span className="section-label">{step.label}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-[-0.025em]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {step.method}
                    </p>
                    <p className="mt-auto border-t border-border pt-4 font-mono text-[11px] leading-5">
                      {step.output}
                    </p>
                    {index === 3 ? (
                      <div className="mt-3 space-y-1 font-mono text-[10px] text-muted-foreground">
                        <p>coverage ≥ 3 cases</p>
                        <p>90% Wilson lower bound ≥ target</p>
                      </div>
                    ) : null}
                  </article>
                  <div
                    aria-hidden="true"
                    className="flex h-8 items-center justify-center font-mono text-lg text-enough-strong lg:h-auto"
                  >
                    <span className="lg:hidden">↓</span>
                    <span className="hidden lg:inline">→</span>
                  </div>
                </Fragment>
              ))}

              <article className="grid min-h-44 grid-rows-2 border-2 border-enough-strong bg-surface-raised">
                <div className="p-4 sm:p-5">
                  <p className="section-label text-positive">Eligible</p>
                  <h3 className="mt-2 font-semibold">Recommend</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Lowest-effort route that clears the target.
                  </p>
                </div>
                <div className="border-t border-border p-4 sm:p-5">
                  <p className="section-label text-warning">Insufficient</p>
                  <h3 className="mt-2 font-semibold">Abstain</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Show which evidence is missing.
                  </p>
                </div>
              </article>
            </div>

            <div className="mt-5 grid gap-2 border-l-2 border-enough pl-4 text-xs leading-5 text-muted-foreground sm:grid-cols-2 sm:gap-6">
              <p>
                <strong className="text-foreground">LLM judgment:</strong> task profiling,
                optional reranking, and explanation.
              </p>
              <p>
                <strong className="text-foreground">Evidence authority:</strong> published
                outcomes and the fixed eligibility policy.
              </p>
            </div>
          </figure>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Worked example</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                Follow one task through.
              </h2>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              DeepSWE v1.1 snapshot
            </p>
          </div>

          <div className="mt-7 grid border border-border bg-border md:grid-cols-[1.7fr_repeat(4,1fr)] md:gap-px">
            <div className="bg-surface p-5">
              <p className="metric-label">Task · 70% target</p>
              <p className="mt-3 text-sm font-medium leading-6">
                Add a Python CLI feature, update configuration, and add regression tests.
              </p>
            </div>
            <div className="border-t border-border bg-surface p-5 md:border-t-0">
              <p className="metric-label">Retrieved</p>
              <p className="mt-3 font-mono text-2xl tabular-nums">8 cases</p>
            </div>
            <div className="border-t border-border bg-surface p-5 md:border-t-0">
              <p className="metric-label">Observed</p>
              <p className="mt-3 font-mono text-2xl tabular-nums">29 / 32</p>
            </div>
            <div className="border-t border-border bg-surface p-5 md:border-t-0">
              <p className="metric-label">Lower bound</p>
              <p className="mt-3 font-mono text-2xl tabular-nums">79%</p>
            </div>
            <div className="border-t-2 border-enough-strong bg-surface-raised p-5 md:border-l-2 md:border-t-0">
              <p className="metric-label">Route</p>
              <p className="mt-3 font-mono text-sm font-semibold">claude-fable-5</p>
              <p className="mt-1 text-xs text-muted-foreground">xhigh · mini-swe-agent</p>
            </div>
          </div>

          <Link
            className="mt-4 inline-flex text-sm font-semibold underline decoration-enough decoration-2 underline-offset-4"
            href="/evidence/deepswe/v1.1/mobly-grouped-test-barriers"
          >
            Inspect a supporting evidence case →
          </Link>
        </section>

        <section className="border-y border-border bg-muted">
          <div className="mx-auto grid max-w-6xl gap-px bg-border px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
            <article className="bg-surface p-5 sm:p-6">
              <p className="eyebrow">The LLM can</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                Interpret, rerank, explain.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                It helps connect the user’s prose to safe benchmark summaries.
              </p>
            </article>
            <article className="bg-surface p-5 sm:p-6">
              <p className="eyebrow">The LLM cannot</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                Rewrite trials or vote for itself.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Counts, bounds, and route eligibility remain deterministic.
              </p>
            </article>
          </div>
          <p className="mx-auto max-w-6xl px-4 pb-12 text-xs leading-5 text-muted-foreground sm:px-6 lg:px-8">
            Current scope: repository and terminal software work. Similar cases are
            evidence—not proof—and reasoning effort remains a proxy until cost and latency
            are normalized.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 border-t-2 border-enough bg-surface-raised px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="section-label">Try the method</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Bring a task. We’ll bring the caveats.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center rounded-sm bg-enough px-4 text-sm font-semibold text-enough-foreground hover:bg-enough-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/"
              >
                Route a task
              </Link>
              <Link
                className="inline-flex h-10 items-center rounded-sm border border-input px-4 text-sm font-semibold hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/evidence"
              >
                Browse evidence
              </Link>
            </div>
          </div>
        </section>
      </main>
      <EvidenceFooter />
    </div>
  );
}
