---
"@cadence-clinical/ui": minor
---

Add Comment, one comment with its author, role, time and text. `Comment`, `CommentHeader`, `CommentAuthor`, `CommentRole`, `CommentTime` and `CommentText` lay it out for a thread, and `CommentList` is the thread, an `ol`. With `size="compact"` it fits two lines of a table cell: the text cut to one line, then the author and time, with the role left out. `CommentProvenance` marks a comment an AI drafted, with what drafted it, who reviewed it, and its sources, or "No source", and stays after review. The middle dots between the header's parts are hidden from a screen reader.
