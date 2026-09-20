import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

// scripts/build-registry.mjs writes the built registry here before `next build` and `next dev`.
const REGISTRY_DIR = path.join(process.cwd(), ".registry");

// The registry is open, so every item is rendered once at build time and an unknown name is a
// 404. Checking a token means reading the request, which makes this route dynamic: when that
// happens, add .registry to `outputFileTracingIncludes` so the files ship with the function.
export const dynamic = "force-static";
export const dynamicParams = false;

async function registryFiles(): Promise<string[]> {
  const files = await readdir(REGISTRY_DIR);
  return files.filter((file) => file.endsWith(".json"));
}

export async function generateStaticParams(): Promise<{ name: string }[]> {
  return (await registryFiles()).map((name) => ({ name }));
}

/** Serves `/r/{name}.json`, the URL the `@cadence` namespace resolves to. */
export async function GET(
  _request: Request,
  context: RouteContext<"/r/[name]">,
): Promise<Response> {
  const { name } = await context.params;
  // Only a file the build produced is ever read, whatever the URL says.
  if (!(await registryFiles()).includes(name)) {
    return Response.json({ error: `No registry item "${name}".` }, { status: 404 });
  }

  const item = await readFile(path.join(REGISTRY_DIR, name), "utf8");
  return new Response(item, { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
