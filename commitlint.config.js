export default {
  extends: ["@commitlint/config-conventional"],
  // Dependabot capitalises its subject ("Bump x from 1 to 2") and offers no way to change that.
  // Only commits it signed are exempt, so a person writing "Bump" is still held to the rule.
  ignores: [(message) => /^Signed-off-by: dependabot\[bot\]/m.test(message)],
  rules: {
    // Dependabot and Changesets write long lines in commit bodies.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
