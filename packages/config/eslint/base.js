import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Syntax CONVENTIONS.md rules out. `no-restricted-syntax` holds one list, so a config that adds to
 * it, or lifts one entry for some files, has to restate the rest: build the list from these.
 */
export const noClasses = {
  selector: ":matches(ClassDeclaration, ClassExpression):not([superClass.name='Error'])",
  message:
    "Use plain functions and plain data. The one class allowed is an Error subclass. See CONVENTIONS.md, section 3.",
};
export const noDefaultExport = {
  selector: "ExportDefaultDeclaration",
  message:
    "Use a named export. A default export is for files a framework loads by convention. See CONVENTIONS.md, section 2.",
};

/** Builds the one `no-restricted-syntax` rule from the entries that apply. */
export const restrictSyntax = (...entries) => ({ "no-restricted-syntax": ["error", ...entries] });

/** Files a tool loads by convention, which therefore must export a default. */
export const FRAMEWORK_FILES = ["**/*.config.{js,mjs,ts}", "**/*.stories.tsx", "**/.storybook/**"];

/** Base rules for every TypeScript package in the workspace. */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".next/**",
      ".turbo/**",
      ".source/**",
      "storybook-static/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  comments.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: {
        // Package tsconfigs include src only, so library code never sees Node types. Config
        // files sit outside them and are linted against the default project.
        projectService: {
          allowDefaultProject: ["*.config.ts", ".storybook/*.ts", ".storybook/*.tsx"],
        },
      },
    },
    // A rule is an error or it is off, and that includes a directive that no longer does anything.
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // `as const` is always allowed. Anything else means the type is wrong: fix the type.
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // Numbers are safe to interpolate, and the tokens do it throughout.
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@eslint-community/eslint-comments/require-description": "error",
      eqeqeq: ["error", "always"],
      ...restrictSyntax(noClasses, noDefaultExport),
    },
  },
  {
    // A React component's return type is always the same, so only plain modules state theirs.
    files: ["**/*.ts"],
    ignores: ["**/*.test.ts", "**/*.test-d.ts", ...FRAMEWORK_FILES],
    rules: { "@typescript-eslint/explicit-module-boundary-types": "error" },
  },
  {
    // Every exported symbol says what it is for. The types say the rest.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/*.test-d.ts", "**/*.stories.tsx", "**/*.d.ts"],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: { FunctionDeclaration: true },
          contexts: [
            "ExportNamedDeclaration > VariableDeclaration",
            "ExportNamedDeclaration > TSInterfaceDeclaration",
            "ExportNamedDeclaration > TSTypeAliasDeclaration",
          ],
        },
      ],
    },
  },
  {
    files: FRAMEWORK_FILES,
    rules: restrictSyntax(noClasses),
  },
  {
    // A test may assert its way to invalid input. Nothing else may.
    files: ["**/*.test.{ts,tsx}", "**/*.test-d.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    // A negative type test is code that must not compile, so its types cannot be resolved.
    files: ["**/*.test-d.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  {
    // An ambient module declaration has to export what the real module exports.
    files: ["**/*.d.ts"],
    rules: restrictSyntax(noClasses),
  },
  {
    // Scripts written in JavaScript have no types to check. Config files run in Node, and package
    // tsconfigs deliberately leave Node types out, so their types cannot be resolved either.
    files: ["**/*.{js,mjs,cjs}", "**/*.config.ts"],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
