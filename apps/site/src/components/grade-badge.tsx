import clinical from "@cadence-clinical/clinical/meta.json";
import ui from "@cadence-clinical/ui/meta.json";
import Link from "next/link";

const LABELS: Record<string, string> = {
  draft: "Draft",
  tested: "Tested",
  "clinician-verified": "Verified by clinicians",
  "in-production": "Used in production",
};

/** Every published component, from the manifests the ui and clinical packages publish. */
const COMPONENTS = [...ui.components, ...clinical.components];

/** Shows a component's grade, read from the same manifest the package publishes. */
export function GradeBadge({ component }: { component: string }) {
  const meta = COMPONENTS.find((entry) => entry.name === component);
  if (!meta) {
    throw new Error(`No component named "${component}" in the ui or clinical meta.json.`);
  }

  const { level } = meta.grade;
  const version = "version" in meta.grade ? String(meta.grade.version) : undefined;

  return (
    <p className="not-prose my-4 text-sm">
      <Link
        href="/docs/grades"
        className="inline-flex items-center gap-2 rounded-md border px-2 py-1 font-medium hover:bg-muted"
      >
        <span className="text-muted-foreground">Grade</span>
        <span>{LABELS[level] ?? level}</span>
        {version ? <span className="text-muted-foreground tabular-nums">at {version}</span> : null}
      </Link>
    </p>
  );
}
