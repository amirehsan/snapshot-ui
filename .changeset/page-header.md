---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add PageHeader and PageColumn: a page's `title` as its one h1 (`headingLevel` lowers it and keeps its size for a header that is not the page's own), with `breadcrumbs`, an `eyebrow`, a `description` and `actions` that sit at the end of the title's line and wrap under it only when the title would keep less than 20rem. Its fill spans its holder at 80% of the canvas with a blur, solid under reduced transparency and more contrast, and its row is a page column. It sticks only in AppShell's `header` slot. PageColumn holds the page under it, so the content starts where the title does and ends where the actions end. Both are static, so a server component renders them. The tokens gain `container.page`, 82.5rem with its inline padding, as `--container-page`; Tailwind's `max-w-page` and `max-w-(--container-page)` both give the page column's width, and `p-page` stays the spacing step. Exports `PageHeader`, `PageColumn` and the types `PageHeaderProps` and `PageColumnProps`. `page-header.css` in `styles.css`.
