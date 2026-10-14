---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add DateRangePicker: two dates typed into React Aria's segments in the locale's order or chosen on the range calendar in a popover, with your `presets`, as ISO strings (`{ start, end }`, and `onChange(null)` once a date is cleared or while the end is typed before the start, when a controlled field keeps what is typed until the app sets another value or focus leaves it) and two hidden inputs under `startName` and `endName` that submit ISO dates. Day granularity only. Before hydration the field shows the frame, the calendar button and your `valueLabel`, since the segments' text, order and names come from `Intl`; pass `valueLabel` where the server's HTML should show the range. Pass `today` from your user's time zone: the calendar opens on its month when there is no range. `labels` names the calendar button and the two dates. React Aria formats the chosen range for its spoken description while it renders, into an element made after hydration, never the HTML. `date-range-picker.css` in `styles.css`.
