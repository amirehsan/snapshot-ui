---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add the density axis: `data-density="compact"` on any element remaps `--size-control` (40px, 36px compact, 44px compact on a coarse pointer), `--size-field` (48px, 36px, 44px) and `--spacing-card` (32px, 20px) for its subtree, generated like `data-shape`; `--size-target` is the 40px floor every hit area is extended to. Add `--spacing-inset` (16px, how far floating chrome sits from the viewport edge), `--container-sidebar` (20rem, 6.5rem under `data-sidebar="collapsed"`) and the `--z-header` (20) and `--z-chrome` (30) z-index tokens. `p-card`, `gap-inset` and `max-w-sidebar` join the Tailwind theme.
