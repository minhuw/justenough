import Link from "next/link";

export function EvidenceHeader({
  current = "evidence",
}: {
  current?: "route" | "method" | "evidence";
}) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link className="shrink-0 text-lg font-semibold tracking-[-0.03em]" href="/">
            JustEnough<span className="text-enough">.</span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-6">
            <Link
              aria-current={current === "route" ? "page" : undefined}
              className={
                current === "route"
                  ? "text-xs font-medium underline decoration-enough decoration-2 underline-offset-[18px] sm:text-sm"
                  : "text-xs font-medium text-muted-foreground hover:text-foreground sm:text-sm"
              }
              href="/"
            >
              <span className="sm:hidden">Route</span>
              <span className="hidden sm:inline">Route a task</span>
            </Link>
            <Link
              aria-current={current === "method" ? "page" : undefined}
              className={
                current === "method"
                  ? "text-xs font-medium underline decoration-enough decoration-2 underline-offset-[18px] sm:text-sm"
                  : "text-xs font-medium text-muted-foreground hover:text-foreground sm:text-sm"
              }
              href="/how-it-works"
            >
              <span className="sm:hidden">Method</span>
              <span className="hidden sm:inline">How it works</span>
            </Link>
            <Link
              aria-current={current === "evidence" ? "page" : undefined}
              className={
                current === "evidence"
                  ? "text-xs font-medium underline decoration-enough decoration-2 underline-offset-[18px] sm:text-sm"
                  : "text-xs font-medium text-muted-foreground hover:text-foreground sm:text-sm"
              }
              href="/evidence"
            >
              Evidence
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function EvidenceFooter() {
  return (
    <footer className="mx-auto mt-20 max-w-6xl border-t border-border px-4 py-6 font-mono text-[11px] text-muted-foreground sm:px-6 lg:px-8">
      <span>Evidence before inference.</span>
    </footer>
  );
}
