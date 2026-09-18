import react from "@cadence-clinical/config/eslint/react";
import storybook from "eslint-plugin-storybook";

export default [{ ignores: ["!.storybook"] }, ...react, ...storybook.configs["flat/recommended"]];
