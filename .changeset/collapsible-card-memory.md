---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Let a CollapsibleCard remember its fold. Given a `storageKey`, the card keeps its fold in this browser, in one `localStorage` entry, and cards with the same key fold together, on the page and in other tabs. A controlled card stores nothing. On a server-rendered page a remembered card renders open and folds as the page hydrates, with no transition.
