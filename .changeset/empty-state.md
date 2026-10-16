---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add EmptyState: what a page or a table shows where it has nothing yet. A `title` that says what is missing, a `description` that says what to do, your own Lucide `icon` drawn at 24px in slate and hidden from assistive technology, and one `action`, such as a Button that clears the filters. The text is ink and slate, never a placeholder's taupe. `headingLevel` (2 to 4, 3 by default) fits it to your page's outline. It is static, so a server component renders it with no client JavaScript; pass it to DataTable's `emptyState`, or as `error` with a Retry action. Exports `EmptyState` and the type `EmptyStateProps`. `empty-state.css` in `styles.css`.
