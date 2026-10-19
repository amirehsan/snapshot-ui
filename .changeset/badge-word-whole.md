---
'@snapshot-ui/core': patch
---

A badge's word never breaks, and in a flex row the badge never shrinks below it: beside a title that wraps on a phone, "New" stays on one line, with no `shrink-0` needed on the badge or its holder. A label of several words still wraps between its words when its holder is narrower than the whole label, and a single word longer than the badge's holder still breaks inside the outline, so a badge never pushes the page sideways. The badge is now an inline block with `overflow-wrap: break-word`, where it was an inline flex box with `overflow-wrap: anywhere`.
