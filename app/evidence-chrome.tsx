import Link from "next/link";

export function EvidenceHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link className="shrink-0 text-lg font-semibold tracking-[-0.03em]" href="/evidence">
            JustEnough<span className="text-enough">.</span>
          </Link>
          <nav aria-label="Primary" className="hidden sm:block">
            <Link
              aria-current="page"
              className="text-sm font-medium underline decoration-enough decoration-2 underline-offset-[18px]"
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
