"use client";

import {
  Check,
  CircleAlert,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Outcome } from "./evidence-data";

const effortOrder = new Map(
  ["none", "low", "medium", "high", "xhigh", "max", "default"].map(
    (effort, index) => [effort, index],
  ),
);

function outcomeTone(outcome: Outcome) {
  if (outcome.passed === outcome.attempts) {
    return {
      label: "All passed",
      className: "bg-positive-soft text-positive",
      icon: Check,
    };
  }
  if (outcome.passed === 0) {
    return {
      label: "No passes",
      className: "bg-negative-soft text-negative",
      icon: X,
    };
  }
  return {
    label: "Mixed",
    className: "bg-warning-soft text-warning",
    icon: CircleAlert,
  };
}

function unique(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function OutcomeBrowser({
  outcomes,
  fallbackSourceUrl,
}: {
  outcomes: Outcome[];
  fallbackSourceUrl?: string;
}) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [harness, setHarness] = useState("all");
  const [effort, setEffort] = useState("all");

  const providers = useMemo(
    () => unique(outcomes.map((outcome) => outcome.provider)),
    [outcomes],
  );
  const harnesses = useMemo(
    () => unique(outcomes.map((outcome) => outcome.harness)),
    [outcomes],
  );
  const efforts = useMemo(
    () =>
      unique(outcomes.map((outcome) => outcome.effort)).sort(
        (left, right) =>
          (effortOrder.get(left) ?? 99) - (effortOrder.get(right) ?? 99),
      ),
    [outcomes],
  );

  const filteredOutcomes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return outcomes
      .filter((outcome) => {
        if (provider !== "all" && outcome.provider !== provider) return false;
        if (harness !== "all" && outcome.harness !== harness) return false;
        if (effort !== "all" && outcome.effort !== effort) return false;
        if (!normalizedQuery) return true;

        return [
          outcome.provider,
          outcome.model,
          outcome.harness,
          outcome.harness_version,
          outcome.configuration,
          outcome.submission_date,
          outcome.effort,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        const modelOrder = left.model.localeCompare(right.model);
        if (modelOrder !== 0) return modelOrder;
        const harnessOrder = left.harness.localeCompare(right.harness);
        if (harnessOrder !== 0) return harnessOrder;
        const effortDifference =
          (effortOrder.get(left.effort) ?? 99) -
          (effortOrder.get(right.effort) ?? 99);
        if (effortDifference !== 0) return effortDifference;
        return (left.configuration ?? "").localeCompare(
          right.configuration ?? "",
        );
      });
  }, [effort, harness, outcomes, provider, query]);

  const models = new Set(outcomes.map((outcome) => outcome.model)).size;
  const trials = outcomes.reduce((sum, outcome) => sum + outcome.attempts, 0);
  const hasFilters =
    query.trim() || provider !== "all" || harness !== "all" || effort !== "all";

  function resetFilters() {
    setQuery("");
    setProvider("all");
    setHarness("all");
    setEffort("all");
  }

  return (
    <div className="mt-6 border border-border bg-surface">
      <dl className="grid grid-cols-3 border-b border-border bg-muted/50">
        <div className="px-4 py-3">
          <dt className="metric-label">Models</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
            {models}
          </dd>
        </div>
        <div className="border-l border-border px-4 py-3">
          <dt className="metric-label">Configurations</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
            {outcomes.length}
          </dd>
        </div>
        <div className="border-l border-border px-4 py-3">
          <dt className="metric-label">Trials</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
            {trials}
          </dd>
        </div>
      </dl>

      <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-2 xl:grid-cols-[minmax(13rem,1fr)_auto_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search outcome configurations</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="h-10 w-full rounded-sm border border-input bg-background pl-9 pr-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models or configurations…"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Provider</span>
          <select
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setProvider(event.target.value)}
            value={provider}
          >
            <option value="all">Any provider</option>
            {providers.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Harness</span>
          <select
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setHarness(event.target.value)}
            value={harness}
          >
            <option value="all">Any harness</option>
            {harnesses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Effort</span>
          <select
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setEffort(event.target.value)}
            value={effort}
          >
            <option value="all">Any effort</option>
            {efforts.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex min-h-11 items-center justify-between gap-4 border-b border-border px-4 py-2 text-xs">
        <p aria-live="polite" className="text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredOutcomes.length}</span>{" "}
          of {outcomes.length} configurations
        </p>
        {hasFilters ? (
          <button
            className="inline-flex min-h-8 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={resetFilters}
            type="button"
          >
            <X aria-hidden="true" className="size-3.5" />
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredOutcomes.length > 0 ? (
        <div className="max-h-[48rem] overflow-auto">
          <table className="w-full min-w-[45rem] border-collapse text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium" scope="col">
                  Model
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  Harness
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  Effort
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  Result
                </th>
                <th className="px-4 py-3 text-right font-medium" scope="col">
                  Passes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOutcomes.map((outcome) => {
                const tone = outcomeTone(outcome);
                const Icon = tone.icon;
                const sourceUrl =
                  outcome.source_submission_url ?? fallbackSourceUrl;

                return (
                  <tr
                    className="border-t border-border align-middle"
                    key={
                      outcome.configuration ??
                      `${outcome.provider}-${outcome.model}-${outcome.harness}-${outcome.effort}`
                    }
                  >
                    <td className="px-4 py-4">
                      {sourceUrl ? (
                        <a
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          href={sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                          title={outcome.configuration}
                        >
                          {outcome.model}
                          <ExternalLink aria-hidden="true" className="size-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-xs font-semibold">
                          {outcome.model}
                        </span>
                      )}
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {outcome.provider}
                        {outcome.submission_date
                          ? ` · ${outcome.submission_date}`
                          : null}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">{outcome.harness}</span>
                      <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                        {outcome.harness_version ?? "published configuration"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs uppercase tracking-[0.05em]">
                      {outcome.effort}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone.className}`}
                      >
                        <Icon aria-hidden="true" className="size-3.5" />
                        {tone.label}
                      </span>
                      {outcome.errored > 0 || outcome.disqualified ? (
                        <span className="mt-1.5 block text-[11px] text-muted-foreground">
                          {outcome.errored > 0
                            ? `${outcome.errored} errors`
                            : null}
                          {outcome.errored > 0 && outcome.disqualified
                            ? " · "
                            : null}
                          {outcome.disqualified
                            ? `${outcome.disqualified} disqualified`
                            : null}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums">
                      {outcome.passed}/{outcome.attempts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No configurations match these filters.
        </div>
      )}
    </div>
  );
}
