import base, { noClasses, restrictSyntax } from "@cadence-clinical/config/eslint/base";
import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  // After Next.js's config, so files are parsed by typescript-eslint and the typed rules can run.
  ...base,
  {
    // An application, not a library: Next.js loads pages, layouts and routes by their default
    // export, and nothing here is a public API that needs a JSDoc sentence.
    rules: { ...restrictSyntax(noClasses), "jsdoc/require-jsdoc": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    ".source/**",
    ".registry/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
