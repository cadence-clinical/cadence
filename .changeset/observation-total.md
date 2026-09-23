---
"@cadence-clinical/core": minor
---

Add `scoreRounds`, which adds up the scores of each round's levels into the total an observation schema defines, such as an early warning score. A total is complete only when every required series is present, and an incomplete total gives no number and names what is missing. A level can escalate a round on its own, whatever the sum. When a series has two readings in a round, the latest counts.
