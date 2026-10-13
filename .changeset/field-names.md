---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Breaking type change: every field's props now require an accessible name. TextField, TextArea, CheckboxGroup and RadioGroup need a `label`, an `aria-label` or an `aria-labelledby`, and Checkbox, Switch and Radio need their text as `children`, an `aria-label` or an `aria-labelledby`, as SegmentedControl and IconButton already did. SegmentedControlItem keeps `children` required. Code that renders a field with no visible label, `aria-label` or `aria-labelledby` stops compiling. Nothing changes at run time. Because those props types are now unions, which cannot be extended, each of these fields also exports its base props type, such as `TextFieldBaseProps`, for code that extends or omits from them.

A field with no name stops compiling. TypeScript's message then either says that the props object (often `{}`) is not assignable to the field's props, or names only `aria-labelledby` as missing. Both mean the field has no accessible name. The fix is a `label` (`children` for Checkbox, Radio and Switch), an `aria-label`, or an `aria-labelledby` that points at a label shown elsewhere.

The rule checks that a name key is present, not that it holds a name. A key whose value is `undefined` at run time, such as `label={undefined}`, still compiles, and so does an empty `aria-label`.

To write a wrapper that passes the rule on, extend or omit from the field's base props type and intersect the result with the exported `AccessibleName<'label'>` (`AccessibleName<'children'>` for Checkbox, Radio and Switch), for example `Omit<TextFieldBaseProps, 'description'> & AccessibleName<'label'>`. `AccessibleName` and `AriaName` are exported from the package as types only, so they add nothing to the bundle.
