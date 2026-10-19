# Cadence Clinical prototypes

Features demonstrated with Cadence's components and the synthetic ward, for testing with
clinicians. Nothing here connects to anything: every patient, identifier and value is invented,
and other people's activity is simulated. Why the prototypes are coded here is in
[decision 0020](../../docs/decisions/0020-prototypes-app.md). How each one is made is in the
[prototyping skill](../../skills/cadence-prototyping/SKILL.md).

## Run it

```bash
pnpm install
pnpm --filter @cadence-clinical/ui build   # the app reads the built packages
pnpm --filter @cadence-clinical/prototypes dev
```

The app opens at <http://localhost:3001>. Routes are in the URL's hash (`#/patient-list/a`), so
the built site is static files with no server routes.

## Deploy

The app deploys to Vercel as its own project, at **prototypes.cadenceclinical.dev**, beside the site
(www.cadenceclinical.dev) and Storybook (storybook.cadenceclinical.dev). `vercel.json` in this
folder holds the build. To set the project up once:

1. In Vercel, add a project from the `cadence-clinical/cadence` repository.
2. Set **Root Directory** to `apps/prototypes`, and leave the framework preset as **Other**:
   `vercel.json` sets the build command (Turbo, from the repository root) and the output directory
   (`dist`).
3. Match the Storybook project's settings for Node.js (24, as `.nvmrc`) and the package manager.
   pnpm comes from the root `package.json`'s `packageManager` field (`pnpm@11.5.2`). If the build
   uses the wrong pnpm, set the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1`.
4. Under **Domains**, add `prototypes.cadenceclinical.dev`. If `cadenceclinical.dev` uses Vercel's
   nameservers, the record is added for you. Otherwise, add a `CNAME` record for `prototypes`
   pointing at `cname.vercel-dns.com`.
5. Deploy `main`. Every pull request then gets its own preview link.

The site asks search engines not to index it three ways: a `robots` meta tag in `index.html`,
`public/robots.txt`, and an `X-Robots-Tag` header from `vercel.json`. Anyone with the link can
still open it. To limit it to testers, turn on Vercel's deployment protection for the project.

`vercel.json` doesn't block framing, so a research tool can show a prototype inside its own page
during a test session.
