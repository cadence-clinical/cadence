# 0020. The Document editor is built on Tiptap, with Cadence's own toolbar

- Status: Proposed
- Date: 2026-10-18
- Builds on: [0014](0014-headless-libraries.md), [0017](0017-ai-provenance.md), [0018](0018-real-time-collaboration.md)
- Research: [Rich-text editor and real-time sync](../research/editor-and-sync.md)

## Context

A discharge summary is drafted by an AI, then reviewed and completed by a doctor, so Cadence needs
a Document editor. The maintainer set its scope on 2026-10-18: basic text editing and styles,
meaning paragraphs, bold and italic, headings, lists and links, written section by section, with
pasted text cleaned of what other systems bring with it. It must also support editing by several
people at once (0018) and marking each AI-drafted section until it is reviewed (0017). shadcn has
no editor component, so there is no shadcn API to match.

## Decision

1. **The editor is Tiptap 3, using only its MIT-licensed parts.** Cadence uses none of Tiptap's
   paid features or its hosted service.
2. **Cadence draws the editor's controls itself**: a toolbar on Base UI's toolbar part, using
   Toggle, Toggle group and Tooltip, with parts named in shadcn's style (`DocumentEditor`,
   `DocumentEditorToolbar`, `DocumentEditorSection`).
3. **The schema is the sanitiser.** The editor allows only the content a document needs, so
   anything else pasted in, such as styles, scripts, images and unsafe links, is dropped.
4. **Review is per section, not per character.** A section records that it was drafted by an AI,
   whether it was accepted, edited or rejected, and the original draft, so that the AI provenance
   mark and a diff view can be shown without paid tracked changes.
5. **It has its own entry point**, `@cadence-clinical/ui/document-editor`, with Tiptap as an
   optional peer. Collaboration has a second one, with Yjs as an optional peer, so a consumer
   who edits alone doesn't load Yjs (0014). The consumer creates the editor and passes it in.
6. **On the server, the document renders read-only** with Tiptap's static renderer, and the
   editor mounts on the client with the same extensions, so the page doesn't shift when it
   becomes editable.

## Consequences

- The editor is about 138 KB gzipped, and 182 KB with collaboration, against 9.5 KB for the Track
  chart, which is why it is behind an optional entry point and never imported by the barrel.
- Accessibility is Cadence's to deliver. Known work includes `aria-multiline`, the ARIA toolbar
  pattern with a key to reach the toolbar, a way out of the editor for keyboard users (Tab indents
  list items), and a fix for VoiceOver joining words across blocks. Its grade needs NVDA and
  VoiceOver testing, not only axe.
- Tiptap releases weekly and pins its packages to each other, so they are updated together within
  the seven-day minimum release age.
- If Tiptap's licensing changes, the MIT core and ProseMirror, which it is built on, remain. The
  closest alternatives were Lexical (smaller, but pre-1.0 and without server rendering of the
  document) and Plate (open-source suggestions and comments, but built on Radix).
