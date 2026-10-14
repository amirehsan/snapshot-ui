---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Pagination: Previous, numbered pages with gaps and Next beside `rangeLabel`, the range you format ("1 to 50 of 1,284"), in seven slots that never move. In link mode pass `getPageHref` from a server component: Pagination has no client directive, runs your functions (`getPageHref`, `pageLabel`, `labels.page`) where it renders, and only its controls and its status are client components. In button mode pass `onPageChange` from a client component. The range is spoken once, 600ms after it last changed, and never on load. Under a 30rem container the numbers leave and the row is Previous, the range and Next. `pageLabel` writes page numbers in other digits; `hasPageNumbers={false}` gives the short form, Previous, the range and Next at every width. New exports: `Pagination`, `PaginationProps` and `PaginationLabels`. `pagination.css` in `styles.css`.
