// Runs after tsdown. Ships what the compiler does not: the stylesheets, and meta.json, which lists
// every component with its grade. It is derived from registry.json, the one place a grade is
// declared, so the docs and the agent skill read the same claim the registry serves.
import { copyFile, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

for (const stylesheet of ["styles.css", "typeset.css"]) {
  await copyFile(new URL(`src/${stylesheet}`, root), new URL(`dist/${stylesheet}`, root));
}

const registry = JSON.parse(await readFile(new URL("registry.json", root), "utf8"));
const components = registry.items
  .filter((item) => item.meta?.grade)
  .map(({ name, title, description, meta }) => ({
    name,
    title,
    description,
    category: meta.category,
    grade: meta.grade,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

await writeFile(new URL("dist/meta.json", root), `${JSON.stringify({ components }, null, 2)}\n`);
