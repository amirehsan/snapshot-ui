---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add ThemeSwitch and ThemeMenu: System, Light and Dark, as a segmented control (or `look="radio"`) for a Settings row, and as a Theme submenu (or `display="section"`) in a menu. Both are controlled: pass the reader's choice as `value`, or `null` until you know it, and handle `onChange`. They read and write nothing else: no storage, no cookie, no script. Read your theme cookie on the server and write `data-theme="light"` or `"dark"` on `<html>`, nothing for System, so the first paint is right; in `onChange`, set the attribute at once and write the cookie, for example through a server action. A theme applies at once and is never part of a form's save. The icons before each choice are sized by `segmented-icon` and `radio-icon` in `styles.css`.
