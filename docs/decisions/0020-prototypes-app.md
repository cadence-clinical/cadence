# 0020. Prototypes are coded in an app in the repository

- Status: Accepted
- Date: 2026-10-19
- Builds on: [0013](0013-component-levels.md), [0018](0018-simulated-collaboration.md), [0019](0019-synthetic-ward-data.md)

## Context

Cadence prototypes features to test them with clinicians. The first plan was for the maintainer to
run each prototype in Claude Design from a prompt. A coded prototype uses Cadence's own packages
rather than a converted copy, plays a simulated teammate's actions exactly as scripted in every
session, and can be changed and checked in minutes. The maintainer decided on 2026-10-19 to build
the prototypes in HTML instead, in an app in this repository, deployed for testers.

## Decision

1. **Prototypes live in `apps/prototypes`**, a static app built with Vite from Cadence's workspace
   packages and the synthetic ward (0019). Each feature's options are routes in it. These are the
   example apps where screens live (0013): nothing in the app ships in a package.
2. **It is deployed on Vercel as a third project**, beside the site and Storybook, so every pull
   request gets a preview link and testers have a stable address: prototypes.cadenceclinical.dev.
   It is not indexed by search engines.
3. **It connects to nothing.** Data is the synthetic ward, and other people's activity is simulated
   (0018).
4. **Claude Design stays for exploration.** A designer can still prompt a quick variation there;
   prototypes for testing are coded.

## Consequences

- Building a prototype exercises the real components, so it finds their gaps directly. Each
  feature records them in its `gaps.md`.
- The app is held to the repository's lint and type rules, and its own screens follow the
  guardrails as the components do.
- Setting up the Vercel project is the maintainer's: the build command, output directory and
  headers are in `apps/prototypes/vercel.json`, and the steps are in `apps/prototypes/README.md`.
