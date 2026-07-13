import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidenceFooter, EvidenceHeader } from "../../../../evidence-chrome";
import {
  benchmarkLabel,
  findEvidenceCase,
} from "../../../../evidence-data";
import { OutcomeBrowser } from "../../../../outcome-browser";

function sourceName(url: string) {
  if (url.includes("github.com")) return "Source record";
  return "Task page";
}

export default async function EvidenceCasePage({
  params,
}: {
  params: Promise<{ benchmark: string; release: string; caseId: string }>;
}) {
  const { benchmark, release, caseId } = await params;
  const item = findEvidenceCase(benchmark, release, caseId);

  if (!item) notFound();

  const repositoryName = item.revision.repository
    ? item.revision.repository.replace(/^https:\/\/github\.com\//, "")
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EvidenceHeader />
      <main>
        <article className="mx-auto max-w-6xl px-4 pb-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/evidence"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All evidence cases
          </Link>

          <header className="mt-5 border-b border-border pb-10">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-input bg-surface px-2.5 py-1 font-medium">
                {benchmarkLabel(item.identity.benchmark)} {item.identity.release}
              </span>
              <span className="rounded-full border border-input px-2.5 py-1 text-muted-foreground">
                {item.profile.interaction}
              </span>
              {item.profile.languages.map((language) => (
                <span
                  className="rounded-full border border-input px-2.5 py-1 text-muted-foreground"
                  key={language}
                >
                  {language}
                </span>
              ))}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              {item.profile.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              {item.profile.summary}
            </p>
            <p className="mt-5 font-mono text-[11px] text-muted-foreground">
              {item.identity.native_id}
            </p>
          </header>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
            <div className="min-w-0 space-y-16">
              <section aria-labelledby="task-shape">
                <p className="eyebrow">Normalized profile</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]" id="task-shape">
                  What this task asks for
                </h2>
                <div className="mt-6 grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="section-label">Intent</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.profile.intents.map((intent) => (
                        <li className="facet" key={intent}>
                          {intent}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="section-label">Work surfaces</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.profile.work_surfaces.map((surface) => (
                        <li className="facet" key={surface}>
                          {surface}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="section-label">Technology</h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {item.profile.technologies.map((technology) => (
                        <li className="facet" key={technology}>
                          {technology}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="section-label">Expected artifacts</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-6">
                      {item.profile.expected_artifacts.map((artifact) => (
                        <li className="font-mono text-xs" key={artifact}>
                          {artifact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-10 border-l-2 border-enough pl-5">
                  <h3 className="section-label">Distinguishing requirements</h3>
                  <ul className="mt-4 space-y-3">
                    {item.profile.requirements.map((requirement) => (
                      <li className="flex gap-3 text-sm leading-6" key={requirement}>
                        <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-positive" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section aria-labelledby="outcome-panel">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="eyebrow">Published evidence</p>
                    <h2
                      className="mt-2 text-2xl font-semibold tracking-[-0.025em]"
                      id="outcome-panel"
                    >
                      Model × harness outcomes
                    </h2>
                  </div>
                  <p className="max-w-sm text-xs leading-5 text-muted-foreground">
                    Counts are tied to these exact configurations. Harnesses are not treated as
                    equivalent across benchmarks.
                  </p>
                </div>

                <OutcomeBrowser
                  fallbackSourceUrl={item.outcomes.source_url}
                  outcomes={item.outcomes.panel}
                />
              </section>
            </div>

            <aside className="space-y-10 lg:border-l lg:border-border lg:pl-8">
              <section aria-labelledby="case-source">
                <h2 className="section-label" id="case-source">
                  Source and revision
                </h2>
                <dl className="mt-4 space-y-5 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Case revision</dt>
                    <dd className="mt-1 break-all font-mono text-[11px] leading-5">
                      {item.revision.case_tree}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Source revision</dt>
                    <dd className="mt-1 break-all font-mono text-[11px] leading-5">
                      {item.revision.source_revision}
                    </dd>
                  </div>
                  {repositoryName ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">Repository</dt>
                      <dd className="mt-1">
                        <a
                          className="inline-flex items-center gap-1.5 underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          href={item.revision.repository}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {repositoryName}
                          <ArrowUpRight aria-hidden="true" className="size-3.5" />
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-5 flex flex-col items-start gap-2">
                  {[item.revision.source_url, item.revision.task_page]
                    .filter((url): url is string => Boolean(url))
                    .map((url) => (
                      <a
                        className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={url}
                        key={url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {sourceName(url)}
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                      </a>
                    ))}
                </div>
              </section>

            </aside>
          </div>
        </article>
      </main>
      <EvidenceFooter />
    </div>
  );
}
