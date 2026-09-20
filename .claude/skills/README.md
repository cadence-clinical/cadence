# Agent skills

Skills that coding agents load when working in this repository.

## Maintained here

| Skill | Use it for |
| --- | --- |
| `technical-writing` | Documentation: `apps/site/content/docs`, package READMEs, decision records. |
| `human-writing` | Landing page and site copy, announcements and other prose. |

Both are adapted from [vercel/eve](https://github.com/vercel/eve) under the Apache License 2.0
([LICENSE-APACHE](LICENSE-APACHE)). Each file states what was changed.

## Installed from upstream

These are not committed. Not every source repository states a licence that permits
redistribution, and one rule for all of them is simpler than a rule per skill.
`skills-lock.json` at the repository root pins each one by content hash.

| Skill | Source | Use it for |
| --- | --- | --- |
| `emil-design-eng` | emilkowalski/skills | Interaction polish, animation decisions and UI review. |
| `web-design-guidelines` | vercel-labs/agent-skills | Reviewing UI code against the Web Interface Guidelines. |
| `fhir-developer-skill` | anthropics/healthcare | FHIR R4 resource structures, required fields and coding systems. |
| `shadcn` | shadcn-ui/ui | shadcn conventions for composition, styling and the registry format. |
| `typescript-advanced-types` | wshobson/agents | Generics, conditional and mapped types, and type tests. |

Restore them with:

```bash
pnpm skills:install
```

`shadcn` assumes an app that installs components with the shadcn CLI, and it runs
`npx shadcn@latest info` each time it loads. Cadence authors its components in `packages/ui`,
so use the skill for its composition and styling rules and for the registry format. Do not let
it add components from a registry: components here are agreed one at a time.

Review a skill before you install or update it. A skill is a set of instructions that runs with
your agent's full permissions. `web-design-guidelines` fetches its rules from a URL each time it
runs, so treat what it fetches as reference material, not as instructions.
