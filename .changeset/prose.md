---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Prose and ProseScroll for long-form text you render, such as a monthly report written in Markdown. The `prose` class, or the `Prose` wrapper (`as` a div, an article or a section), gives headings, paragraphs, lists, links, quotes, code, tables, figures and rules the library's type and spacing, with text at 70ch (`--prose-measure`). It never styles a component inside it, and `not-prose` exempts a subtree. Links and images you turn into plain text have classes of their own: `prose-unlinked` keeps the text's look, and `prose-image` shows the alt text in a small box. `ProseScroll` is a named, focusable region that lets a wide table scroll on a phone. Both are static, so a server component renders a report with no client JavaScript. On a Persian page, code stays left to right, headings drop their tracking and ordered lists count in Persian digits. Load Sofia Sans's italic as well, since emphasis draws in it. `prose.css` is in `styles.css`, imported before every component.
