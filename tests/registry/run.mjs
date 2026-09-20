// Installs Cadence into a copy of ./consumer with the real shadcn CLI, from the registry the site
// would serve, then typechecks the result and builds its CSS. It fails if a component cannot be
// installed the way the docs say, which no test inside the monorepo can show.
//
// Needs the packages built (`pnpm build:packages`) and network access to npm.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));
const fixture = fileURLToPath(new URL("./consumer/", import.meta.url));
const registryDir = path.join(root, "apps/site/.registry");
const shadcn = path.join(root, "apps/site/node_modules/.bin/shadcn");

const step = (message) => console.log(`- ${message}`);
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

/** The declarations inside the first block a selector opens, as a name-to-value map. */
function block(css, selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `index.css has no "${selector}" block.`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]),
  );
}

step("Building the registry");
await run("pnpm", ["--filter", "@cadence-clinical/site", "registry"], { cwd: root });
const theme = await readJson(path.join(registryDir, "theme.json"));

const consumer = await mkdtemp(path.join(os.tmpdir(), "cadence-consumer-"));
const server = createServer(async (request, response) => {
  const file = path.basename(new URL(request.url, "http://localhost").pathname);
  const body = await readFile(path.join(registryDir, file)).catch(() => undefined);
  response.writeHead(body ? 200 : 404, { "Content-Type": "application/json" }).end(body);
});

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  step(`Creating a consumer in ${consumer}`);
  await cp(fixture, consumer, { recursive: true });
  const config = path.join(consumer, "components.json");
  await writeFile(config, (await readFile(config, "utf8")).replace("REGISTRY_URL", origin));

  // The theme depends on @cadence-clinical/tokens. Packing the workspace copy tests this commit's
  // tokens, and works before the package is on npm.
  await run("pnpm", ["pack", "--pack-destination", consumer], {
    cwd: path.join(root, "packages/tokens"),
  });
  const tarball = (await readdir(consumer)).find((file) => file.endsWith(".tgz"));
  assert.ok(tarball, "pnpm pack produced no tarball.");
  // pnpm 11 stops an install until every build script is decided. The Tailwind CLI's watcher
  // ships prebuilt, so its script is not needed.
  await writeFile(
    path.join(consumer, "pnpm-workspace.yaml"),
    [
      "overrides:",
      `  "@cadence-clinical/tokens": "file:./${tarball}"`,
      "allowBuilds:",
      '  "@parcel/watcher": false',
      "",
    ].join("\n"),
  );
  await run("pnpm", ["install"], { cwd: consumer });

  // The order the installation guide gives: the theme by name, then components.
  step("shadcn add @cadence/theme");
  await run(shadcn, ["add", "@cadence/theme", "--yes", "--cwd", consumer]);
  // Then everything else the registry lists, so a new component is covered when it arrives.
  const index = await readJson(path.join(registryDir, "registry.json"));
  const items = index.items
    .map((item) => `@cadence/${item.name}`)
    .filter((name) => name !== "@cadence/theme");
  step(`shadcn add ${items.join(" ")}`);
  await run(shadcn, ["add", ...items, "--yes", "--cwd", consumer]);

  step("Checking what was installed");
  for (const item of index.items) {
    for (const file of item.files ?? []) {
      if (file.target) await readFile(path.join(consumer, "src", file.target));
    }
  }
  const button = await readFile(path.join(consumer, "src/components/cadence/button.tsx"), "utf8");
  assert.match(button, /from "@\/lib\/cn"/, "Button must import cn through the consumer's alias.");
  await readFile(path.join(consumer, "src/lib/cn.ts"));
  assert.equal(
    await readFile(path.join(consumer, "src/components/ui/button.tsx"), "utf8"),
    await readFile(path.join(fixture, "src/components/ui/button.tsx"), "utf8"),
    "The consumer's own components/ui/button.tsx must be left alone.",
  );

  const { dependencies } = await readJson(path.join(consumer, "package.json"));
  for (const name of [
    "@base-ui/react",
    "@cadence-clinical/tokens",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
  ]) {
    assert.ok(dependencies[name], `${name} was not added to the consumer's dependencies.`);
  }

  const css = await readFile(path.join(consumer, "src/index.css"), "utf8");
  for (const stylesheet of ["theme.css", "typeset.css"]) {
    assert.equal(
      css.split(`@import "@cadence-clinical/tokens/${stylesheet}"`).length - 1,
      1,
      `index.css must import ${stylesheet} exactly once.`,
    );
  }
  // The stock values are replaced, and what Cadence does not define is kept.
  assert.deepEqual(
    block(css, ":root"),
    { ...block(css, ":root"), ...theme.cssVars.light },
    "The stock :root values must be replaced with Cadence's.",
  );
  assert.deepEqual(block(css, ".dark"), { ...block(css, ".dark"), ...theme.cssVars.dark });
  assert.deepEqual(
    block(css, "@theme inline"),
    { ...block(css, "@theme inline"), ...theme.cssVars.theme },
    "The stock radius scale must be replaced with Cadence's.",
  );
  assert.ok(block(css, ":root")["chart-1"], "A variable Cadence does not define must be kept.");

  step("Typechecking the consumer");
  await run("pnpm", ["exec", "tsc", "--noEmit"], { cwd: consumer });

  step("Building the consumer's CSS");
  await run("pnpm", ["exec", "tailwindcss", "-i", "src/index.css", "-o", "out.css"], {
    cwd: consumer,
  });
  const built = await readFile(path.join(consumer, "out.css"), "utf8");
  for (const utility of [".h-control-lg", ".px-control-x", ".bg-critical", ".text-control"]) {
    assert.ok(built.includes(utility), `The consumer's CSS has no ${utility} utility.`);
  }
  assert.ok(built.includes(".typeset"), "The consumer's CSS has no Typeset rules.");

  console.log("Registry install test passed.");
} catch (error) {
  // execFile puts the CLI's own output on the error, and it is the useful part.
  console.error([error.stdout, error.stderr].filter(Boolean).join("\n"));
  throw error;
} finally {
  server.close();
  await rm(consumer, { recursive: true, force: true });
}
