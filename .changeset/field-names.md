---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Breaking type change: every field's props now require an accessible name. TextField, TextArea, CheckboxGroup and RadioGroup need a `label`, an `aria-label` or an `aria-labelledby`, and Checkbox, Switch and Radio need their text as `children`, an `aria-label` or an `aria-labelledby`, as SegmentedControl and IconButton already did. SegmentedControlItem keeps `children` required. Code that renders a field with no visible label, `aria-label` or `aria-labelledby` stops compiling. Nothing changes at run time. Because those props types are now unions, which cannot be extended, each of these fields also exports its base props type, such as `TextFieldBaseProps`, for code that extends or omits from them.
