---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add AppShell, the frame an app runs in: a skip link, the sidebar, header and bottom bar slots, a sticky header wrapper and `<main>`, the collapsed and drawer states controlled or uncontrolled (`isSidebarCollapsed`, `defaultSidebarCollapsed`, `onSidebarCollapsedChange`, `isDrawerOpen`, `defaultDrawerOpen`, `onDrawerOpenChange`), `data-sidebar="collapsed"` on the root so a server paints the right width from a cookie, the workspace offset and the bottom reserve, and `useAppShell()`.
