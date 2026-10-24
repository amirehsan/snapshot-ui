---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Accordion and AccordionItem: sections that open and fold, on React Aria's DisclosureGroup. Several items stay open at once by default; `allowsMultipleExpanded={false}` keeps one open at a time. Give every `AccordionItem` an `id`; `defaultExpandedKeys` opens items at first, and `expandedKeys` with `onExpandedChange` controls them. A folded section shows the clay changed dot for an unsaved field inside, opens itself when a field inside fails on submit, and opens when find-in-page lands in it. Arrow Up, Arrow Down, Home and End move between titles. `hasExpandAll` adds "Show all sections". Folded sections print open. Titles are `h3` by default (`level`). `accordion.css` in `styles.css`.
