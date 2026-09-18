// Runs after tsdown. Ships what the compiler does not: the stylesheet, and one manifest of every
// component's meta.json so the docs, the registry and the agent skill read grades from one place.
import { copyFile, glob, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

await copyFile(new URL("src/styles.css", root), new URL("dist/styles.css", root));

const components = [];
for await (const file of glob("src/components/*/meta.json", { cwd: root.pathname })) {
  const { $schema: _schema, ...meta } = JSON.parse(await readFile(new URL(file, root), "utf8"));
  components.push(meta);
}
components.sort((a, b) => a.name.localeCompare(b.name));

await writeFile(new URL("dist/meta.json", root), `${JSON.stringify({ components }, null, 2)}\n`);
