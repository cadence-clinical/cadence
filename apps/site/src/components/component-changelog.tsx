import { Badge } from "@cadence-clinical/ui";
import { Markdown } from "fumadocs-core/content/md";

import { bumpLabel, readChangelog } from "@/lib/changelog";

/** A component's changes, read from the changesets that name it when the page is built. */
export async function ComponentChangelog({ component }: { component: string }) {
  const releases = await readChangelog(component);
  if (releases.length === 0) return <p>No changes are recorded for this component yet.</p>;

  return releases.map(({ version, entries }) => (
    <section key={version ?? "unreleased"}>
      <h2>{version ?? "Unreleased"}</h2>
      {version ? null : (
        <p>These changes are merged and will be in the next release of the packages.</p>
      )}
      <ul>
        {entries.map(({ bump, summary }) => (
          <li key={summary}>
            <Badge variant="outline" className="not-prose mr-2 align-middle">
              {bumpLabel(bump)}
            </Badge>
            <Markdown components={{ p: ({ children }) => <>{children}</> }}>{summary}</Markdown>
          </li>
        ))}
      </ul>
    </section>
  ));
}
