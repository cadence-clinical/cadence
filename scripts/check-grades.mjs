// Validates every component's meta.json. A grade is a public claim, so CI checks that each
// claim is backed by what it requires. Run after `pnpm build:packages`.
import { access, glob, readFile } from "node:fs/promises";
import path from "node:path";

import { compareGrades, validateGrade } from "../packages/core/dist/index.mjs";

const root = new URL("../", import.meta.url).pathname;
const CATEGORIES = ["primitive", "clinical"];
const problems = [];
let count = 0;

const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );

for await (const file of glob("packages/*/src/components/*/meta.json", { cwd: root })) {
  count += 1;
  const dir = path.dirname(path.join(root, file));
  const meta = JSON.parse(await readFile(path.join(root, file), "utf8"));
  const report = (message) => problems.push(`${file}: ${message}`);

  if (meta.name !== path.basename(dir)) {
    report(`name "${meta.name}" must match its directory "${path.basename(dir)}".`);
  }
  for (const field of ["title", "description"]) {
    if (!meta[field]) report(`missing "${field}".`);
  }
  if (!CATEGORIES.includes(meta.category)) {
    report(`category must be one of ${CATEGORIES.join(", ")}.`);
  }
  if (!meta.grade) {
    report(`missing "grade".`);
    continue;
  }

  validateGrade(meta.grade).forEach(report);

  // "Tested" means the component has stories, because every story runs as a browser test.
  const tested = compareGrades(meta.grade.level, "tested") >= 0;
  if (tested && !(await exists(path.join(dir, `${meta.name}.stories.tsx`)))) {
    report(`grade "${meta.grade.level}" needs ${meta.name}.stories.tsx beside it.`);
  }
  for (const evidence of meta.grade.evidence ?? []) {
    if (!(await exists(path.join(root, evidence)))) {
      report(`evidence record "${evidence}" does not exist.`);
    }
  }
}

if (problems.length > 0) {
  console.error(`Grade check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`Grade check passed for ${count} component${count === 1 ? "" : "s"}.`);
