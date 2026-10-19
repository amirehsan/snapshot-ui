---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add CopyButton: copies a string your page already holds, such as an answer or a setup address. A ghost icon button with a tooltip by default, or `look="button"` for a secondary button with its word. For two seconds the icon turns to a check and the tooltip and a polite status say "Copied" (or "Copy failed"); the status says it once per copy, the button's name never changes and focus stays on it. Where the Clipboard API is missing or refuses, as over plain http or in a frame that blocks it, it copies with the browser's copy command instead. Name it for what it copies (`labels={{ copy: 'Copy answer' }}`); `onCopy(copied)` tells you how each copy went. `className` and `style` go on the root, `span.copy-button`, which holds the button and its status; `ref` goes on the button. `value` is in your HTML, so never pass a value the page should not hold. In a DescriptionList, put it in a row's `actions`. Keep it outside any `aria-busy` region. `copy-button.css` in `styles.css`.
