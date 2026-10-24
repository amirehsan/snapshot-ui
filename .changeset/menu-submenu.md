---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Menu exports SubmenuTrigger: put a MenuItem and a Menu inside it for a submenu, opened by Arrow Right (Arrow Left in right to left); the item draws a chevron after its end value and keeps its wash while the submenu is open. The submenu opens beside its row with its first row level with it, and under the row where neither side has room. A Menu with no `placement` now takes its trigger's, `end top` under a SubmenuTrigger and still `bottom start` under a MenuTrigger or a trigger that names none, so no menu that opened in 0.9 moves. The submenu's rules are in `menu.css` in `styles.css`.
