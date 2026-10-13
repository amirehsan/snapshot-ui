---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add BottomTabBar and BottomTabBarItem: three to five destinations docked at the bottom of a phone with the safe area padded inside, each with an icon, a one-line label, a count chip and an ink-pill current state, links through React Aria's Link (so `RouterProvider` and `render` apply) and a button item a `SheetTrigger` can wrap, hidden from 1024px up by CSS. Inside an AppShell the page keeps 64px plus the safe area clear under its content. Four labels such as Home, Transactions, Goals and More fit at 375px; "Transactions" ellipsizes at 320px and its name is never cut. The safe area needs `viewportFit: 'cover'`. `tab-bar.css` in `styles.css`.
