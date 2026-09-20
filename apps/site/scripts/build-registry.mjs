// Builds the shadcn registry from the root registry.json into .registry, which the /r route
// serves. The directory is not public, so a token check can be added to the route later
// without changing a URL. See docs/decisions/0011-registry.md.
import { execFile } from "node:child_process";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = new URL("../../../", import.meta.url);
const output = new URL("../.registry/", import.meta.url);

// The root registry.json may only include files beneath it, so the CLI runs from the repo root.
await rm(output, { recursive: true, force: true });
await run("shadcn", ["build", "registry.json", "--output", "apps/site/.registry"], { cwd: root });

// core, tokens and ui are versioned together, so one version describes every item. On `main`
// that is the latest release, and the commit says exactly which source an item was built from.
const { version } = JSON.parse(await readFile(new URL("packages/ui/package.json", root), "utf8"));
const commit =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  (await run("git", ["rev-parse", "HEAD"], { cwd: root }).then(
    ({ stdout }) => stdout.trim(),
    () => undefined,
  ));

const files = (await readdir(output)).filter((file) => file !== "registry.json");
for (const file of files) {
  const item = JSON.parse(await readFile(new URL(file, output), "utf8"));
  item.meta = { ...item.meta, version, ...(commit ? { commit } : {}) };
  await writeFile(new URL(file, output), `${JSON.stringify(item, null, 2)}\n`);
}

console.log(
  `Registry built: ${files.length} items at ${version}${commit ? ` (${commit.slice(0, 7)})` : ""}.`,
);
