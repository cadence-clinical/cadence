import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import manifest from "@cadence-clinical/ui/meta.json";

/**
 * A component's changelog, read from the changesets that describe it. Nothing is written twice:
 * a change is recorded once, in its changeset, and the docs and the package changelog both show it.
 *
 * An entry belongs to the components it opens by naming: "Button: …", "Label and Input." or
 * "Add Date picker, …". A component named later in the entry is not matched, so an entry about
 * Alert dialog that mentions Dialog does not appear in Dialog's changelog.
 */

const BUMPS = ["major", "minor", "patch"] as const;

type Bump = (typeof BUMPS)[number];

/** One change to a component, as its changeset describes it. */
export interface ChangelogEntry {
  bump: Bump;
  /** The changeset's text, in markdown. */
  summary: string;
}

/** The changes in one release, or in none yet. */
export interface ChangelogRelease {
  /** The released version, or `undefined` for changes waiting for the next release. */
  version: string | undefined;
  entries: ChangelogEntry[];
}

// The site builds from apps/site, and the changesets are at the root of the repository.
const ROOT = path.join(process.cwd(), "..", "..");
const CHANGESETS = path.join(ROOT, ".changeset");
const RELEASED = path.join(ROOT, "packages", "ui", "CHANGELOG.md");

// Longest first, so "Toggle group" is matched before "Toggle".
const TITLES = manifest.components
  .map(({ name, title }) => ({ name, title: title.toLowerCase() }))
  .sort((a, b) => b.title.length - a.title.length);

/** The components an entry opens by naming, in the order it names them. */
export function componentsNamedBy(summary: string): string[] {
  let rest = summary.replace(/^(?:Add|An?|The)\s+/i, "");
  const named: string[] = [];
  for (;;) {
    const lower = rest.toLowerCase();
    const match = TITLES.find(
      ({ title }) => lower.startsWith(title) && !/[\p{L}\p{N}]/u.test(lower.charAt(title.length)),
    );
    if (!match) return named;
    named.push(match.name);
    rest = rest.slice(match.title.length);
    const separator = /^(?:,\s*(?:and\s+)?|\s+and\s+)/.exec(rest);
    if (!separator) return named;
    rest = rest.slice(separator[0].length);
  }
}

function isBump(value: string): value is Bump {
  return BUMPS.some((bump) => bump === value);
}

/** The largest bump a changeset asks of any package, and its text. */
function parseChangeset(source: string): ChangelogEntry | undefined {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  if (!match) return undefined;
  const [, frontmatter = "", body = ""] = match;
  const bumps = [...frontmatter.matchAll(/:\s*(major|minor|patch)\s*$/gm)].flatMap(([, bump]) =>
    bump && isBump(bump) ? [bump] : [],
  );
  const bump = BUMPS.find((candidate) => bumps.includes(candidate));
  const summary = body.trim();
  // An empty changeset records that a change needs no release.
  if (!bump || !summary) return undefined;
  return { bump, summary };
}

async function readUnreleased(): Promise<ChangelogEntry[]> {
  const files = (await readdir(CHANGESETS)).filter(
    (file) => file.endsWith(".md") && file !== "README.md",
  );
  const entries = await Promise.all(
    files
      .sort()
      .map(async (file) => parseChangeset(await readFile(path.join(CHANGESETS, file), "utf8"))),
  );
  return entries.filter((entry) => entry !== undefined);
}

/**
 * The text of one item in a released changelog, without the pull request, commit and author that
 * `@changesets/changelog-github` puts before it.
 */
function releasedSummary(item: string): string {
  const text = item.replace(/^- /, "").replace(/\n {2}/g, "\n");
  const github =
    /^(?:\[#\d+\]\([^)]*\)\s*)?(?:\[`[0-9a-f]+`\]\([^)]*\)\s*)?(?:Thanks [^!]*!\s*)?-\s+/;
  return text
    .replace(github, "")
    .replace(/^[0-9a-f]{7,40}: /, "")
    .trim();
}

/** The releases in `packages/ui/CHANGELOG.md`, newest first. There is none before the first. */
async function readReleased(): Promise<ChangelogRelease[]> {
  const source = await readFile(RELEASED, "utf8").catch(() => "");
  return source
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const [version = "", ...lines] = section.split("\n");
      const entries: ChangelogEntry[] = [];
      let bump: Bump | undefined;
      for (const block of lines.join("\n").split(/\n(?=### |- )/)) {
        const heading = /^### (Major|Minor|Patch) Changes/.exec(block)?.[1]?.toLowerCase();
        if (heading && isBump(heading)) bump = heading;
        else if (bump && block.startsWith("- "))
          entries.push({ bump, summary: releasedSummary(block) });
      }
      return { version: version.trim(), entries };
    });
}

/** A component's changes, waiting and released, newest first. Empty releases are left out. */
export async function readChangelog(component: string): Promise<ChangelogRelease[]> {
  const [unreleased, released] = await Promise.all([readUnreleased(), readReleased()]);
  const belongs = (entry: ChangelogEntry) => componentsNamedBy(entry.summary).includes(component);
  return [{ version: undefined, entries: unreleased }, ...released]
    .map((release) => ({ ...release, entries: release.entries.filter(belongs) }))
    .filter((release) => release.entries.length > 0);
}

const BUMP_LABELS: Record<Bump, string> = { major: "Major", minor: "Minor", patch: "Patch" };

/** How a bump is labelled beside its entry. */
export function bumpLabel(bump: Bump): string {
  return BUMP_LABELS[bump];
}

/** A component's changelog as markdown, for the page an agent reads. */
export async function changelogMarkdown(component: string): Promise<string> {
  const releases = await readChangelog(component);
  if (releases.length === 0) return "No changes are recorded for this component yet.";
  return releases
    .map(({ version, entries }) =>
      [
        `## ${version ?? "Unreleased"}`,
        ...entries.map(
          ({ bump, summary }) => `- **${bumpLabel(bump)}.** ${summary.replace(/\n/g, "\n  ")}`,
        ),
      ].join("\n\n"),
    )
    .join("\n\n");
}
