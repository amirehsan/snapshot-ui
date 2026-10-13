---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add Toast: `toast({ title, description, tone, action, timeout })` returns an id, `toast.dismiss(id)` and `toast.clear()`, and `<ToastRegion />`, mounted once at the app root. Four tones with a stripe, 6 seconds (12 for errors), a toast with an action stays until it is used, errors are assertive and the rest are announced politely through a status region that exists before its text, hover and focus pause the timers, and the region sits above every modal. React Aria's toast parts are `UNSTABLE_` in react-aria-components 1.22, so `@snapshot-ui/react` now pins it to exactly 1.22.1; a bump is a deliberate change with a test run behind it. If your app installs `react-aria-components` itself, pin it to exactly 1.22.1 too, with no range, so the app and the library share one copy of React Aria.
