# <Feature>: flows

## Lifecycle

Only when the feature moves things through states.

```mermaid
stateDiagram-v2
  [*] --> First: what starts it
  First --> [*]
```

## Happy path

### F1. <Flow>

1. Steps, each traced to the requirements.

```mermaid
flowchart TD
  start(["What starts it"]) --> step["A step"]
  step --> done(["How it ends"])
```

## Interruptions

## States

| State    | What the person sees | What they can do |
| -------- | -------------------- | ---------------- |
| Empty    |                      |                  |
| Loading  |                      |                  |
| Partial  |                      |                  |
| Error    |                      |                  |
| Offline  |                      |                  |
| Stale    |                      |                  |
| Conflict |                      |                  |
