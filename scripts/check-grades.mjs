// Validates the component manifests. A grade is a public claim, so CI checks that each claim is
// backed by what it requires, and that every component is installable the way
// docs/decisions/0011-registry.md describes. Run after `pnpm build:packages`.
import { access, glob, readFile } from "node:fs/promises";
import path from "node:path";

import { compareGrades, validateGrade } from "../packages/core/dist/index.mjs";

const root = new URL("../", import.meta.url).pathname;
// Lowest first. A component never imports one from a level above its own, and a primitive imports
// no other component: docs/decisions/0013-component-levels.md.
const LEVELS = ["primitive", "composite", "pattern", "layout"];
const STORYBOOK_GROUPS = {
  primitive: "Primitives",
  composite: "Composites",
  pattern: "Patterns",
  layout: "Layouts",
};
const DOMAINS = ["general", "clinical"];
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
const components = new Map();
let count = 0;

for (const manifest of (await readJson("registry.json")).include ?? []) {
  const dir = path.dirname(manifest);

  for (const item of (await readJson(manifest)).items ?? []) {
    const files = (item.files ?? []).map((file) => ({ ...file, path: path.join(dir, file.path) }));
    files.forEach((file) => listed.add(file.path));
    // A component is anything that declares a level. Most are React files. Typeset is a
    // stylesheet from npm, so it has no file here, but it is graded like any other.
    if (!COMPONENT_TYPES.includes(item.type) && !item.meta?.level) continue;

    count += 1;
    const report = (message) => problems.push(`${manifest}: ${item.name}: ${message}`);

    for (const field of ["title", "description"]) {
      if (!item[field]) report(`missing "${field}".`);
    }
    if (!LEVELS.includes(item.meta?.level)) {
      report(`meta.level must be one of ${LEVELS.join(", ")}.`);
    }
    if (!DOMAINS.includes(item.meta?.domain)) {
      report(`meta.domain must be one of ${DOMAINS.join(", ")}.`);
    }
    components.set(item.name, { level: item.meta?.level, files, manifest });
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
    } else if (tested) {
      // The level is the group a component sits under in Storybook.
      const group = STORYBOOK_GROUPS[item.meta.level];
      const title = /title: "([^"]+)"/.exec(await readFile(path.join(root, stories), "utf8"))?.[1];
      if (group && !title?.startsWith(`${group}/`)) {
        report(
          `its stories are titled "${title}", and a ${item.meta.level} belongs under "${group}/".`,
        );
      }
    }
    for (const evidence of item.meta.grade.evidence ?? []) {
      if (!(await exists(evidence))) report(`evidence record "${evidence}" does not exist.`);
    }
  }
}

// Dependencies only point down: a component never imports one from a level above its own, and a
// primitive imports no other component.
for (const [name, { level, files, manifest }] of components) {
  for (const file of files) {
    const source = await readFile(path.join(root, file.path), "utf8");
    for (const [, imported] of source.matchAll(/from "@\/components\/cadence\/([a-z0-9-]+)"/g)) {
      if (imported === name) continue;
      const target = components.get(imported);
      const problem = !target
        ? `imports "${imported}", which is not in a manifest.`
        : level === "primitive"
          ? `is a primitive and imports "${imported}". A primitive imports no other component.`
          : LEVELS.indexOf(target.level) > LEVELS.indexOf(level)
            ? `is a ${level} and imports "${imported}", a ${target.level}. Dependencies only point down.`
            : undefined;
      if (problem) problems.push(`${manifest}: ${name}: ${problem}`);
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
