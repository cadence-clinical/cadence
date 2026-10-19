---
"@cadence-clinical/ui": minor
---

Comment: `status="revoked"` strikes a comment's text through, mutes it and starts it with "Revoked:" for a screen reader, and `CommentRevoked` says who revoked it and when, with an icon, or the icon and "Revoked" in a compact comment. `CommentEdited` says a comment was edited, and `CommentActions` holds its author's actions, such as Edit, Delete and Revoke, and is hidden in a compact comment. A compact comment's text can take two lines with `lines={2}`. `CommentProvenance` works with every state. Its grade stays tested.
