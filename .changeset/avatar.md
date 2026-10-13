---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Avatar: a person, a merchant or a bank as an image over its initials, at 24, 32 and 40px (`size` `sm`, `md`, `lg`), a circle for a person or a square for a logo (`shape`), with one neutral fallback, initials from the first two words of `name` or from `initials`, and `isDecorative` for an avatar beside its name. A failed image shows the initials; the image stays hidden until it has loaded, so the initials show before the page hydrates. `avatar.css` in `styles.css`.
