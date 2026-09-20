import prettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  prettier,
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
