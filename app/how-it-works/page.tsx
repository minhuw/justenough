import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceFooter, EvidenceHeader } from "../evidence-chrome";

export const metadata: Metadata = {
  title: "How JustEnough works — JustEnough",
  description:
    "How JustEnough turns similar benchmark cases into an evidence-backed model and reasoning-effort recommendation.",
};

const pipeline = [
  {
    number: "01",
    title: "Profile the task",
    copy: "Turn the description into intent, interaction mode, technologies, work surfaces, artifacts, constraints, and unknowns.",
    note: "Interpretation, not capability judgment",
  },
  {
    number: "02",
    title: "Retrieve analogues",
    copy: "Filter incompatible work, then combine lexical search, structured facets, optional embeddings, and an optional LLM rerank.",
    note: "Only safe, agent-visible case profiles",
  },
  {
    number: "03",
    title: "Measure support",
    copy: "Group trials by the exact model, effort, harness, version, and published configuration. Never pool incompatible executions.",
    note: "Observed trials, not model opinion",
  },
  {
    number: "04",
    title: "Recommend or abstain",
    copy: "Choose the lowest-effort eligible configuration only when similarity, coverage, repeated trials, and the reliability bound clear policy.",
    note: "No evidence means no recommendation",
  },
];

const judgments = [
  {
    label: "Similarity",
    question: "Does this evidence resemble the requested work?",
    detail: "Intent · ecosystem · work surface · artifact · constraints",
  },
  {
    label: "Empirical support",
    question: "What happened when this exact configuration tried it?",
    detail: "Passes · failures · errors · exclusions · repeated attempts",
  },
  {
    label: "Evidence quality",
    question: "Is the result comparable and complete enough to use?",
    detail: "Coverage · revisions · harness · freshness · missing telemetry",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EvidenceHeader current="method" />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="eyebrow">Methodology</p>
              <h1 className="mt-3 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
                A recommendation with receipts.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                JustEnough does not ask a model which model feels confident. It finds
                comparable benchmark work, measures what actually happened, and applies
                a policy that is allowed to say “not enough evidence.”
              </p>
            </div>
            <aside className="border-l-2 border-enough pl-5">
              <p className="section-label">The short version</p>
              <p className="mt-2 text-sm leading-6">
                The LLM helps interpret similarity. The evidence and policy make the
                routing decision.
              </p>
            </aside>
          </div>
        </section>

        <section aria-labelledby="pipeline" className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="py-8 sm:py-10">
              <p className="eyebrow">From prose to route</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]" id="pipeline">
                Four stages. Two places for judgment.
              </h2>
            </div>
            <ol className="grid border-t border-border md:grid-cols-2 xl:grid-cols-4">
              {pipeline.map((step) => (
                <li
                  className="border-b border-border py-6 md:px-6 md:even:border-l md:first:pl-0 xl:border-b-0 xl:border-l xl:first:border-l-0 xl:first:pl-0"
                  key={step.number}
                >
                  <span className="font-mono text-xs font-semibold text-enough-strong">
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.copy}</p>
                  <p className="mt-5 border-l border-input pl-3 font-mono text-[11px] leading-5 text-muted-foreground">
                    {step.note}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <div>
              <p className="eyebrow">No magic confidence number</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                Three different questions stay separate.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Collapsing these into “87% confident” would hide why a recommendation
                might fail.
              </p>
            </div>
            <div className="grid gap-px border border-border bg-border md:grid-cols-3">
              {judgments.map((judgment) => (
                <article className="bg-surface p-5" key={judgment.label}>
                  <p className="section-label">{judgment.label}</p>
                  <h3 className="mt-3 text-base font-semibold leading-6">
                    {judgment.question}
                  </h3>
                  <p className="mt-4 font-mono text-[11px] leading-5 text-muted-foreground">
                    {judgment.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
            <div>
              <p className="eyebrow">Decision policy</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                “Just enough” is a gate, not a vibe.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                A configuration becomes eligible only after the retrieved evidence is
                compatible and the conservative lower bound clears the reliability target.
                The current policy uses a 90% one-sided Wilson bound, so a handful of lucky
                passes cannot masquerade as certainty.
              </p>
            </div>
            <div className="border border-border bg-surface p-5 font-mono text-xs leading-6">
              <p className="section-label">Route only if</p>
              <ul className="mt-4 space-y-2">
                <li className="flex justify-between gap-4 border-b border-border pb-2">
                  <span>compatible cases</span>
                  <strong>≥ 3</strong>
                </li>
                <li className="flex justify-between gap-4 border-b border-border pb-2">
                  <span>meaningful matches</span>
                  <strong>≥ 3</strong>
                </li>
                <li className="flex justify-between gap-4 border-b border-border pb-2">
                  <span>facet coverage</span>
                  <strong>passes</strong>
                </li>
                <li className="flex justify-between gap-4">
                  <span>lower bound</span>
                  <strong>≥ target</strong>
                </li>
              </ul>
              <p className="mt-5 bg-warning-soft p-3 text-warning">
                Otherwise: abstain and show what evidence is missing.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Worked example</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                A real route through the current corpus.
              </h2>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              local baseline · DeepSWE v1.1 snapshot
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="border border-border bg-surface p-5 sm:p-6">
              <p className="section-label">Target task · 70% reliability</p>
              <blockquote className="mt-4 max-w-3xl text-xl font-medium leading-8 tracking-[-0.02em]">
                “In a repository, implement a new Python CLI feature, update
                configuration handling, and add regression tests.”
              </blockquote>
              <div className="mt-8 grid gap-4 border-t border-border pt-6 md:grid-cols-3">
                <div>
                  <p className="metric-label">Observed</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums">29 / 32</p>
                </div>
                <div>
                  <p className="metric-label">90% lower bound</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums">79%</p>
                </div>
                <div>
                  <p className="metric-label">Evidence cases</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums">8</p>
                </div>
              </div>
            </div>
            <div className="border-2 border-enough-strong bg-surface-raised p-5">
              <p className="section-label">Just enough</p>
              <p className="mt-4 font-mono text-base font-semibold">claude-fable-5</p>
              <p className="mt-1 text-sm text-muted-foreground">
                xhigh effort · mini-swe-agent
              </p>
              <p className="mt-5 text-sm leading-6">
                The empirical lower bound clears the selected 70% target.
              </p>
            </div>
          </div>

          <div className="mt-6 border-y border-border">
            {[
              [
                "Add grouped test phases with synchronized barriers",
                "/evidence/deepswe/v1.1/mobly-grouped-test-barriers",
                "intent · language · work surface",
              ],
              [
                "Add implicit HEAD and automatic OPTIONS responses to FastAPI routes",
                "/evidence/deepswe/v1.1/fastapi-implicit-head-options",
                "intent · language",
              ],
              [
                "Add incremental cache controls to Bandit",
                "/evidence/deepswe/v1.1/bandit-incremental-cache-control",
                "intent · language · work surface",
              ],
            ].map(([title, href, facets]) => (
              <Link
                className="flex flex-col gap-1 border-t border-border py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
                href={href}
                key={href}
              >
                <span className="text-sm font-medium hover:underline">{title}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{facets}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="eyebrow">The LLM boundary</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                Helpful interpreter. Terrible calculator.
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="border border-border bg-surface p-4">
                  <p className="section-label">When enabled, the LLM</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>Profiles the described task</li>
                    <li>Reranks safe candidate summaries</li>
                    <li>Explains matched and missing facets</li>
                  </ul>
                </div>
                <div className="border border-border bg-surface p-4">
                  <p className="section-label">The LLM never</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>Edits published trial counts</li>
                    <li>Invents missing cost or latency</li>
                    <li>Selects a route from self-confidence</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <p className="eyebrow">Current boundary</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                What this result does not prove.
              </h2>
              <ul className="mt-6 divide-y divide-border border-y border-border text-sm leading-6 text-muted-foreground">
                <li className="py-3">Similar benchmark work is related evidence, not an identical task.</li>
                <li className="py-3">Model, effort, harness, tools, and environment can change together.</li>
                <li className="py-3">The current corpus covers repository and terminal software work.</li>
                <li className="py-3">Reasoning effort is a proxy until cost and latency are normalized.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 border-t-2 border-enough bg-surface-raised px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
