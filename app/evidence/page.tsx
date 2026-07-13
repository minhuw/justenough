import { EvidenceBrowser } from "../evidence-browser";
import { EvidenceFooter, EvidenceHeader } from "../evidence-chrome";
import { evidenceCases } from "../evidence-data";

export default function EvidencePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EvidenceHeader />
      <EvidenceBrowser cases={evidenceCases} />
      <EvidenceFooter />
    </div>
  );
}
