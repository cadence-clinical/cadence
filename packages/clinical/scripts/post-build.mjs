// Runs after tsdown. Ships the stylesheet and meta.json, and checks that no ui source was built
// into this package: every ui import must have become an import of @cadence-clinical/ui.
import { copyFile, readdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);

await copyFile(new URL("src/styles.css", root), new URL("styles.css", dist));

const registry = JSON.parse(await readFile(new URL("registry.json", root), "utf8"));
const components = registry.items
  .filter((item) => item.meta?.grade)
  .map(({ name, title, description, meta }) => ({
    name,
    title,
    description,
    level: meta.level,
    domain: meta.domain,
    grade: meta.grade,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
await writeFile(new URL("meta.json", dist), `${JSON.stringify({ components }, null, 2)}\n`);

// Every built module must come from a source file in this package. A module that does not was
// pulled in from ui through the alias, and would ship a second copy of it.
const withoutExtension = (file) => file.replace(/\.(d\.mts|mjs|tsx?)$/, "");
const sources = new Set(
  (await readdir(new URL("src/", root), { recursive: true }))
    .filter((file) => /\.tsx?$/.test(file) && !/\.(test|stories)\./.test(file))
    .map(withoutExtension),
);
const problems = [];
for (const file of await readdir(dist, { recursive: true })) {
  if (!/\.(mjs|d\.mts)$/.test(file)) continue;
  if (!sources.has(withoutExtension(file))) {
    problems.push(
      `dist/${file} has no source in packages/clinical/src: it was built in from ui or another package that is not a dependency.`,
    );
  }
  const code = await readFile(new URL(file, dist), "utf8");
  if (/from ["']@\//.test(code)) problems.push(`dist/${file} still imports through an @/ alias.`);
}
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
