// Validates the component manifests. A grade is a public claim, so CI checks that each claim is
// backed by what it requires, and that every component is installable the way
// docs/decisions/0011-registry.md describes. Run after `pnpm build:packages`.
import { access, glob, readFile } from "node:fs/promises";
import path from "node:path";

import { compareGrades, validateGrade } from "../packages/core/dist/index.mjs";

const root = new URL("../", import.meta.url).pathname;
const CATEGORIES = ["primitive", "clinical"];
const COMPONENT_TYPES = ["registry:component", "registry:ui", "registry:block"];
const INSTALL_DIR = "components/cadence/";
const problems = [];

const exists = (file) =>
  access(path.join(root, file)).then(
    () => true,
    () => false,
  );
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));

const listed = new Set();
let count = 0;

for (const manifest of (await readJson("registry.json")).include ?? []) {
  const dir = path.dirname(manifest);

  for (const item of (await readJson(manifest)).items ?? []) {
    const files = (item.files ?? []).map((file) => ({ ...file, path: path.join(dir, file.path) }));
    files.forEach((file) => listed.add(file.path));
    // A component is anything that declares a category. Most are React files. Typeset is a
    // stylesheet from npm, so it has no file here, but it is graded like any other.
    if (!COMPONENT_TYPES.includes(item.type) && !item.meta?.category) continue;

    count += 1;
    const report = (message) => problems.push(`${manifest}: ${item.name}: ${message}`);

    for (const field of ["title", "description"]) {
      if (!item[field]) report(`missing "${field}".`);
    }
    if (!CATEGORIES.includes(item.meta?.category)) {
      report(`meta.category must be one of ${CATEGORIES.join(", ")}.`);
    }
    if (!item.docs?.includes("carries no Cadence grade")) {
      report(`docs must say that an edited copy carries no Cadence grade.`);
    }

    const source = files.find((file) => path.basename(file.path) === `${item.name}.tsx`);
    if (files.length > 0 && !source) report(`no file named ${item.name}.tsx.`);
    for (const file of files) {
      if (!file.target?.startsWith(INSTALL_DIR)) {
        report(`${file.path} needs a target under ${INSTALL_DIR}.`);
      }
    }

    if (!item.meta?.grade) {
      report(`missing meta.grade.`);
      continue;
    }
    validateGrade(item.meta.grade).forEach(report);

    // "Tested" means the component has stories, because every story runs as a browser test.
    const tested = compareGrades(item.meta.grade.level, "tested") >= 0;
    const stories = path.join(dir, "src/components", `${item.name}.stories.tsx`);
    if (tested && !(await exists(stories))) {
      report(`grade "${item.meta.grade.level}" needs ${stories}.`);
    }
    for (const evidence of item.meta.grade.evidence ?? []) {
      if (!(await exists(evidence))) report(`evidence record "${evidence}" does not exist.`);
    }
  }
}

// A component that is in a package but not in its manifest has no grade and cannot be installed.
for await (const file of glob("packages/*/src/components/*.tsx", { cwd: root })) {
  if (/\.(stories|test)\.tsx$/.test(file)) continue;
  if (!listed.has(file)) problems.push(`${file}: not listed in its package's registry.json.`);
}

if (problems.length > 0) {
  console.error(`Grade check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`Grade check passed for ${count} component${count === 1 ? "" : "s"}.`);
