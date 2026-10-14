---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Tabs, TabList, Tab and TabPanel: views of one page as a row of pills in a canvas track, the selected tab the ink pill. Tabs that switch a panel use automatic activation. Tabs that are links take `href` on each `Tab`, `selectedKey` from the URL and `keyboardActivation="manual"`, so the arrows move focus and Enter follows the link through `RouterProvider`; render one `TabPanel` for the route's content. `isChanged` on a `Tab` draws a clay dot, read as "Changed" (`changedLabel`), for a panel with unsaved edits only. A row that does not fit scrolls inside itself and brings the selected tab into view after hydration. `tabs.css` in `styles.css`.
