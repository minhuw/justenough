import { EvidenceFooter, EvidenceHeader } from "./evidence-chrome";
import { TaskRouter } from "./task-router";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EvidenceHeader current="route" />
      <TaskRouter />
      <EvidenceFooter />
    </div>
  );
}
