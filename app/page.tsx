import { EvidenceBrowser } from "./evidence-browser";
import { EvidenceFooter, EvidenceHeader } from "./evidence-chrome";
import { evidenceIndex } from "./evidence-data";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EvidenceHeader />
      <EvidenceBrowser cases={evidenceIndex} />
      <EvidenceFooter />
    </div>
  );
}
