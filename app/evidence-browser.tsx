"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  benchmarkLabel,
  caseHref,
  type EvidenceCase,
  totalPasses,
  totalTrials,
} from "./evidence-data";

type OutcomeFilter = "all" | "consistent" | "mixed" | "none";

function outcomeState(item: EvidenceCase): Exclude<OutcomeFilter, "all"> {
  const passes = totalPasses(item);
  const trials = totalTrials(item);
  if (passes === 0) return "none";
  if (passes === trials) return "consistent";
  return "mixed";
}

function percentage(passes: number, trials: number) {
  return trials === 0 ? 0 : Math.round((passes / trials) * 100);
}

export function EvidenceBrowser({ cases }: { cases: EvidenceCase[] }) {
  const [query, setQuery] = useState("");
  const [benchmark, setBenchmark] = useState("all");
  const [technology, setTechnology] = useState("all");
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");

  const technologies = useMemo(
    () =>
      [...new Set(cases.flatMap((item) => item.profile.technologies))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [cases],
  );

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return cases.filter((item) => {
      if (benchmark !== "all" && item.identity.benchmark !== benchmark) return false;
      if (technology !== "all" && !item.profile.technologies.includes(technology)) return false;
      if (outcome !== "all" && outcomeState(item) !== outcome) return false;

      if (!normalizedQuery) return true;
      const searchable = [
        item.profile.title,
        item.profile.summary,
        item.identity.native_id,
        ...item.profile.intents,
        ...item.profile.technologies,
        ...item.profile.languages,
        ...item.profile.work_surfaces,
        ...item.profile.expected_artifacts,
        ...item.profile.requirements,
        ...Object.values(item.profile.observed_labels),
      ]
        .join(" ")
        .toLocaleLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [benchmark, cases, outcome, query, technology]);

  const activeFilters = [
    query.trim() ? "query" : null,
    benchmark !== "all" ? "benchmark" : null,
    technology !== "all" ? "technology" : null,
    outcome !== "all" ? "outcome" : null,
  ].filter(Boolean).length;

  function resetFilters() {
    setQuery("");
    setBenchmark("all");
    setTechnology("all");
    setOutcome("all");
  }

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow">Evidence browser</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Cases, minus the archaeology.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Search compact task profiles, inspect the requirements that distinguish them,
              and compare published model outcomes without reading trajectories or verifier code.
            </p>
          </div>
          <dl className="grid grid-cols-3 border-y border-border py-4 lg:grid-cols-1 lg:gap-4 lg:border-y-0 lg:border-l lg:py-0 lg:pl-8">
            <div>
              <dt className="metric-label">Cases</dt>
              <dd className="metric-value">{cases.length}</dd>
            </div>
            <div>
              <dt className="metric-label">Suites</dt>
              <dd className="metric-value">2</dd>
            </div>
            <div>
              <dt className="metric-label">Published trials</dt>
              <dd className="metric-value">
                {cases.reduce((sum, item) => sum + totalTrials(item), 0)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="case-results" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="border border-border bg-surface">
          <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[minmax(16rem,1fr)_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search evidence cases</span>
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-11 w-full rounded-sm border border-input bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks, stacks, requirements…"
                type="search"
                value={query}
              />
            </label>

            <label>
              <span className="sr-only">Benchmark</span>
              <select
                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setBenchmark(event.target.value)}
                value={benchmark}
              >
                <option value="all">Any benchmark</option>
                <option value="deepswe">DeepSWE</option>
                <option value="terminal-bench">Terminal-Bench</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="sr-only">Technology</span>
                <select
                  className="h-11 w-full rounded-sm border border-input bg-background px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setTechnology(event.target.value)}
                  value={technology}
                >
                  <option value="all">Any technology</option>
                  {technologies.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Outcome pattern</span>
                <select
                  className="h-11 w-full rounded-sm border border-input bg-background px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setOutcome(event.target.value as OutcomeFilter)}
                  value={outcome}
                >
                  <option value="all">Any outcome</option>
                  <option value="consistent">All published trials passed</option>
                  <option value="mixed">Mixed published results</option>
                  <option value="none">No published passes</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border px-4 py-2">
            <div>
              <h2 className="text-sm font-semibold" id="case-results">
                {filteredCases.length} {filteredCases.length === 1 ? "case" : "cases"}
              </h2>
              <p aria-live="polite" className="sr-only">
                Showing {filteredCases.length} of {cases.length} evidence cases.
              </p>
            </div>
            {activeFilters > 0 ? (
              <button
                className="inline-flex min-h-9 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={resetFilters}
                type="button"
              >
                <X aria-hidden="true" className="size-3.5" />
                Clear {activeFilters} {activeFilters === 1 ? "filter" : "filters"}
              </button>
            ) : (
              <span className="font-mono text-[11px] text-muted-foreground">
                compact profile · exact revision
              </span>
            )}
          </div>

          {filteredCases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] border-collapse text-left">
                <thead>
                  <tr className="bg-muted text-xs text-muted-foreground">
                    <th className="w-[44%] px-4 py-3 font-medium" scope="col">
                      Task profile
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Benchmark
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Technology
                    </th>
                    <th className="px-4 py-3 text-right font-medium" scope="col">
                      Published passes
                    </th>
                    <th className="w-10 px-4 py-3" scope="col">
                      <span className="sr-only">Open case</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((item) => {
                    const passes = totalPasses(item);
                    const trials = totalTrials(item);
                    const rate = percentage(passes, trials);

                    return (
                      <tr className="group border-t border-border align-top" key={caseHref(item)}>
                        <td className="px-4 py-4">
                          <a
                            className="font-semibold tracking-[-0.015em] underline-offset-4 group-hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            href={caseHref(item)}
                          >
                            {item.profile.title}
                          </a>
                          <p className="mt-1 line-clamp-2 max-w-[62ch] text-sm leading-5 text-muted-foreground">
                            {item.profile.summary}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm">{benchmarkLabel(item.identity.benchmark)}</span>
                          <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                            {item.identity.release} · {item.profile.interaction}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm">{item.profile.technologies[0] ?? "Unspecified"}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {item.profile.languages.join(" · ") || item.profile.intents[0]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-mono text-sm font-semibold tabular-nums">
                            {passes}/{trials}
                          </span>
                          <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                            {rate}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <ArrowUpRight
                            aria-hidden="true"
                            className="mt-0.5 size-4 text-muted-foreground group-hover:text-foreground"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-16 text-center">
              <p className="text-lg font-semibold">No cases match.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a broader phrase or clear one of the filters.
              </p>
              <button
                className="mt-5 min-h-11 rounded-sm border border-input px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={resetFilters}
                type="button"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
          Rates summarize every published configuration available from the pinned benchmark
          sources for these cases. They are evidence, not a cross-benchmark ranking. Open a case
          to filter by model, provider, harness, or effort.
        </p>
      </section>
    </main>
  );
}
