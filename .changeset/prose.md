---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Prose and ProseScroll for long-form text you render, such as a monthly report written in Markdown. The `prose` class, or the `Prose` wrapper (`as` a div, an article or a section), gives headings, paragraphs, lists, links, quotes, code, tables, figures and rules the library's type and spacing, with text at one measure, 70ch of the body's font (`--prose-measure`). Every library component inside it, a chart, a table, a trail or a card included, draws as it does anywhere: prose's element rules sit in a nested layer, `components.prose`, under the components' own, and a component is handed back to what it would draw outside prose. `not-prose` exempts a subtree of your own markup. Your unlayered CSS still wins over prose, and so would Tailwind Typography's own `prose` class: use one or the other on an element.

`styles.css` imports `prose.css` first, right after the tokens and before every component. If you import component stylesheets one by one from `@snapshot-ui/core/components/`, import `prose.css` before the others.

GFM's footnotes draw small and slate with their label for screen readers alone, and task lists draw no markers. Links and images you turn into plain text have classes of their own: `prose-unlinked` keeps the text's look, and `prose-image` shows the alt text in a small box. `ProseScroll` is a named, focusable region (its `aria-label` or `aria-labelledby` is required) that lets a wide table scroll on a phone. Both are static, so a server component renders a report with no client JavaScript; render Markdown into them with react-markdown and remark-gfm, which the library does not depend on. On a Persian page, code stays left to right, headings drop their tracking, emphasis is upright at 500 and ordered lists count in Persian digits; load Vazirmatn first in the stack under `lang="fa"`. Load Sofia Sans's italic as well, since emphasis draws in it.
