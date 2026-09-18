export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Dependabot and Changesets write long lines in commit bodies.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
