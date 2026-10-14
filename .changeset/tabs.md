---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Tabs, TabList, Tab and TabPanel: views of one page as a row of pills in a canvas track, the selected tab the ink pill. Tabs that switch a panel use automatic activation. Tabs that are links take `href` on each `Tab`, `selectedKey` from the URL and `keyboardActivation="manual"`, so the arrows move focus and Enter, Space or a press follows the link through `RouterProvider`, and Space never scrolls the page; render one `TabPanel` for the route's content. `isChanged` on a `Tab` draws a clay dot, read as "Changed" (`changedLabel`), for a panel with unsaved edits only. A `Badge` in a tab takes the tab's color, so it reads on the ink pill and under the pointer. A disabled tab is taupe, and a disabled tab that is selected is a taupe pill. A row that does not fit scrolls inside itself and brings the selected tab into view after hydration, and again whenever the selection moves while its tab does not hold focus, as Back does with link tabs. New exports: `Tabs`, `TabList`, `Tab`, `TabPanel`, `TabsProps`, `TabListProps`, `TabProps` and `TabPanelProps`. `tabs.css` in `styles.css`.
