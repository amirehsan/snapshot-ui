---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add AppShell, the frame an app runs in: a skip link, the sidebar, header and bottom bar slots, a sticky header wrapper and `<main>`, the collapsed and drawer states controlled or uncontrolled (`isSidebarCollapsed`, `defaultSidebarCollapsed`, `onSidebarCollapsedChange`, `isDrawerOpen`, `defaultDrawerOpen`, `onDrawerOpenChange`), `data-sidebar="collapsed"` on the root so a server paints the right width from a cookie, the workspace offset and the bottom reserve, and `useAppShell()`.

Add Sidebar and its parts (`SidebarGroup`, `SidebarItem`, `SidebarBrand`, `SidebarSearch`, `SidebarTrigger`, `useSidebar()`): a floating rail of labelled groups of links with an icon, a label, a count and `aria-current`, collapsed to a 72px icon rail with the names as tooltips, and a drawer below 1024px on Drawer. `app-shell.css` and `sidebar.css` in `styles.css`.
