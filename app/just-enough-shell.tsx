"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Gauge, Search } from "lucide-react";
import { FormEvent, useState } from "react";

const EXAMPLE_TASK = "Add authentication to an existing TypeScript website";

const MODES = {
  balanced: {
    label: "Balanced",
    model: "Candidate model",
    effort: "High effort",
    note: "Wait for benchmark evidence before routing.",
    point: { x: 212, y: 62 },
  },
  cost: {
    label: "Lowest cost",
    model: "Cheaper candidate",
    effort: "Medium effort",
    note: "Prefer the least expensive configuration above the confidence floor.",
    point: { x: 148, y: 88 },
  },
  latency: {
    label: "Lowest latency",
    model: "Faster candidate",
    effort: "Medium effort",
    note: "Prefer the fastest configuration above the confidence floor.",
    point: { x: 178, y: 78 },
  },
} as const;

type Mode = keyof typeof MODES;

async function prepareIllustrativeEvidence(task: string, mode: Mode) {
  return {
    task,
    mode,
    ...MODES[mode],
    status: "Example only — benchmark ingestion comes next",
  };
}

function FrontierChart({ point }: { point: { x: number; y: number } }) {
  return (
    <svg
      aria-label="Illustrative score and cost frontier"
      className="h-full min-h-52 w-full"
      role="img"
      viewBox="0 0 360 180"
    >
      <title>Illustrative score and cost frontier</title>
      <line className="stroke-border" x1="42" x2="334" y1="144" y2="144" />
      <line className="stroke-border" x1="42" x2="42" y1="20" y2="144" />
      <polyline
        className="fill-none stroke-foreground"
        points="62,127 117,108 156,91 212,62 264,52 310,36 324,31"
        strokeWidth="1.5"
      />
      {[{ x: 82, y: 122 }, { x: 117, y: 108 }, { x: 264, y: 52 }, { x: 310, y: 36 }].map(
        (candidate) => (
          <circle
            className="fill-background stroke-muted-foreground"
            cx={candidate.x}
            cy={candidate.y}
            key={`${candidate.x}-${candidate.y}`}
            r="4"
          />
        ),
      )}
      <circle className="fill-enough stroke-foreground" cx={point.x} cy={point.y} r="7" />
      <text className="fill-muted-foreground text-[9px]" x="42" y="164">
        lower cost / latency
      </text>
      <text className="fill-muted-foreground text-[9px]" x="250" y="164">
        higher →
      </text>
      <text
        className="fill-muted-foreground text-[9px]"
        transform="rotate(-90 15 106)"
        x="15"
        y="106"
      >
        confidence →
      </text>
    </svg>
  );
}

export function JustEnoughShell() {
  const [draftTask, setDraftTask] = useState(EXAMPLE_TASK);
  const [task, setTask] = useState(EXAMPLE_TASK);
  const [mode, setMode] = useState<Mode>("balanced");

  const evidence = useQuery({
    queryKey: ["starter-evidence", task, mode],
    queryFn: () => prepareIllustrativeEvidence(task, mode),
  });

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTask = draftTask.trim();
    if (nextTask) setTask(nextTask);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a className="text-lg font-semibold tracking-[-0.03em]" href="#top">
            JustEnough<span className="text-enough">.</span>
          </a>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            stack proof · illustrative data
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16" id="top">
        <section className="max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Model × effort routing
          </p>
          <h1 className="text-4xl font-medium tracking-[-0.045em] sm:text-6xl">
            No smarter than necessary.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Describe the job. JustEnough will find the cheapest or fastest model and effort
            level with enough evidence to trust the choice.
          </p>
        </section>

        <form className="mt-10 border border-border bg-surface p-2" onSubmit={submitTask}>
          <label className="sr-only" htmlFor="task">
            Task to route
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <input
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                id="task"
                onChange={(event) => setDraftTask(event.target.value)}
                value={draftTask}
              />
            </div>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 bg-enough px-5 text-sm font-medium text-enough-foreground transition-colors hover:bg-enough-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-enough-strong focus-visible:ring-offset-2"
              type="submit"
            >
              Find just enough
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </form>

        <Tabs.Root
          className="mt-10"
          onValueChange={(value) => setMode(value as Mode)}
          value={mode}
        >
          <div className="flex flex-col justify-between gap-4 border-b border-border sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Routing objective
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Candidate frontier</h2>
            </div>
            <Tabs.List aria-label="Routing objective" className="flex" loop>
              {Object.entries(MODES).map(([value, config]) => (
                <Tabs.Trigger
                  className="-mb-px h-10 border-b-2 border-transparent px-3 text-sm text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
                  key={value}
                  value={value}
                >
                  {config.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>

          {Object.keys(MODES).map((value) => (
            <Tabs.Content className="outline-none" key={value} value={value}>
              <section className="grid border-x border-b border-border lg:grid-cols-[1fr_1.15fr]">
                <div className="border-b border-border p-6 lg:border-b-0 lg:border-r sm:p-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge aria-hidden="true" className="size-4" />
                    {evidence.data?.status ?? "Preparing example"}
                  </div>
                  <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Proposed configuration
                  </p>
                  <h3 className="mt-2 text-3xl font-medium tracking-[-0.035em]">
                    {evidence.data?.model}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{evidence.data?.effort}</p>
                  <div className="mt-8 border-l-2 border-enough pl-4 text-sm leading-6 text-muted-foreground">
                    {evidence.data?.note}
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm">
                    <Check aria-hidden="true" className="size-4 text-enough-strong" />
                    Cloudflare-compatible application shell is ready
                  </div>
                </div>
                <div className="min-h-72 bg-chart p-5 sm:p-8">
                  <FrontierChart point={MODES[value as Mode].point} />
                </div>
              </section>
            </Tabs.Content>
          ))}
        </Tabs.Root>

        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-border pt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:flex-row">
          <span>Evidence before inference</span>
          <span>React · Vinext · Cloudflare Workers</span>
        </footer>
      </div>
    </main>
  );
}
