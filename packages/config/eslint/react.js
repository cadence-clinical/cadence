import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import base from "./base.js";

/** Rules for packages that ship React components. Accessibility linting is strict, not recommended. */
export default tseslint.config(
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    ...react.configs.flat.recommended,
    settings: { react: { version: "19" } },
  },
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.strict,
  {
    rules: {
      "react/prop-types": "off",
    },
  },
);
