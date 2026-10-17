# Changesets

A changeset records which packages a change affects and how. Add one to any pull request that
changes a published package:

```bash
pnpm changeset
```

Commit the file it creates. When changesets land on `main`, the Release workflow opens a
"chore: version packages" pull request. Merging that pull request publishes the new versions.

## Releasing

The version pull request is opened by GitHub Actions, and GitHub parks the workflow runs of such
a pull request until a maintainer approves them. Until then it shows no `CI passed` check and
cannot merge.

1. Open the version pull request and choose **Approve and run workflows**. From a terminal:

   ```bash
   head=$(gh pr view <number> --json headRefOid --jq .headRefOid)
   gh run list --branch changeset-release/main --event pull_request \
     --json databaseId,headSha,conclusion \
     --jq ".[] | select(.headSha == \"$head\" and .conclusion == \"action_required\") | .databaseId" |
     xargs -I{} gh api -X POST repos/cadence-clinical/cadence/actions/runs/{}/approve
   ```

   Approve only the runs for the pull request's current head commit. An approved run for an
   older commit takes over the concurrency group and cancels the current one.

2. When `CI passed` is green, merge it.

3. Publish by hand. CI cannot publish yet, because npm does not accept this repository's OIDC
   tokens ([npm/cli#9969](https://github.com/npm/cli/issues/9969)), so `NPM_PUBLISH` is `false`.
   Pull first, so you publish the versions the pull request set:

   ```bash
   git switch main && git pull
   npm login
   pnpm release            # builds the packages, then publishes every version not yet on npm
   git push --follow-tags  # the tags changeset publish created
   ```

   If npm holds a version as "validating", wait: it appears once npm's checks finish. When npm
   accepts the OIDC tokens, set `NPM_PUBLISH` to `true` and merging the pull request publishes.

The pull request is regenerated each time a changeset lands, so approve it when you are ready to
release, not before.

`core`, `tokens`, `ui`, `clinical` and `fhir` are versioned together, so a Cadence version number
means one thing.

Every package stays below 1.0.0 until the first clinical components have been verified.
