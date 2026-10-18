---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Pagination takes a page size picker: pass `pageSize` and `onPageSizeChange(pageSize, page)` together, with `pageSizeOptions` (10, 25, 50 and 100 by default), and the row starts with a native `select` labelled "Rows per page" (`labels.pageSize`), drawn as the library's fields are, its options written with `pageLabel` and the current size always among them. `onPageSizeChange` gets the page that holds the first row of the current page at the new size, so the reader keeps their place. It calls a function, so render Pagination from a client component to show it; a server page renders Pagination without it, as before. Without `onPageSizeChange` nothing is drawn differently, and Pagination ships no React Aria list or popover for it. Keep the size in the URL beside the page.
