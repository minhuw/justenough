"use client";

import { ArrowUpRight, LoaderCircle, SearchCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import type {
  ConfigurationEvidence,
  RoutingResult,
} from "@/lib/routing/types";

function percentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

function similarityLabel(value: number) {
  if (value >= 0.55) return "strong match";
  if (value >= 0.35) return "moderate match";
  return "weak match";
}

function matchCaseId(match: RoutingResult["matches"][number]) {
  return `${match.identity.benchmark}:${match.identity.release}:${match.identity.native_id}`;
}

function ConfigurationCard({
  configuration,
  label,
  selected = false,
}: {
  configuration: ConfigurationEvidence;
  label: string;
  selected?: boolean;
}) {
  return (
    <article
      className={`border p-4 ${
        selected ? "border-enough-strong bg-surface-raised" : "border-border bg-surface"
      }`}
    >
      <p className="section-label">{label}</p>
      <h3 className="mt-3 break-words font-mono text-sm font-semibold">
        {configuration.model}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {configuration.effort} effort · {configuration.harness}
      </p>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <div>
          <dt className="metric-label">Lower bound</dt>
          <dd className="mt-1 font-mono text-sm font-semibold tabular-nums">
            {percentage(configuration.lowerBound)}
          </dd>
        </div>
        <div>
          <dt className="metric-label">Observed</dt>
          <dd className="mt-1 font-mono text-sm font-semibold tabular-nums">
            {configuration.passed}/{configuration.attempts}
          </dd>
        </div>
        <div>
          <dt className="metric-label">Cases</dt>
          <dd className="mt-1 font-mono text-sm font-semibold tabular-nums">
            {configuration.supportingCases}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function TaskRouter() {
  const [task, setTask] = useState("");
  const [reliabilityTarget, setReliabilityTarget] = useState(0.8);
  const [result, setResult] = useState<RoutingResult>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const citedCaseIds = new Set(result?.judge?.citedCaseIds ?? []);
  const visibleMatches = result
    ? result.judge?.decision === "recommend"
      ? [...result.matches].sort(
          (left, right) =>
            Number(citedCaseIds.has(matchCaseId(right))) -
            Number(citedCaseIds.has(matchCaseId(left))),
        )
      : result.matches.slice(0, 5)
    : [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(undefined);

    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task, reliabilityTarget }),
      });
      const payload = (await response.json()) as RoutingResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The route could not be evaluated.");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The route could not be evaluated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow">Evidence-backed routing</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
              No smarter than necessary.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Describe the work. JustEnough finds comparable benchmark cases and checks
              which model, effort, and harness have enough published support.
            </p>
          </div>
          <div className="border-l-2 border-enough pl-5">
            <p className="font-mono text-sm leading-6">
              The right model. The right effort. Evidence included.
            </p>
          </div>
        </div>

        <form
          className="mt-10 border border-border bg-surface p-4 sm:p-6"
          onSubmit={submit}
        >
          <label className="block" htmlFor="target-task">
            <span className="text-sm font-semibold">What should the agent accomplish?</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Include the environment, language, expected result, and material constraints.
            </span>
          </label>
          <textarea
            className="mt-3 min-h-36 w-full resize-y rounded-sm border border-input bg-background p-3 text-base leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
            id="target-task"
            maxLength={5000}
            onChange={(event) => setTask(event.target.value)}
            placeholder="In a TypeScript repository, add session-based authentication without breaking the existing API tests…"
            required
            value={task}
          />
          <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="block text-sm font-medium">
              Reliability target
              <select
                className="mt-1 block h-10 min-w-40 rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setReliabilityTarget(Number(event.target.value))}
                value={reliabilityTarget}
              >
                <option value={0.7}>70% · exploratory</option>
                <option value={0.8}>80% · standard</option>
                <option value={0.9}>90% · cautious</option>
                <option value={0.95}>95% · strict</option>
              </select>
            </label>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-enough px-4 text-sm font-semibold text-enough-foreground hover:bg-enough-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
              disabled={loading || task.trim().length < 12}
              type="submit"
            >
              {loading ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : (
                <SearchCheck aria-hidden="true" className="size-4" />
              )}
              {loading ? "Checking evidence…" : "Find just enough"}
            </button>
          </div>
        </form>

        <div aria-live="polite">
          {error ? (
            <p className="mt-5 border border-negative bg-negative-soft p-4 text-sm">{error}</p>
          ) : null}

          {result ? (
            <section aria-labelledby="routing-result" className="mt-10 border-t border-border pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="eyebrow">Routing result</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]" id="routing-result">
                    {result.status === "recommended" ? "Evidence clears the bar." : "Not enough evidence yet."}
                  </h2>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {result.analysis.selector === "llm_judge"
                    ? "LLM judge · policy verified"
                    : "Deterministic selector"}
                  {" · "}
                  {result.evidence.supportingCases} cases · {result.candidatesEvaluated} configurations
                </p>
              </div>

              {result.judge ? (
                <div className="mt-5 border-l-2 border-enough bg-surface px-4 py-3">
                  <p className="section-label">
                    Judge {result.judge.decision} · {result.judge.citedCaseIds.length}{" "}
                    {result.judge.citedCaseIds.length === 1 ? "case" : "cases"} cited · policy verified
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {result.judge.rationale}
                  </p>
                </div>
              ) : null}

              {result.recommendation ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {result.lowerEffortAlternative ? (
                    <ConfigurationCard
                      configuration={result.lowerEffortAlternative}
                      label="Below target"
                    />
                  ) : (
                    <div className="hidden lg:block" />
                  )}
                  <ConfigurationCard
                    configuration={result.recommendation}
                    label="Just enough"
                    selected
                  />
                  {result.higherEffortAlternative ? (
                    <ConfigurationCard
                      configuration={result.higherEffortAlternative}
                      label="Higher effort"
                    />
                  ) : null}
                </div>
              ) : (
                <ul className="mt-5 max-w-3xl space-y-2 text-sm leading-6 text-muted-foreground">
                  {result.abstentionReasons.map((reason) => (
                    <li key={reason}>— {reason}</li>
                  ))}
                </ul>
              )}

              <div className="mt-8 grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                  <h3 className="text-sm font-semibold">Closest evidence</h3>
                  <div className="mt-3 divide-y divide-border border-y border-border">
                    {visibleMatches.map((match) => {
                      const cited = citedCaseIds.has(matchCaseId(match));
                      return (
                        <a
                          className="group flex items-start justify-between gap-4 py-3"
                          href={match.href}
                          key={match.href}
                        >
                          <span>
                            <span className="text-sm font-medium group-hover:underline">
                              {match.title}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {cited ? "Judge citation · " : ""}
                              {match.matchedFacets.join(" · ") || "text similarity only"}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                            {similarityLabel(match.score)}
                            <ArrowUpRight aria-hidden="true" className="size-3.5" />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Method note</h3>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    The lower bound is conservative trial evidence over retrieved cases.
                    Similarity, empirical support, and evidence quality remain separate.
                  </p>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                    {result.warnings.map((warning) => (
                      <li key={warning}>— {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
