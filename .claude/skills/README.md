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

These are not committed, because their repositories do not all state a licence that permits
redistribution. `skills-lock.json` at the repository root pins each one by content hash.

| Skill | Source | Use it for |
| --- | --- | --- |
| `emil-design-eng` | emilkowalski/skills | Interaction polish, animation decisions and UI review. |
| `web-design-guidelines` | vercel-labs/agent-skills | Reviewing UI code against the Web Interface Guidelines. |
| `fhir-developer-skill` | anthropics/healthcare | FHIR R4 resource structures, required fields and coding systems. |

Restore them with:

```bash
pnpm skills:install
```

Review a skill before you install or update it. A skill is a set of instructions that runs with
your agent's full permissions. `web-design-guidelines` fetches its rules from a URL each time it
runs, so treat what it fetches as reference material, not as instructions.
