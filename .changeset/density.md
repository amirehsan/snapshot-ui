---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add the density axis: `data-density="compact"` on any element remaps `--size-control` (40px, 36px compact, 44px compact on a coarse pointer), `--size-field` (48px, 36px, 44px) and `--spacing-card` (32px, 20px) for its subtree, generated like `data-shape`; `--size-target` is the 40px floor every hit area is extended to. Add `--spacing-inset` (16px, how far floating chrome sits from the viewport edge), `--container-sidebar` (20rem, 6.5rem under `data-sidebar="collapsed"`) and the `--z-header` (20) and `--z-chrome` (30) z-index tokens. `p-card`, `gap-inset` and `max-w-sidebar` join the Tailwind theme.

Button, IconButton, SegmentedControl, the text input and Card read the tokens: 36px controls, 36px fields and 20px card padding under `data-density="compact"`, 44px on a touch screen. Comfortable renders exactly as 0.1.0. The overlays' 16px edge inset is `--spacing-inset`.
