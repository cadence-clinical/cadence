# 0010. The canonical origin is www.cadenceclinical.dev

- Status: Accepted
- Date: 2026-09-19
- Supersedes: the domain named in [0009](0009-delivery.md). The rest of 0009 stands.

## Context

Decision 0009 named `cadenceclinical.app` as the canonical origin, with `cadenceclinical.com.au`
redirecting to it. The website was launched on `cadenceclinical.dev` instead. In Vercel the apex
domain redirects to `www`, so `https://www.cadenceclinical.dev` is the address that answers
without a redirect.

## Decision

`https://www.cadenceclinical.dev` is the canonical origin. `cadenceclinical.dev` redirects to it.

The origin is still set in one place, `apps/site/src/lib/shared.ts`, and can be overridden with
`NEXT_PUBLIC_SITE_URL`. The component metadata schema's `$id` uses the same origin.

## Consequences

- Registry URLs, when the registry is built, start with this origin. Changing it after consumers
  have installed from the registry would break their configuration, so settle any change to the
  primary domain (for example apex instead of `www`) before the registry ships.
- `cadenceclinical.app` and `cadenceclinical.com.au` are registered but not attached. If they
  are attached later, they should redirect here.
- Storybook has no custom domain yet. `storybook.cadenceclinical.dev` is the intended address.
- The smoke tests can run against the live site:
  `PLAYWRIGHT_BASE_URL=https://www.cadenceclinical.dev pnpm --filter @cadence-clinical/site test:e2e`.
