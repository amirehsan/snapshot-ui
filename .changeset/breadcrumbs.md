---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Breadcrumbs and Breadcrumb: a navigation landmark of links to the pages above this one, through your RouterProvider, with the current page last, as text marked `aria-current="page"`. Each Breadcrumb draws its own item, so one a component of yours or a server component renders works too; a crumb without `href` is the current page, and a trail that marks another or none warns. Real links in the server's HTML. A long link ends in an ellipsis past 16rem and shows whole while focused; the current page wraps and is never cut. Under 768px the trail is one link to the parent, a back chevron and its text, named "Back to Documents"; `backLabel` names it in your words, as a template a server component can pass, `'Back to {parent}'` by default, or a function from a client one. Focus on a crumb the phone does not draw goes to the back link as the window narrows. Exports `Breadcrumbs`, `Breadcrumb` and the types `BreadcrumbsProps` and `BreadcrumbProps`. `breadcrumbs.css` in `styles.css`.
